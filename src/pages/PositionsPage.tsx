import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { MOCK_PEOPLE } from '@/mocks/people'
import { Plus, History, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { FilterMultiSelect } from '@/components/ui/filter-multiselect'
import { DEPTS } from '@/lib/positions/roles'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { makeSeedCells, SEED_ACTIVITY, type ActivityItem } from '@/lib/positions/seed'
import { type Cells } from '@/lib/positions/model'
import { TIMELINE, monthFull, CURRENT_KEY } from '@/lib/positions/time'
import { unifiedRows, groupByDept, recordsForRow, needsReviewItems, needsReviewCount, planGrid, rollup, earliestOpenIdx, deptRollup, roleRollup, openRolesFlat, type PosRow, type ReviewItem } from './positions/lib'
import { PositionsTable } from './positions/PositionsTable'
import { PositionsFlatTable } from './positions/PositionsFlatTable'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { PositionDetailPanel } from './positions/PositionDetailPanel'
import { NeedsReview } from './positions/NeedsReview'
import { PlanGrid } from './positions/PlanGrid'
import { PlanToolbar } from './positions/PlanToolbar'
import { MetricCards } from './positions/MetricCards'
import { CreateDialog } from './positions/CreateDialog'
import { CloseWizard } from './positions/CloseWizard'
import { ExtendWizard } from './positions/ExtendWizard'
import { isPastDueMonth } from '@/lib/positions/model'
import { ChangeLog } from './positions/ChangeLog'
import { SearchEmpty } from './positions/EmptyState'
import { ToastProvider, useToast } from './positions/toast'
import { openRequestAt, extendOne, createPositions, closeByIds } from './positions/mutations'

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
  // Positions tab: "month" = role×month rows grouped by dept; "role" = flat all-open list.
  const [posGroupBy, setPosGroupBy] = useState<'month' | 'role'>('month')
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
  // Flat "all open positions" view: one row per role, aggregated across months.
  const flatRows = useMemo(() => {
    let rows = openRolesFlat(cells, search, 'All')
    if (posDept.length) rows = rows.filter((r) => posDept.includes(r.dept))
    return rows
  }, [cells, search, posDept])
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
  const planMonths = useMemo(() => TIMELINE.slice(startIdx, startIdx + WIN).map((m) => m.key), [startIdx])
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
  const reviewExtend = useCallback((it: ReviewItem) => {
    const id = `${it.title}|${it.mk}`
    const row = unifiedRows(cells, '', 'All', false).find((r) => r.id === id)
    if (row) { setExtendScope(null); setExtendRow(row); setExtendMode('extend') }
  }, [cells])
  const reviewOpenReq = useCallback((it: ReviewItem) => {
    const id = `${it.title}|${it.mk}`
    const row = unifiedRows(cells, '', 'All', false).find((r) => r.id === id)
    if (row) { setExtendScope(null); setExtendRow(row); setExtendMode('open') }
  }, [cells])
  const reviewClose = useCallback((it: ReviewItem) => {
    const id = `${it.title}|${it.mk}`
    const row = unifiedRows(cells, '', 'All', false).find((r) => r.id === id)
    if (row) { setCloseScope(null); setCloseRow(row) }
  }, [cells])

  // Panel per-group actions — open the matching wizard scoped to the chosen records.
  const panelExtend = useCallback((recIds: string[]) => {
    if (!selectedRow) return
    setExtendScope(recIds); setExtendMode('extend'); setExtendRow(selectedRow)
  }, [selectedRow])
  const panelOpenRequest = useCallback((recIds: string[]) => {
    if (!selectedRow) return
    setExtendScope(recIds); setExtendMode('open'); setExtendRow(selectedRow)
  }, [selectedRow])
  const panelClose = useCallback((recIds: string[]) => {
    if (!selectedRow) return
    setCloseScope(recIds); setCloseRow(selectedRow)
  }, [selectedRow])

  // Close wizard
  const [closeRow, setCloseRow] = useState<PosRow | null>(null)
  const [closeScope, setCloseScope] = useState<string[] | null>(null) // record ids to close, or null = all active
  const closeRecordsList = useMemo(() => (closeRow ? recordsForRow(cells, closeRow.id) : []), [cells, closeRow])
  const closeActive = closeRecordsList.filter((r) => (r.status === 'open' || r.status === 'pending') && (!closeScope || closeScope.includes(r.id)))
  const closeFilled = closeRecordsList.filter((r) => r.status === 'started' || r.status === 'accepted').length
  const onCloseConfirm = useCallback((ids: string[], reason: string) => {
    if (!closeRow) return
    const r = closeRow
    run((cs) => closeByIds(cs, r.title, r.mk, ids, reason),
      `closed ${ids.length} × ${r.title} for ${r.monthLabel}, "${reason}"`,
      { title: `Closed ${ids.length} ${ids.length === 1 ? 'position' : 'positions'}`, desc: `${r.title} closed. See the change log for history.` })
  }, [closeRow, run])

  // Extend / Open wizard (same select-inside-modal pattern as Close)
  const [extendRow, setExtendRow] = useState<PosRow | null>(null)
  const [extendMode, setExtendMode] = useState<'extend' | 'open'>('extend')
  const [extendScope, setExtendScope] = useState<string[] | null>(null) // record ids, or null = all
  const extendRecordsList = useMemo(() => (extendRow ? recordsForRow(cells, extendRow.id) : []), [cells, extendRow])
  const extendActive = useMemo(() => {
    if (!extendRow) return []
    const pastMonth = isPastDueMonth(extendRow.mk)
    return extendRecordsList.filter((r) =>
      (extendMode === 'open'
        ? (r.status === 'open' || r.status === 'pending') && r.noReq
        : (r.status === 'pending' || (pastMonth && r.status === 'open' && !r.noReq)))
      && (!extendScope || extendScope.includes(r.id))
    )
  }, [extendRow, extendMode, extendRecordsList, extendScope])
  const onExtendConfirm = useCallback((ids: string[], targetISO: string | null) => {
    if (!extendRow) return
    const r = extendRow
    const n = ids.length
    if (extendMode === 'open') {
      const target = targetISO || `${CURRENT_KEY}-01`
      const tLabel = monthFull(target.slice(0, 7))
      run((cs) => ids.reduce((acc, id) => openRequestAt(acc, r.title, r.mk, id, target), cs),
        `raised a hiring request for ${n} × ${r.title}, target start ${tLabel}, sent to Spark`,
        { title: `Raised ${n} ${n === 1 ? 'request' : 'requests'}`, desc: `${r.title} sent to Spark, target start ${tLabel}.` })
    } else {
      run((cs) => ids.reduce((acc, id) => extendOne(acc, r.title, r.mk, id), cs),
        `extended ${n} × ${r.title}, moved from ${r.monthLabel} to ${monthFull(CURRENT_KEY)}`,
        { title: `Extended ${n} ${n === 1 ? 'request' : 'requests'}`, desc: `Moved from ${r.monthLabel} to ${monthFull(CURRENT_KEY)}. No longer past due, recruiting continues.` })
    }
  }, [extendRow, extendMode, run])

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
                    onJump={(i) => setStartIdx(Math.max(0, Math.min(TIMELINE.length - WIN, i)))}
                    onSetLen={(len) => { setWIN(len); setStartIdx((i) => Math.max(0, Math.min(TIMELINE.length - len, i))) }}
                    canLeft={startIdx > 0}
                    canRight={startIdx + WIN < TIMELINE.length}
                    dept={planDept}
                    onDept={setPlanDept}
                  />
                )}
                {tab === 'positions' && (
                  <div className="flex items-center gap-3">
                    <SegmentedControl
                      value={posGroupBy}
                      onValueChange={(v) => setPosGroupBy(v as 'month' | 'role')}
                      options={[{ value: 'month', label: 'By month' }, { value: 'role', label: 'All open' }]}
                    />
                    <FilterMultiSelect label="Department" value={posDept} onChange={setPosDept}
                      options={DEPTS.filter((d) => d !== 'All').map((d) => ({ value: d, label: d }))} />
                    {posGroupBy === 'month' && (
                      <FilterMultiSelect label="Status" value={posStatus} onChange={setPosStatus}
                        options={[{ value: 'filled', label: 'Filled' }, { value: 'open', label: 'Open' }, { value: 'pending', label: 'Past due' }, { value: 'noreq', label: 'No request' }]} />
                    )}
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
                {posGroupBy === 'role'
                  ? (flatRows.length === 0
                      ? <SearchEmpty query={search} />
                      : <PositionsFlatTable rows={flatRows} onRowClick={(r) => { setSearch(r.title); setPosGroupBy('month') }} />)
                  : (sections.length === 0
                      ? <SearchEmpty query={search} />
                      : <PositionsTable sections={sections} onRowClick={onRowClick} selectedId={selected} onRowClose={setCloseRow} />)}
              </TabsContent>

              <TabsContent value="needs">
                <NeedsReview items={reviewItems} onExtend={reviewExtend} onOpenRequest={reviewOpenReq} onClose={reviewClose} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <PositionDetailPanel
        row={selectedRow}
        records={records}
        isOpen={!!selectedRow}
        onDismiss={() => { setSelectedRow(null); setSelected(null) }}
        onExtend={panelExtend}
        onOpenRequest={panelOpenRequest}
        onCloseRecords={panelClose}
        onPerson={(name: string) => {
          const match = MOCK_PEOPLE.find((p) => p.name === name)
          if (match) navigate(`/people?panel=${match.id}`)
          else navigate(`/people?q=${encodeURIComponent(name)}`)
        }}
      />

      <ChangeLog entries={activity} isOpen={logOpen} onClose={() => setLogOpen(false)} />

      <CreateDialog open={createOpen} onOpenChange={setCreateOpen} onCreate={onCreate} defaultTitle={createPrefill} />

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
      <ExtendWizard
        open={!!extendRow}
        onOpenChange={(o) => { if (!o) { setExtendRow(null); setExtendScope(null) } }}
        title={extendRow?.title ?? ''}
        dept={extendRow?.dept ?? ''}
        monthLabel={extendRow?.monthLabel ?? ''}
        mode={extendMode}
        records={extendActive}
        onConfirm={onExtendConfirm}
      />
    </div>
  )
}
