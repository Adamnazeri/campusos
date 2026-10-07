import { useState } from 'react'
import { ApiError, api, downloadReport, fmtDay } from '../lib/api'
import { useFetch, useLive } from '../lib/live'
import { Icon } from '../lib/icons'
import { Avatar, Badge, Button, Card, cx, Meter, PageHeader, Select, useToast } from '../lib/ui'
import { StatCard, Toolbar } from '../components/common'
import { LineChart } from '../components/Charts'
import { useApp } from '../lib/store'
import { Modal, Field, Input } from '../lib/ui'

/* ============ OVERVIEW ============ */
export function Overview() {
  const { navigate } = useApp()
  const { push } = useToast()
  const { user, overview: ov, liveClasses, activity, teachers, conflicts } = useLive()
  const att = useFetch(() => api.attendanceOverview())
  const trend = (att.data?.trend ?? []).slice(-6).filter((t: { rate: number | null }) => t.rate !== null).map((t: { label: string; date: string; rate: number }) => ({ label: `${t.label} ${t.date.slice(8, 10)}`, value: t.rate }))
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const st = ov?.stats

  const quickActions = [
    { label: 'Add Teacher', icon: 'users' as const, go: () => navigate('teachers') },
    { label: 'Create Class', icon: 'book' as const, go: () => navigate('classes') },
    { label: 'Timetable', icon: 'calendar' as const, go: () => navigate('timetable') },
    { label: 'Announcement', icon: 'megaphone' as const, go: () => navigate('announcements') },
    { label: 'Generate Report', icon: 'file' as const, go: () => navigate('reports') },
  ]

  const stateMeta = {
    'in-progress': { tone: 'ok' as const, label: 'In progress', ring: 'border-l-ok' },
    starting: { tone: 'warn' as const, label: 'Starting soon', ring: 'border-l-warn' },
    cancelled: { tone: 'danger' as const, label: 'Cancelled', ring: 'border-l-danger' },
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-muted-foreground">{ov ? `${ov.day} · ${ov.date}` : '—'}</p>
          <h1 className="mt-1 font-display text-[26px] font-bold tracking-tight text-foreground">{greeting}, {user.name.split(' ')[0]}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Here's what's happening across {user.org.name} right now.</p>
        </div>
        <Button variant="primary" icon="plus" onClick={() => navigate('timetable')}>Take action</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Active classes" value={String(st?.activeClasses ?? '—')} icon="book" sub={`Across ${st?.branches ?? 0} branch${st?.branches === 1 ? '' : 'es'}`} />
        <StatCard label="Teachers on duty" value={String(st?.teachers ?? '—')} icon="users" sub={`${st?.teachersPresent ?? 0} present today`} />
        <StatCard label="Today's classes" value={String(st?.todaysClasses ?? '—')} deltaTone="neutral" icon="calendar" sub={`${st?.remainingToday ?? 0} remaining`} />
        <StatCard label="Attendance" value={st?.attendance.today ?? st?.attendance.week ? `${st.attendance.today ?? st.attendance.week}%` : '—'} icon="checkCircle" sub={st ? `${st.attendance.today ?? st.attendance.week ?? 0}% vs ${st.attendance.target}% target` : ''} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        {/* Live operations */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-ok live-dot" />
              <h2 className="font-display text-[15px] font-semibold text-card-foreground">Live operations</h2>
            </div>
            <div className="flex items-center gap-3 text-[12px] font-medium text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-ok" /> {liveClasses.filter(l=>l.state==='in-progress').length} live</span>
              <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-warn" /> {liveClasses.filter(l=>l.state==='starting').length} soon</span>
              <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-danger" /> {liveClasses.filter(l=>l.state==='cancelled').length} cancelled</span>
            </div>
          </div>

          {/* conflict banner */}
          {conflicts.length > 0 && (
            <button onClick={() => navigate('timetable')} className="flex w-full items-center gap-3 border-b border-danger/20 bg-danger-soft px-5 py-2.5 text-left">
              <Icon.alert width={17} height={17} className="text-danger" />
              <span className="flex-1 text-[13px] font-medium text-danger">{conflicts.length} schedule conflict{conflicts.length > 1 ? 's' : ''} — {conflicts[0].message}</span>
              <span className="text-[12px] font-semibold text-danger underline">Resolve</span>
            </button>
          )}

          <div className="divide-y divide-border">
            {liveClasses.length === 0 && <p className="px-5 py-8 text-center text-[13px] text-muted-foreground">No classes running or starting within the hour.</p>}
            {liveClasses.map((l) => {
              const m = stateMeta[l.state]
              return (
                <div key={l.id} className={cx('flex items-center gap-3 border-l-2 px-5 py-3', m.ring)}>
                  <div className="w-14 shrink-0 font-mono text-[12px] text-muted-foreground tnum">{l.time.split('–')[0]}</div>
                  <div className="min-w-0 flex-1">
                    <p className={cx('truncate text-sm font-semibold', l.state === 'cancelled' ? 'text-muted-foreground line-through' : 'text-card-foreground')}>{l.subject} · {l.className}</p>
                    <p className="mt-0.5 flex items-center gap-2 truncate text-[12px] text-muted-foreground">
                      <Icon.mapPin width={12} height={12} /> {l.room}
                      <span className="text-border-strong">·</span> {l.teacher}
                    </p>
                  </div>
                  <Badge tone={m.tone} dot>{m.label}</Badge>
                </div>
              )
            })}
          </div>
        </Card>

        <div className="flex flex-col gap-5">
          {/* Quick actions */}
          <Card className="p-4">
            <h2 className="mb-3 font-display text-[15px] font-semibold text-card-foreground">Quick actions</h2>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((a) => {
                const I = Icon[a.icon]
                return (
                  <button key={a.label} onClick={a.go} className="flex flex-col items-start gap-2 rounded-lg border border-border bg-surface-2 p-3 text-left transition-all hover:border-primary hover:bg-primary-soft">
                    <I width={18} height={18} className="text-primary" />
                    <span className="text-[13px] font-semibold text-foreground">{a.label}</span>
                  </button>
                )
              })}
              <button onClick={() => downloadReport('att').then(() => push({ title: 'Report downloaded', desc: 'Attendance summary (CSV).', tone: 'ok' })).catch((e) => push({ title: 'Report failed', desc: e instanceof ApiError ? e.message : undefined, tone: 'danger' }))} className="flex flex-col items-start gap-2 rounded-lg border border-dashed border-border p-3 text-left transition-all hover:border-primary">
                <Icon.plus width={18} height={18} className="text-muted-foreground" />
                <span className="text-[13px] font-semibold text-muted-foreground">More</span>
              </button>
            </div>
          </Card>

          {/* Attendance trend */}
          <Card className="p-4">
            <div className="mb-1 flex items-center justify-between">
              <h2 className="font-display text-[15px] font-semibold text-card-foreground">Attendance this week</h2>
              {att.data?.rate != null && <Badge tone="ok" dot>{att.data.rate}%</Badge>}
            </div>
            {trend.length > 1 ? <LineChart data={trend} min={Math.max(0, Math.floor(Math.min(...trend.map((t: { value: number }) => t.value)) - 3))} max={100} height={92} /> : <p className="py-6 text-center text-[12px] text-muted-foreground">Not enough attendance data yet.</p>}
          </Card>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        {/* Activity */}
        <Card className="p-5">
          <h2 className="mb-4 font-display text-[15px] font-semibold text-card-foreground">Recent activity</h2>
          <div className="relative pl-5">
            <div className="absolute left-[6px] top-1 bottom-1 w-px bg-border" />
            {activity.length === 0 && <p className="text-[13px] text-muted-foreground">No activity yet.</p>}
            {activity.map((a, i) => (
              <div key={i} className="relative mb-4 last:mb-0">
                <span className="absolute -left-[15px] top-1 h-2.5 w-2.5 rounded-full border-2 border-card bg-primary" />
                <p className="text-[13px] text-foreground">{a.text}</p>
                <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{a.time} · {a.by}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Workload snapshot */}
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-[15px] font-semibold text-card-foreground">Teacher workload</h2>
            <button onClick={() => navigate('workload')} className="text-[12px] font-semibold text-primary hover:underline">View all</button>
          </div>
          <div className="flex flex-col gap-3.5">
            {[...teachers].sort((a, b) => b.hours - a.hours).slice(0, 5).map((t) => {
              const pct = Math.min(100, (t.hours / 36) * 100)
              const tone = t.status === 'Overloaded' ? 'danger' : t.status === 'Heavy' ? 'warn' : 'ok'
              return (
                <button key={t.id} onClick={() => navigate('teacher-profile', t.id)} className="flex items-center gap-3 text-left">
                  <Avatar name={t.name} size={32} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="truncate text-[13px] font-semibold text-foreground">{t.name}</p>
                      <span className="font-mono text-[12px] text-muted-foreground tnum">{t.hours}h</span>
                    </div>
                    <Meter value={pct} tone={tone} className="mt-1.5" />
                  </div>
                  <Badge tone={tone as any}>{t.status}</Badge>
                </button>
              )
            })}
          </div>
        </Card>
      </div>
    </>
  )
}

/* ============ TIMETABLE ============ */
export function Timetable() {
  const { push } = useToast()
  const { sessions, days: DAYS, slots: SLOTS, conflicts, teachers, classes, rooms, refresh } = useLive()
  const [conflictOpen, setConflictOpen] = useState(true)
  const [view, setView] = useState<'week' | 'day'>('week')
  const [fTeacher, setFTeacher] = useState('')
  const [fClass, setFClass] = useState('')
  const [fRoom, setFRoom] = useState('')
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ classId: '', day: 'Mon', start: '09:00', duration: '60', room: '' })
  const [clash, setClash] = useState<string[] | null>(null)
  const [formErr, setFormErr] = useState<string | null>(null)
  const conflictIds = new Set(conflicts.flatMap((c) => c.sessionIds))
  async function submitSession(force: boolean) {
    setFormErr(null)
    if (!form.classId) { setFormErr('Choose a class.'); return }
    try {
      await api.addSession({ classId: form.classId, day: form.day, start: form.start, duration: Number(form.duration), roomId: form.room || undefined }, force)
      setAdding(false); setClash(null)
      push({ title: 'Session scheduled', tone: 'ok' })
      await refresh('timetable', 'overview')
    } catch (e) {
      if (e instanceof ApiError && e.code === 'CONFLICT') setClash(((e.extra.conflicts as { message: string }[]) ?? []).map((c) => c.message))
      else setFormErr(e instanceof ApiError ? e.message : 'Something went wrong')
    }
  }

  const subjectColor: Record<string, string> = {
    Mathematics: 'bg-info-soft text-info border-info/25',
    'Further Maths': 'bg-info-soft text-info border-info/25',
    Physics: 'bg-primary-soft text-primary border-primary/25',
    Biology: 'bg-ok-soft text-ok border-ok/25',
    English: 'bg-warn-soft text-warn border-warn/25',
    History: 'bg-danger-soft text-danger border-danger/25',
    'Computer Science': 'bg-muted text-foreground border-border-strong',
  }
  const visible = sessions.filter((s) => (!fTeacher || s.teacher === fTeacher) && (!fClass || s.className === fClass) && (!fRoom || s.room === fRoom))
  const cell = (day: string, slot: string) => visible.filter((s) => s.day === day && s.slot.slice(0, 2) === slot.slice(0, 2))

  return (
    <>
      <PageHeader
        title="Timetable"
        subtitle="Drag sessions to reschedule. Conflicts are flagged instantly."
        actions={<>
          <div className="hidden overflow-hidden rounded-lg border border-border sm:flex">
            {(['day', 'week'] as const).map((v) => (
              <button key={v} onClick={() => setView(v)} className={cx('px-3 py-1.5 text-[13px] font-semibold capitalize', view === v ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')}>{v}</button>
            ))}
          </div>
          <Button icon="plus" variant="primary" onClick={() => { setAdding(true); setClash(null); setFormErr(null) }}>Add session</Button>
        </>}
      />

      <Toolbar>
        <Select value={fTeacher} onChange={(e) => setFTeacher(e.target.value)}><option value="">All teachers</option>{teachers.map((t) => <option key={t.id}>{t.name}</option>)}</Select>
        <Select value={fClass} onChange={(e) => setFClass(e.target.value)}><option value="">All classes</option>{classes.map((c) => <option key={c.id}>{c.name}</option>)}</Select>
        <Select value={fRoom} onChange={(e) => setFRoom(e.target.value)}><option value="">All rooms</option>{rooms.map((r) => <option key={r.id}>{r.name}</option>)}</Select>
      </Toolbar>

      {conflictOpen && conflicts.length > 0 && (
        <Card className="mb-4 border-danger/30 bg-danger-soft p-0">
          <div className="flex flex-wrap items-center gap-3 p-4">
            <Icon.alert width={20} height={20} className="text-danger" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-danger">{conflicts.length} schedule conflict{conflicts.length > 1 ? 's' : ''}</p>
              {conflicts.slice(0, 3).map((c, i) => <p key={i} className="text-[13px] text-danger/90">{c.message}</p>)}
            </div>
            <Button size="sm" variant="outline" onClick={() => setConflictOpen(false)}>Dismiss</Button>
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[820px]">
            <div className="grid" style={{ gridTemplateColumns: `64px repeat(${DAYS.length}, 1fr)` }}>
              <div className="border-b border-r border-border bg-surface-2 p-2" />
              {DAYS.map((d) => (
                <div key={d} className="border-b border-r border-border bg-surface-2 p-2.5 text-center last:border-r-0">
                  <p className="text-sm font-semibold text-foreground">{d}</p>
                </div>
              ))}
              {SLOTS.map((slot) => (
                <div key={slot} className="contents">
                  <div className="border-b border-r border-border p-2 text-right font-mono text-[11px] text-muted-foreground">{slot}</div>
                  {DAYS.map((day) => {
                    const here = cell(day, slot)
                    return (
                      <div key={day + slot} className="flex min-h-[62px] flex-col gap-1 border-b border-r border-border p-1 last:border-r-0 transition-colors hover:bg-muted/40">
                        {here.map((s) => (
                          <div key={s.id} className={cx('flex-1 rounded-lg border px-2 py-1.5', conflictIds.has(s.id) ? 'border-danger bg-danger-soft ring-1 ring-danger' : subjectColor[s.subject] ?? 'bg-muted')}>
                            <p className="truncate text-[12px] font-semibold leading-tight">{s.subject}</p>
                            <p className="mt-0.5 truncate text-[10.5px] opacity-80">{s.className} · {s.room.replace('Room ', 'Rm ')}</p>
                            <p className="mt-0.5 truncate text-[10px] opacity-70">{s.teacher.split(' ')[0]}</p>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Modal open={adding} onClose={() => setAdding(false)} title="Add session" footer={<>
        <Button variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
        {clash ? <Button variant="danger" onClick={() => void submitSession(true)}>Schedule anyway</Button> : <Button variant="primary" onClick={() => void submitSession(false)}>Schedule</Button>}
      </>}>
        <div className="flex flex-col gap-4">
          <Field label="Class"><Select value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })}><option value="">Select a class…</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.subject}</option>)}</Select></Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Day"><Select value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })}>{DAYS.map((d) => <option key={d}>{d}</option>)}</Select></Field>
            <Field label="Start"><Input type="time" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} /></Field>
            <Field label="Duration"><Select value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })}><option value="45">45 min</option><option value="60">60 min</option><option value="90">90 min</option><option value="120">120 min</option></Select></Field>
          </div>
          <Field label="Room (defaults to the class room)"><Select value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })}><option value="">Class default</option>{rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</Select></Field>
          {formErr && <p className="text-[13px] font-medium text-danger">{formErr}</p>}
          {clash && <div className="rounded-lg border border-danger/30 bg-danger-soft p-3 text-[13px] text-danger"><p className="font-semibold">This clashes with existing sessions:</p>{clash.map((m, i) => <p key={i}>• {m}</p>)}</div>}
        </div>
      </Modal>
    </>
  )
}

/* ============ ATTENDANCE (management) ============ */
export function AttendanceOverview() {
  const [tab, setTab] = useState('class')
  const { push } = useToast()
  const { data: ov, loading } = useFetch(() => api.attendanceOverview())
  type Row = { id: string; name: string; teacher: string | null; rate: number | null; absent: number; late: number }
  const rows: Row[] = ov?.classes ?? []
  const byTeacher = [...rows.reduce((m, r) => { const k = r.teacher ?? '—'; const e = m.get(k) ?? { n: 0, sum: 0 }; if (r.rate !== null) { e.n++; e.sum += r.rate } m.set(k, e); return m }, new Map<string, { n: number; sum: number }>())]
    .map(([name, e]) => ({ id: name, name, rate: e.n ? Math.round((e.sum / e.n) * 10) / 10 : 0 }))
  const list = (tab === 'class' ? rows.map((r) => ({ id: r.id, name: r.name, rate: r.rate ?? 0 })) : byTeacher).slice(0, 8)
  const trend = (ov?.trend ?? []).filter((t: { rate: number | null }) => t.rate !== null).map((t: { date: string; rate: number }) => ({ label: fmtDay(t.date), value: t.rate }))
  const total = (ov?.present ?? 0) + (ov?.absent ?? 0) + (ov?.late ?? 0)
  const attention = [
    ...rows.filter((r) => r.rate !== null && r.rate < (ov?.target ?? 92)).sort((a, b) => (a.rate ?? 0) - (b.rate ?? 0)).slice(0, 4)
      .map((r) => ({ c: r.name, t: r.teacher ?? '—', issue: `Attendance ${r.rate}% — below ${ov?.target}% target`, tone: (r.rate ?? 100) < 90 ? 'danger' as const : 'warn' as const })),
    ...(ov?.today.pending ?? []).map((p: { name: string; teacher: string | null }) => ({ c: p.name, t: p.teacher ?? '—', issue: 'Attendance not yet marked today', tone: 'warn' as const })),
  ]
  return (
    <>
      <PageHeader title="Attendance" subtitle="Live attendance across the organization, updated as teachers submit." actions={<Button icon="download" variant="outline" onClick={() => downloadReport('att').catch((e) => push({ title: 'Export failed', desc: e instanceof ApiError ? e.message : undefined, tone: 'danger' }))}>Export</Button>} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Attendance rate" value={ov?.rate != null ? `${ov.rate}%` : '—'} icon="checkCircle" sub={ov ? `Last 14 days · target ${ov.target}%` : ''} />
        <StatCard label="Absences" value={String(ov?.absent ?? '—')} deltaTone="danger" icon="user" sub={total ? `${Math.round(((ov?.absent ?? 0) / total) * 1000) / 10}% of records` : ''} />
        <StatCard label="Late arrivals" value={String(ov?.late ?? '—')} deltaTone="neutral" icon="clock" sub={total ? `${Math.round(((ov?.late ?? 0) / total) * 1000) / 10}% of records` : ''} />
        <StatCard label="Classes marked today" value={ov ? `${ov.today.marked}/${ov.today.scheduledClasses}` : '—'} icon="clipboard" sub={ov ? `${ov.today.pending.length} pending` : ''} />
      </div>
      {loading && <p className="mt-3 text-[13px] text-muted-foreground">Loading…</p>}

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-5">
          <h2 className="mb-4 font-display text-[15px] font-semibold text-card-foreground">Attendance trend (14 days)</h2>
          {trend.length > 1 ? <LineChart data={trend} min={Math.max(0, Math.floor(Math.min(...trend.map((t: { value: number }) => t.value)) - 3))} max={100} height={160} /> : <p className="py-10 text-center text-[13px] text-muted-foreground">Not enough attendance data yet.</p>}
        </Card>
        <Card className="p-5">
          <div className="mb-3 flex gap-1 rounded-lg bg-muted p-1">
            {[['class', 'By class'], ['teacher', 'By teacher']].map(([id, l]) => (
              <button key={id} onClick={() => setTab(id)} className={cx('flex-1 rounded-md py-1.5 text-[13px] font-semibold', tab === id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground')}>{l}</button>
            ))}
          </div>
          <div className="flex flex-col gap-2.5">
            {list.map((c) => (
              <div key={c.id} className="flex items-center gap-3">
                <span className="w-24 shrink-0 truncate text-[13px] font-medium text-foreground">{tab === 'class' ? c.name : c.name.split(' ')[0]}</span>
                <Meter value={c.rate} tone={c.rate >= 95 ? 'ok' : c.rate >= 92 ? 'primary' : 'warn'} />
                <span className="w-12 shrink-0 text-right font-mono text-[12px] text-muted-foreground tnum">{c.rate}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-5 overflow-hidden">
        <div className="border-b border-border px-5 py-3.5"><h2 className="font-display text-[15px] font-semibold text-card-foreground">Classes needing attention</h2></div>
        <div className="divide-y divide-border">
          {attention.length === 0 && <p className="px-5 py-8 text-center text-[13px] text-muted-foreground">Every class is on target. 🎉</p>}
          {attention.map((r, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3">
              <Avatar name={r.t} size={34} />
              <div className="flex-1"><p className="text-sm font-semibold text-foreground">{r.c} · {r.t}</p><p className="text-[12px] text-muted-foreground">{r.issue}</p></div>
              <Badge tone={r.tone} dot>{r.tone === 'danger' ? 'Critical' : 'Watch'}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}

/* ============ WORKLOAD ============ */
export function Workload() {
  const { navigate } = useApp()
  const { push } = useToast()
  const { teachers, workload } = useLive()
  const [dept, setDept] = useState('')
  const list = [...teachers].filter((t) => !dept || t.department === dept).sort((a, b) => b.hours - a.hours)
  const depts = [...new Set(teachers.map((t) => t.department))]
  const sm = workload?.summary

  return (
    <>
      <PageHeader title="Teacher workload" subtitle="Balance teaching hours and spot overloaded staff before it becomes a problem." actions={<Button icon="download" variant="outline" onClick={() => downloadReport('wl').catch((e) => push({ title: 'Export failed', desc: e instanceof ApiError ? e.message : undefined, tone: 'danger' }))}>Export</Button>} />
      <Toolbar>
        <Select value={dept} onChange={(e) => setDept(e.target.value)}><option value="">All departments</option>{depts.map((d) => <option key={d}>{d}</option>)}</Select>
      </Toolbar>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Avg weekly hours" value={String(sm?.avgHours ?? '—')} icon="gauge" sub="Target 18–26h" />
        <StatCard label="Overloaded" value={String(sm?.Overloaded ?? '—')} deltaTone="danger" icon="alert" sub="Needs redistribution" />
        <StatCard label="Under-utilized" value={String(sm?.Light ?? '—')} deltaTone="neutral" icon="user" sub="Capacity available" />
      </div>

      <div className="mt-4 flex flex-col gap-2.5">
        {list.map((t) => {
          const pct = Math.min(100, (t.hours / 40) * 100)
          const tone = t.status === 'Overloaded' ? 'danger' : t.status === 'Heavy' ? 'warn' : t.status === 'Light' ? 'info' : 'ok'
          return (
            <Card key={t.id} className="flex flex-wrap items-center gap-4 p-4 transition-colors hover:border-border-strong">
              <button onClick={() => navigate('teacher-profile', t.id)} className="flex min-w-[200px] items-center gap-3">
                <Avatar name={t.name} size={40} />
                <div className="text-left"><p className="text-sm font-semibold text-foreground">{t.name}</p><p className="text-[12px] text-muted-foreground">{t.department}</p></div>
              </button>
              <div className="min-w-[180px] flex-1">
                <div className="mb-1 flex items-center justify-between text-[12px]"><span className="text-muted-foreground">{t.hours} teaching hours</span><span className="text-muted-foreground">{t.classes} classes</span></div>
                <Meter value={pct} tone={tone as any} />
              </div>
              <Badge tone={tone as any} dot>{t.status}</Badge>
              <Button size="sm" variant="ghost" iconRight="chevronRight" onClick={() => navigate('teacher-profile', t.id)}>Details</Button>
            </Card>
          )
        })}
      </div>
    </>
  )
}
