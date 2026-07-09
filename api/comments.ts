// Shared storage for prototype comments — Vercel serverless + Vercel KV (Upstash).
//
// To turn on real sync (one-time, ~5 min):
//   1. Vercel dashboard → Storage → Create → KV → connect to this project
//      (that injects KV_REST_API_URL / KV_REST_API_TOKEN into the deployment)
//   2. Project → Settings → Environment Variables → add VITE_COMMENTS_API=/api/comments
//   3. Redeploy. The client polls every 10s and pushes on write; localStorage
//      stays the offline fallback, Export/Import keeps working regardless.
//
// GET  /api/comments?build=<id>  → ProtoComment[]
// POST /api/comments             → upsert one comment (body = ProtoComment)

const KV_URL = process.env.KV_REST_API_URL
const KV_TOKEN = process.env.KV_REST_API_TOKEN

async function kv(cmd: (string | number)[]) {
  const res = await fetch(`${KV_URL}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd),
  })
  if (!res.ok) throw new Error(`kv ${cmd[0]} failed: ${res.status}`)
  return (await res.json()).result
}

export default async function handler(
  req: { method?: string; query?: Record<string, string | string[]>; body?: unknown },
  res: { status: (n: number) => { json: (b: unknown) => void; end: () => void } },
) {
  if (!KV_URL || !KV_TOKEN) {
    res.status(503).json({ error: 'KV not configured — see comments in api/comments.ts' })
    return
  }
  if (req.method === 'GET') {
    const build = String(req.query?.build ?? 'dev')
    const raw: string[] = (await kv(['HVALS', `proto-comments:${build}`])) ?? []
    res.status(200).json(raw.map((s) => JSON.parse(s)))
    return
  }
  if (req.method === 'POST') {
    const c = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body as { id?: string; buildId?: string })
    if (!c?.id || !c?.buildId) { res.status(400).json({ error: 'id and buildId required' }); return }
    await kv(['HSET', `proto-comments:${c.buildId}`, c.id, JSON.stringify(c)])
    res.status(200).json({ ok: true })
    return
  }
  res.status(405).end()
}
