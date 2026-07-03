import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { MOCK_PEOPLE } from '@/mocks/people'
import { Plus, History, Search, FlaskConical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { FilterMultiSelect } from '@/components/ui/filter-multiselect'
import { DEPTS } from '@/lib/positions/roles'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { makeSeedCells, SEED_ACTIVITY, type ActivityItem } from '@/lib/positions/seed'
import { type Cells, isPastDueMonth } from '@/lib/positions/model'
import { TIMELINE, monthFull, CURRENT_KEY, TODAY } from '@/lib/positions/time'
import { unifiedRows, groupByDept, recordsForRow, needsReviewItems, needsReviewCount, planGrid, rollup, earliestOpenIdx, deptRollup, roleRollup, seedNotes, type PosRow, type ReviewItem, type PosNote } from './positions/lib'
import { PositionsTable } from './positions/PositionsTable'
import { PositionDetailPanel } from './positions/PositionDetailPanel'
import { NeedsReview } from './positions/NeedsReview'
import { PlanGrid } from './positions/PlanGrid'
import { PlanToolbar } from './positions/PlanToolbar'
import { MetricCards } from './positions/MetricCards'
import { CreateDialog } from './positions/CreateDialog'
import { CreateDialogList, type CreateLine } from './positions/CreateDialogList'
import { CloseWizard } from './positions/CloseWizard'
import { OpenRequestWizard } from './positions/OpenRequestWizard'
import { ChangeLog } from './positions/ChangeLog'
import { SearchEmpty } from './positions/EmptyState'
import { ToastProvider, useToast } from './positions/toast'
import { openRequestAt, createPositions, closeByIds } from './positions/mutations'

export default function PositionsPage() {
  return (
    <ToastProvider>
      <PositionsPageInner />
    </ToastProvider>
  )
}


function PositionsPageInner() {
  const navigate = useNavigate()
  const { push } = useToast()
  const [tab, setTab] = useState('plan')
  const [posDept, setPosDept] = useState<string[]>([])
  const [posStatus, setPosStatus] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string | null>(null)

  const [cells, setCells] = useState<Cells>(() => makeSeedCells())
  const [activity, setActivity] = useState<ActivityItem[]>(() => SEED_ACTIVITY)
  const [logOpen, setLogOpen] = useState(false)
  const log = useCallback((action: string) => {
    setActivity((a) => [{ id: Date.now() + Math.random(), actor: 'Volodymyr S.', action, ts: 'Just now' }, ...a])
  }, [])
  const sections = useMemo(
    () => {
      let rows = unifiedRows(cells, search, 'All', false)
      if (posDept.length) rows = rows.filter((r) => posDept.includes(r.dept))
      if (posStatus.length) rows = rows.filter((r) => posStatus.some((s) =>
        s === 'filled' ? r.filled > 0 :
        s === 'open' ? r.open > 0 :
        s === 'pending' ? r.pending > 0 :
        s === 'noreq' ? r.noReq > 0 : false
      ))
      return groupByDept(rows)
    },
    [cells, search, posDept, posStatus],
  )
  const allReviewItems = useMemo(() => needsReviewItems(cells), [cells])
  const [reviewDept, setReviewDept] = useState<string[]>([])
  const [reviewKind, setReviewKind] = useState<string[]>([])
  const reviewItems = useMemo(() => {
    let items = allReviewItems
    if (reviewDept.length) items = items.filter((i) => reviewDept.includes(i.dept))
    if (reviewKind.length) items = items.filter((i) => reviewKind.includes(i.kind))
    return items
  }, [allReviewItems, reviewDept, reviewKind])
  const reviewCount = useMemo(() => needsReviewCount(cells), [cells])

  // Plan grid: windowed range, default to earliest open month.
  const [planDept, setPlanDept] = useState('All')
  const [WIN, setWIN] = useState(6)
  const [startIdx, setStartIdx] = useState(() => earliestOpenIdx(makeSeedCells()))
  const planMonths = useMemo(() => TIMELINE.slice(startIdx, startIdx + WIN).map((m) => m.key), [startIdx, WIN])
  // Atomic range apply — length + start together, clamped against the *new* length.
  const applyRange = useCallback((start: number, len: number) => {
    setWIN(len)
    setStartIdx(Math.max(0, Math.min(TIMELINE.length - len, start)))
  }, [])
  const planGroups = useMemo(() => planGrid(cells, planMonths, search, planDept), [cells, planMonths, search, planDept])
  const planRollups = useMemo(() => planGroups.map((g) => ({
    dept: g.dept,
    ...deptRollup(cells, g.dept, planMonths),
    roleRollups: Object.fromEntries(g.rows.map((r) => [r.title, roleRollup(cells, r.title, planMonths)])),
  })), [planGroups, cells, planMonths])
  const shiftWin = (d: number) => setStartIdx((i) => Math.max(0, Math.min(TIMELINE.length - WIN, i + d)))
  const planRangeLabel = `${(TIMELINE[startIdx]?.full ?? '').replace(' 20', " '")} – ${(TIMELINE[Math.min(startIdx + WIN - 1, TIMELINE.length - 1)]?.full ?? '').replace(' 20', " '")}`
  const metrics = useMemo(() => rollup(cells), [cells])

  const [selectedRow, setSelectedRow] = useState<PosRow | null>(null)
  const records = useMemo(
    () => (selectedRow ? recordsForRow(cells, selectedRow.id) : []),
    [cells, selectedRow],
  )
  const onRowClick = (row: PosRow) => {
    setSelectedRow((cur) => (cur && cur.id === row.id ? null : row))
    setSelected((s) => (s === row.id ? null : row.id))
  }

  // Undo-aware mutation runner: snapshot cells, apply, toast with undo.
  const run = useCallback((mutate: (cs: Cells) => Cells, logMsg: string, toast: { title: string; desc: string }) => {
    setCells((prev) => {
      const next = mutate(prev)
      push({ title: toast.title, desc: toast.desc, onUndo: () => { setCells(prev); setActivity((a) => a.filter((e) => e.action !== logMsg)) } })
      return next
    })
    log(logMsg)
  }, [push, log])

  // Queue actions
  // Review rows are location-grain — wizards open pre-scoped to the row's exact records.
  const reviewOpenReq = useCallback((it: ReviewItem) => {
    const row = unifiedRows(cells, '', 'All', false).find((r) => r.id === it.rowId)
    if (row) { setReqScope(it.recIds); setReqRow(row) }
  }, [cells])
  const reviewClose = useCallback((it: ReviewItem) => {
    const row = unifiedRows(cells, '', 'All', false).find((r) => r.id === it.rowId)
    if (row) { setCloseScope(it.recIds); setCloseRow(row) }
  }, [cells])

  // Panel per-group actions — open the matching wizard scoped to the chosen records.
  const panelOpenRequest = useCallback((recIds: string[]) => {
    if (!selectedRow) return
    setReqScope(recIds); setReqRow(selectedRow)
  }, [selectedRow])
  const panelClose = useCallback((recIds: string[]) => {
    if (!selectedRow) return
    setCloseScope(recIds); setCloseRow(selectedRow)
  }, [selectedRow])

  // Notes per role-month row — seeded mocks, overridden once the user adds one.
  const [notesMap, setNotesMap] = useState<Record<string, PosNote[]>>({})
  const notesFor = useCallback((id: string) => notesMap[id] ?? seedNotes(id), [notesMap])
  const noteDate = `${TODAY.slice(8, 10)}.${TODAY.slice(5, 7)}.${TODAY.slice(0, 4)}`
  const addNote = useCallback((text: string) => {
    if (!selectedRow) return
    const id = selectedRow.id
    setNotesMap((m) => {
      const cur = m[id] ?? seedNotes(id)
      return { ...m, [id]: [{ id: `${id}-note-${cur.length}-user`, author: 'Volodymyr S.', date: noteDate, text, isNew: true }, ...cur] }
    })
  }, [selectedRow, noteDate])
  // Table rows read the same notes source, so added notes show up in the Notes column too.
  const sectionsWithNotes = useMemo(
    () => sections.map((s) => ({ ...s, rows: s.rows.map((r) => (notesMap[r.id] ? { ...r, notes: notesMap[r.id].length } : r)) })),
    [sections, notesMap],
  )

  // Close wizard
  const [closeRow, setCloseRow] = useState<PosRow | null>(null)
  const [closeScope, setCloseScope] = useState<string[] | null>(null) // record ids to close, or null = all active
  const closeRecordsList = useMemo(() => (closeRow ? recordsForRow(cells, closeRow.id) : []), [cells, closeRow])
  // Month-aware normalisation, same as the panel: in a past month an open record
  // with a request is past due — the wizard must label it that way too.
  const closeActive = closeRecordsList
    .filter((r) => (r.status === 'open' || r.status === 'pending') && (!closeScope || closeScope.includes(r.id)))
    .map((r) => (closeRow && isPastDueMonth(closeRow.mk) && r.status === 'open' && !r.noReq ? { ...r, status: 'pending' as const } : r))
  const closeFilled = closeRecordsList.filter((r) => r.status === 'started' || r.status === 'accepted').length
  const onCloseConfirm = useCallback((ids: string[], reason: string) => {
    if (!closeRow) return
    const r = closeRow
    run((cs) => closeByIds(cs, r.title, r.mk, ids, reason),
      `closed ${ids.length} × ${r.title} for ${r.monthLabel}, "${reason}"`,
      { title: `Closed ${ids.length} ${ids.length === 1 ? 'position' : 'positions'}`, desc: `${r.title} closed. See the change log for history.` })
  }, [closeRow, run])

  // Open-request wizard (same select-inside-modal pattern as Close)
  const [reqRow, setReqRow] = useState<PosRow | null>(null)
  const [reqScope, setReqScope] = useState<string[] | null>(null) // record ids, or null = all
  const reqRecordsList = useMemo(() => (reqRow ? recordsForRow(cells, reqRow.id) : []), [cells, reqRow])
  const reqActive = useMemo(() => {
    if (!reqRow) return []
    return reqRecordsList.filter((r) =>
      (r.status === 'open' || r.status === 'pending') && r.noReq && (!reqScope || reqScope.includes(r.id)))
  }, [reqRow, reqRecordsList, reqScope])
  const onOpenReqConfirm = useCallback((ids: string[], targetISO: string | null) => {
    if (!reqRow) return
    const r = reqRow
    const n = ids.length
    const target = targetISO || `${CURRENT_KEY}-01`
    const tLabel = monthFull(target.slice(0, 7))
    run((cs) => ids.reduce((acc, id) => openRequestAt(acc, r.title, r.mk, id, target), cs),
      `raised a hiring request for ${n} × ${r.title}, target start ${tLabel}, sent to Spark`,
      { title: `Raised ${n} ${n === 1 ? 'request' : 'requests'}`, desc: `${r.title} sent to Spark, target start ${tLabel}.` })
  }, [reqRow, run])

  // Create
  const [createOpen, setCreateOpen] = useState(false)
  const [createPrefill, setCreatePrefill] = useState<string | undefined>(undefined)
  const onCreate = useCallback((title: string, raiseRequest: boolean, startISO: string | null, loc: { India: number; Europe: number; "North America": number }, total: number) => {
    const n = total
    const msg = raiseRequest
      ? `opened ${n} × ${title}${startISO ? `, target start ${monthFull(startISO.slice(0, 7))}` : ''}, sent to Spark`
      : `added ${n} × ${title} as an internal move, no hiring request`
    run((cs) => createPositions(cs, title, raiseRequest, startISO, loc, total), msg,
      { title: `Opened ${n} ${n === 1 ? 'position' : 'positions'}`, desc: raiseRequest ? `${title} sent to Spark for recruiting.` : `${title} added as an internal move.` })
  }, [run])
  const openCreateFor = (title: string) => { setCreatePrefill(title); setCreateOpen(true) }

  // Experimental list-based create (AJ's proposal) — flask button, for comparison testing.
  const [createListOpen, setCreateListOpen] = useState(false)
  const onCreateList = useCallback((lines: CreateLine[], raiseRequest: boolean, startISO: string | null) => {
    const total = lines.reduce((s, l) => s + l.count, 0)
    const roles = new Set(lines.map((l) => l.title)).size
    const locFor = (l: CreateLine) => ({
      India: l.loc === 'India' ? l.count : 0,
      Europe: l.loc === 'Europe' ? l.count : 0,
      'North America': l.loc === 'North America' ? l.count : 0,
    })
    const msg = raiseRequest
      ? `opened ${total} positions across ${roles} ${roles === 1 ? 'role' : 'roles'}${startISO ? `, target start ${monthFull(startISO.slice(0, 7))}` : ''}, sent to Spark`
      : `added ${total} positions across ${roles} ${roles === 1 ? 'role' : 'roles'} as internal moves, no hiring request`
    run((cs) => lines.reduce((acc, l) => createPositions(acc, l.title, raiseRequest, startISO, locFor(l), l.count), cs), msg,
      { title: `Opened ${total} ${total === 1 ? 'position' : 'positions'}`, desc: raiseRequest ? `${roles} ${roles === 1 ? 'role' : 'roles'} sent to Spark for recruiting.` : 'Added as internal moves.' })
  }, [run])

  // Plan grid cell -> open the detail panel for that role-month
  const openCellPanel = (title: string, mk: string) => {
    const id = `${title}|${mk}`
    const row = unifiedRows(cells, '', 'All', false).find((r) => r.id === id)
    if (row) { setSelectedRow(row); setSelected(row.id) }
  }

  return (
    <div className="h-full p-[10px] pt-[60px] flex gap-[10px] overflow-x-auto">
      <div className="bg-background border border-border rounded-lg shadow-sm flex-1 h-full flex flex-col min-w-0 overflow-hidden">
        <div className="overflow-y-auto scrollbar-minimal">
          <div className="px-5 pt-5 pb-6">
            {/* Header */}
            <div className="flex items-center justify-between w-full mb-6">
              <div className="flex flex-col gap-1">
                <h1 className="text-lg font-semibold tracking-tight">Positions</h1>
                <p className="text-sm text-muted-foreground">
                  Headcount by role and department. Plan shows hiring activity by target month.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setLogOpen((o) => !o)}><History /> Change log</Button>
                <Button size="sm" onClick={() => setCreateOpen(true)}><Plus /> New position</Button>
              </div>
            </div>

            <MetricCards r={metrics} onNeedsReview={() => setTab('needs')} />

            <Tabs value={tab} onValueChange={setTab}>
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <TabsList>
                    <TabsTrigger value="plan" className="flex-none">Plan</TabsTrigger>
                    <TabsTrigger value="positions" className="flex-none">Positions</TabsTrigger>
                    <TabsTrigger value="needs" className="flex-none">
                      Needs review
                      {reviewCount > 0 && <Badge variant="warning" className="ml-2">{reviewCount}</Badge>}
                    </TabsTrigger>
                  </TabsList>
                  {tab === 'plan' && (
                    <div className="relative w-[220px]">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" className="h-9 pl-8" />
                    </div>
                  )}
                </div>

                {tab === 'plan' && (
                  <PlanToolbar
                    rangeLabel={planRangeLabel}
                    startIdx={startIdx}
                    winLen={WIN}
                    onShift={shiftWin}
                    onApply={applyRange}
                    canLeft={startIdx > 0}
                    canRight={startIdx + WIN < TIMELINE.length}
                    dept={planDept}
                    onDept={setPlanDept}
                  />
                )}
                {tab === 'positions' && (
                  <div className="flex items-center gap-3">
                    <FilterMultiSelect label="Department" value={posDept} onChange={setPosDept}
                      options={DEPTS.filter((d) => d !== 'All').map((d) => ({ value: d, label: d }))} />
                    <FilterMultiSelect label="Status" value={posStatus} onChange={setPosStatus}
                      options={[{ value: 'filled', label: 'Filled' }, { value: 'open', label: 'Open' }, { value: 'pending', label: 'Past due' }, { value: 'noreq', label: 'No request' }]} />
                    <Input
                      placeholder="Search roles"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-[200px] h-9"
                    />
                  </div>
                )}
                {tab === 'needs' && (
                  <div className="flex items-center gap-3">
                    <FilterMultiSelect label="Department" value={reviewDept} onChange={setReviewDept}
                      options={DEPTS.filter((d) => d !== 'All').map((d) => ({ value: d, label: d }))} />
                    <FilterMultiSelect label="Status" value={reviewKind} onChange={setReviewKind}
                      options={[{ value: 'pending', label: 'Past due' }, { value: 'noreq', label: 'No request' }]} />
                  </div>
                )}
              </div>

              <TabsContent value="plan">
                <PlanGrid
                  groups={planGroups}
                  rollups={planRollups}
                  months={planMonths}
                  search={search}
                  onCellClick={openCellPanel}
                  onCreate={(t) => openCreateFor(t)}
                />
              </TabsContent>

              <TabsContent value="positions">
                {sectionsWithNotes.length === 0
                  ? <SearchEmpty query={search} />
                  : <PositionsTable sections={sectionsWithNotes} onRowClick={onRowClick} selectedId={selected} onRowClose={(r) => { setCloseScope(null); setCloseRow(r) }} />}
              </TabsContent>

              <TabsContent value="needs">
                <NeedsReview items={reviewItems} onOpenRequest={reviewOpenReq} onClose={reviewClose} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <PositionDetailPanel
        row={selectedRow}
        records={records}
        notes={selectedRow ? notesFor(selectedRow.id) : []}
        isOpen={!!selectedRow}
        onDismiss={() => { setSelectedRow(null); setSelected(null) }}
        onOpenRequest={panelOpenRequest}
        onCloseRecords={panelClose}
        onNewPosition={() => { if (selectedRow) openCreateFor(selectedRow.title) }}
        onAddNote={addNote}
        onPerson={(name: string) => {
          const match = MOCK_PEOPLE.find((p) => p.name === name)
          if (match) navigate(`/people?panel=${match.id}`)
          else navigate(`/people?q=${encodeURIComponent(name)}`)
        }}
      />

      <ChangeLog entries={activity} isOpen={logOpen} onClose={() => setLogOpen(false)} />

      <CreateDialog open={createOpen} onOpenChange={setCreateOpen} onCreate={onCreate} defaultTitle={createPrefill} />
      <CreateDialogList open={createListOpen} onOpenChange={setCreateListOpen} onCreate={onCreateList} />

      {/* Experimental list-based create — floating flask, deliberately out of the way. */}
      <button
        type="button"
        onClick={() => setCreateListOpen(true)}
        title="New positions (list-based, experimental)"
        aria-label="New positions (list-based, experimental)"
        className="fixed bottom-4 right-4 z-50 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground/50 shadow-sm transition-all hover:text-foreground hover:shadow-md"
      >
        <FlaskConical className="h-4 w-4" />
      </button>

      <CloseWizard
        open={!!closeRow}
        onOpenChange={(o) => { if (!o) { setCloseRow(null); setCloseScope(null) } }}
        title={closeRow?.title ?? ''}
        dept={closeRow?.dept ?? ''}
        monthLabel={closeRow?.monthLabel ?? ''}
        records={closeActive}
        filledCount={closeFilled}
        onConfirm={onCloseConfirm}
      />
      <OpenRequestWizard
        open={!!reqRow}
        onOpenChange={(o) => { if (!o) { setReqRow(null); setReqScope(null) } }}
        title={reqRow?.title ?? ''}
        dept={reqRow?.dept ?? ''}
        monthLabel={reqRow?.monthLabel ?? ''}
        records={reqActive}
        onConfirm={onOpenReqConfirm}
      />
    </div>
  )
}
