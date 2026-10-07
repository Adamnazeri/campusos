import { useEffect, useState, type ReactNode } from 'react'
import { Icon, type IconName } from '../lib/icons'
import { Avatar, Badge, Button, Card, cx, Field, Input, Modal, Select } from '../lib/ui'
import { useApp } from '../lib/store'
import type { Student } from '../lib/data'
import { api, fmtDay } from '../lib/api'
import { useFetch, useLive } from '../lib/live'

const NAV: { id: string; label: string; icon: IconName }[] = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'schedule', label: 'Schedule', icon: 'calendar' },
  { id: 'classes', label: 'Classes', icon: 'book' },
  { id: 'tasks', label: 'Tasks', icon: 'check2' },
  { id: 'more', label: 'More', icon: 'more' },
]

export function Teacher() {
  const { route, navigate, theme, toggleTheme, logout } = useApp()
  const { loading } = useLive()
  const active = ['home', 'schedule', 'classes', 'tasks', 'more'].includes(route) ? route : (['exams', 'announcements'].includes(route) ? 'more' : 'home')

  let page: ReactNode
  switch (route) {
    case 'schedule': page = <Schedule />; break
    case 'classes': page = <TClasses />; break
    case 'tasks': page = <TTasks />; break
    case 'more': page = <More onLogout={logout} theme={theme} toggleTheme={toggleTheme} />; break
    case 'exams': page = <TExams />; break
    case 'announcements': page = <TAnnouncements />; break
    case 'attendance': page = <TakeAttendance />; break
    case 'leave': page = <RequestLeave />; break
    default: page = <Home />
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto min-h-screen max-w-md bg-background pb-24 sm:my-4 sm:min-h-0 sm:rounded-3xl sm:border sm:border-border sm:shadow-2xl">
        {loading ? <p className="px-4 py-16 text-center text-sm text-muted-foreground">Loading your day…</p> : <div key={route} className="animate-in">{page}</div>}
      </div>

      {/* Bottom navigation */}
      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md">
        <nav className="m-3 flex items-center justify-around rounded-2xl border border-border bg-surface/90 p-1.5 shadow-2xl backdrop-blur-lg">
          {NAV.map((n) => {
            const I = Icon[n.icon]
            const on = active === n.id
            return (
              <button key={n.id} onClick={() => navigate(n.id)} className={cx('flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 transition-colors', on ? 'text-primary' : 'text-muted-foreground')}>
                <I width={21} height={21} />
                <span className="text-[10px] font-semibold">{n.label}</span>
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}

function TopBar({ title, back }: { title: string; back?: boolean }) {
  const { navigate } = useApp()
  return (
    <div className="sticky top-0 z-20 flex items-center gap-2 border-b border-border bg-surface/85 px-4 py-3 backdrop-blur-lg">
      {back && <button onClick={() => navigate('home')} className="-ml-1 rounded-lg p-1.5 text-muted-foreground hover:bg-muted"><Icon.chevronLeft width={20} height={20} /></button>}
      <h1 className="font-display text-lg font-bold text-foreground">{title}</h1>
    </div>
  )
}

/* ============ HOME ============ */
function Home() {
  const { navigate } = useApp()
  const { user, dash, tasks, announcements } = useLive()
  const sessions: { id: string; start: string; end: string; subject: string; className: string; room: string; classId: string; state: string }[] = dash?.today.sessions ?? []
  const next = dash?.nextClass as (typeof sessions)[number] | null | undefined
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const quick = [
    { label: 'Take Attendance', icon: 'checkCircle' as const, go: () => navigate('attendance') },
    { label: 'Create Assignment', icon: 'clipboard' as const, go: () => navigate('classes') },
    { label: 'View Schedule', icon: 'calendar' as const, go: () => navigate('schedule') },
    { label: 'Submit Leave', icon: 'plane' as const, go: () => navigate('leave') },
  ]
  return (
    <>
      <div className="flex items-center justify-between px-4 pb-2 pt-5">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{dash ? `${dash.today.day} · ${fmtDay(dash.today.date)}` : '—'}</p>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">{greeting}, {user.name.split(' ')[0]}</h1>
        </div>
        <Avatar name={user.name} size={42} />
      </div>

      {/* Up next hero */}
      <div className="px-4 pt-3">
        {!next ? (
          <Card className="p-5 text-center"><p className="font-display text-lg font-semibold text-foreground">{user.teacherId ? 'No more classes today' : 'No teaching profile linked'}</p><p className="mt-1 text-[13px] text-muted-foreground">{user.teacherId ? 'Enjoy the rest of your day.' : 'Ask management to link your account to a teacher profile.'}</p></Card>
        ) : (
        <button onClick={() => navigate('attendance', next.classId)} className="relative block w-full overflow-hidden rounded-2xl bg-[#0e1220] p-5 text-left text-white">
          <div className="pointer-events-none absolute inset-0 opacity-70" style={{ background: 'radial-gradient(320px 180px at 90% -10%, rgba(79,70,229,0.5), transparent)' }} />
          <div className="relative">
            <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-warn live-dot" /><span className="text-[12px] font-semibold text-white/70">{next.state === 'in-progress' ? 'In progress now' : `Up next · starts ${next.start}`}</span></div>
            <p className="mt-3 font-display text-xl font-bold">{next.subject}</p>
            <p className="text-white/70">{next.className} · {next.room}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="font-mono text-sm text-white/80">{next.start}–{next.end}</span>
              <span className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[13px] font-semibold">Take attendance <Icon.chevronRight width={15} height={15} /></span>
            </div>
          </div>
        </button>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-2.5 px-4 pt-4">
        {quick.map((q) => { const I = Icon[q.icon]; return (
          <button key={q.label} onClick={q.go} className="flex items-center gap-2.5 rounded-xl border border-border bg-card p-3.5 text-left"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary"><I width={18} height={18} /></span><span className="text-[13px] font-semibold text-foreground">{q.label}</span></button>
        )})}
      </div>

      {/* Today's classes */}
      <div className="px-4 pt-5">
        <div className="mb-2 flex items-center justify-between"><h2 className="font-display text-[15px] font-semibold text-foreground">Today's classes</h2><span className="font-mono text-[12px] text-muted-foreground">{sessions.length} session{sessions.length === 1 ? '' : 's'}</span></div>
        <div className="flex flex-col gap-2">
          {sessions.length === 0 && <p className="py-6 text-center text-[13px] text-muted-foreground">No classes scheduled today.</p>}
          {sessions.map((s) => (
            <Card key={s.id} className="flex items-center gap-3 p-3">
              <div className="flex w-14 flex-col items-center rounded-lg bg-muted py-1.5"><span className="font-mono text-[11px] font-semibold text-foreground tnum">{s.start}</span></div>
              <div className="flex-1"><p className="text-sm font-semibold text-foreground">{s.subject}</p><p className="text-[12px] text-muted-foreground">{s.className} · {s.room}</p></div>
              <Badge tone={s.state === 'in-progress' ? 'ok' : s.state === 'cancelled' ? 'danger' : s.state === 'done' ? 'neutral' : s.id === next?.id ? 'warn' : 'neutral'} dot>{s.state === 'in-progress' ? 'Now' : s.state === 'cancelled' ? 'Cancelled' : s.state === 'done' ? 'Done' : s.id === next?.id ? 'Next' : 'Later'}</Badge>
            </Card>
          ))}
        </div>
      </div>

      {/* Tasks + announcements */}
      <div className="px-4 pt-5">
        <div className="mb-2 flex items-center justify-between"><h2 className="font-display text-[15px] font-semibold text-foreground">Pending tasks</h2><button onClick={() => navigate('tasks')} className="text-[12px] font-semibold text-primary">View all</button></div>
        <div className="flex flex-col gap-2">
          {tasks.filter((t) => t.status !== 'Completed').length === 0 && <p className="py-3 text-center text-[13px] text-muted-foreground">All caught up.</p>}
          {tasks.filter((t) => t.status !== 'Completed').map((t) => (
            <Card key={t.id} className="flex items-center gap-3 p-3"><span className="h-2 w-2 rounded-full bg-warn" /><span className="flex-1 text-[13px] font-medium text-foreground">{t.title}</span><span className="text-[11px] text-muted-foreground">Due {t.due}</span></Card>
          ))}
        </div>
      </div>

      <div className="px-4 pb-4 pt-5">
        <div className="mb-2 flex items-center justify-between"><h2 className="font-display text-[15px] font-semibold text-foreground">Announcements</h2></div>
        <div className="flex flex-col gap-2">
          {announcements.slice(0, 2).map((a) => (
            <Card key={a.id} className={cx('p-3', !a.read && 'border-l-2 border-l-primary')}>
              <div className="flex items-center gap-2"><Badge tone={a.tag === 'Emergency' ? 'danger' : a.tag === 'Meeting' ? 'primary' : 'info'}>{a.tag}</Badge><span className="ml-auto text-[11px] text-muted-foreground">{a.time}</span></div>
              <p className="mt-1.5 text-[13px] font-semibold text-foreground">{a.title}</p>
            </Card>
          ))}
        </div>
      </div>
    </>
  )
}

/* ============ SCHEDULE ============ */
function Schedule() {
  const { sessions: all, days, dash } = useLive()
  const [day, setDay] = useState<string>(dash?.today.day ?? 'Mon')
  const ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const todayIso: string = dash?.today.date ?? new Date().toISOString().slice(0, 10)
  const dateFor = (d: string) => new Date(Date.parse(todayIso + 'T00:00:00Z') + (ORDER.indexOf(d) - ORDER.indexOf(dash?.today.day ?? 'Mon')) * 86_400_000).toISOString().slice(8, 10)
  const list = all.filter((s) => s.day === day).sort((a, b) => a.slot.localeCompare(b.slot))
  return (
    <>
      <TopBar title="Schedule" />
      <div className="flex gap-2 overflow-x-auto px-4 py-3">
        {days.map((d) => <button key={d} onClick={() => setDay(d)} className={cx('flex flex-col items-center rounded-xl px-4 py-2', day === d ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}><span className="text-[11px] font-semibold">{d}</span><span className="font-display text-base font-bold">{dateFor(d)}</span></button>)}
      </div>
      <div className="px-4">
        {list.length > 0 ? (
          <div className="relative pl-14">
            {list.map((s) => (
              <div key={s.id} className="relative mb-3">
                <span className="absolute -left-14 top-1 font-mono text-[12px] text-muted-foreground tnum">{s.slot}</span>
                <Card className="border-l-2 border-l-primary p-3.5"><p className="text-sm font-semibold text-foreground">{s.subject}</p><p className="mt-0.5 text-[12px] text-muted-foreground">{s.className} · {s.room}</p></Card>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-16 text-center"><Icon.calendar width={28} height={28} className="text-muted-foreground" /><p className="mt-3 font-display font-semibold text-foreground">No classes on {day}</p><p className="text-[13px] text-muted-foreground">Enjoy your free day.</p></div>
        )}
      </div>
    </>
  )
}

/* ============ CLASSES ============ */
function TClasses() {
  const { navigate } = useApp()
  const { classes: mine, act } = useLive()
  const [assignFor, setAssignFor] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [due, setDue] = useState('')
  async function createAssignment() {
    const r = await act(() => api.addAssignment({ title, classId: assignFor, due: due || undefined, status: 'Published' }), { ok: { title: 'Assignment published', desc: title }, reload: ['assignments', 'dash'] })
    if (r) { setAssignFor(null); setTitle(''); setDue('') }
  }
  return (
    <>
      <TopBar title="My classes" />
      <div className="flex flex-col gap-2.5 px-4 py-3">
        {mine.map((c) => (
          <Card key={c.id} className="p-4">
            <div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-[12px] font-bold text-primary">{c.name.replace('Form ', '')}</span><div><p className="font-semibold text-foreground">{c.name}</p><p className="text-[12px] text-muted-foreground">{c.subject}</p></div></div><Badge>{c.students} students</Badge></div>
            <p className="mt-3 text-[12px] text-muted-foreground">{c.schedule} · {c.room}</p>
            <div className="mt-3 flex gap-2"><Button size="sm" variant="primary" block icon="checkCircle" onClick={() => navigate('attendance', c.id)}>Attendance</Button><Button size="sm" variant="outline" block icon="clipboard" onClick={() => setAssignFor(c.id)}>Assign</Button></div>
          </Card>
        ))}
        {mine.length === 0 && <p className="py-16 text-center text-sm text-muted-foreground">No classes assigned to you yet.</p>}
      </div>
      <Modal open={assignFor !== null} onClose={() => setAssignFor(null)} title="New assignment" footer={<><Button variant="ghost" onClick={() => setAssignFor(null)}>Cancel</Button><Button variant="primary" onClick={() => void createAssignment()}>Publish</Button></>}>
        <div className="flex flex-col gap-4">
          <Field label="Title"><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Problem Set 5" /></Field>
          <Field label="Due date"><Input type="date" value={due} onChange={(e) => setDue(e.target.value)} /></Field>
        </div>
      </Modal>
    </>
  )
}

/* ============ TASKS ============ */
function TTasks() {
  const { tasks: items, act } = useLive()
  const [filter, setFilter] = useState('To Do')
  const advance = (id: string) => void act(() => api.advanceTask(id), { ok: { title: 'Task updated' }, reload: ['tasks', 'dash'] })
  const prTone = { High: 'danger', Medium: 'warn', Low: 'neutral' } as const
  return (
    <>
      <TopBar title="Tasks" />
      <div className="flex gap-2 px-4 py-3">
        {['To Do', 'In Progress', 'Completed'].map((f) => <button key={f} onClick={() => setFilter(f)} className={cx('rounded-full px-3 py-1.5 text-[12px] font-semibold', filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>{f}</button>)}
      </div>
      <div className="flex flex-col gap-2.5 px-4">
        {items.filter((t) => t.status === filter).map((t) => (
          <Card key={t.id} className="p-3.5">
            <div className="flex items-center gap-2"><Badge tone={prTone[t.priority]}>{t.priority}</Badge><span className="ml-auto text-[11px] text-muted-foreground">Due {t.due}</span></div>
            <p className={cx('mt-2 text-[14px] font-medium', t.status === 'Completed' ? 'text-muted-foreground line-through' : 'text-foreground')}>{t.title}</p>
            {t.status !== 'Completed' && <Button size="sm" variant="outline" block className="mt-3" onClick={() => advance(t.id)}>Mark {t.status === 'To Do' ? 'in progress' : 'complete'}</Button>}
          </Card>
        ))}
        {items.filter((t) => t.status === filter).length === 0 && <div className="py-16 text-center text-sm text-muted-foreground">Nothing in {filter.toLowerCase()}.</div>}
      </div>
    </>
  )
}

/* ============ TAKE ATTENDANCE ============ */
function TakeAttendance() {
  const { navigate, param } = useApp()
  const { classes, dash, act } = useLive()
  const classId = param ?? dash?.nextClass?.classId ?? classes[0]?.id
  const att = useFetch(() => (classId ? api.classAttendance(classId) : Promise.resolve(null)), [classId])
  const [list, setList] = useState<Student[]>([])
  const [done, setDone] = useState(false)
  useEffect(() => {
    if (att.data) setList((att.data.roster as { id: string; name: string; status: Student['status'] }[]).map((r) => ({ id: r.id, name: r.name, status: r.status ?? 'Present' })))
  }, [att.data])
  async function submit() {
    const r = await act(() => api.putAttendance(classId!, { records: list.map((s) => ({ studentId: s.id, status: s.status })) }),
      { ok: { title: 'Attendance saved', desc: `${counts.Present} present · ${counts.Absent} absent · ${counts.Late} late` }, reload: ['dash', 'classes'] })
    if (r) setDone(true)
  }
  const counts = { Present: list.filter((s) => s.status === 'Present').length, Absent: list.filter((s) => s.status === 'Absent').length, Late: list.filter((s) => s.status === 'Late').length }
  function set(id: string, status: Student['status']) { setList((s) => s.map((x) => x.id === id ? { ...x, status } : x)) }
  const cycle: Record<string, Student['status']> = { Present: 'Absent', Absent: 'Late', Late: 'Present' }
  const stTone = { Present: 'ok', Absent: 'danger', Late: 'warn' } as const

  if (done) return (
    <>
      <TopBar title="Attendance saved" back />
      <div className="flex flex-col items-center px-6 py-10 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-ok-soft text-ok"><Icon.checkCircle width={32} height={32} /></div>
        <h2 className="font-display text-xl font-bold text-foreground">Attendance saved</h2>
        <p className="mt-1 text-sm text-muted-foreground">{att.data?.className} · {att.data?.subject}</p>
        <div className="mt-6 grid w-full grid-cols-3 gap-2.5">
          {(['Present', 'Absent', 'Late'] as const).map((k) => <div key={k} className="rounded-xl border border-border bg-card p-3"><p className="font-display text-2xl font-bold text-foreground tnum">{counts[k]}</p><p className="text-[12px] text-muted-foreground">{k}</p></div>)}
        </div>
        <Button variant="primary" block className="mt-6" onClick={() => navigate('home')}>Back to home</Button>
      </div>
    </>
  )

  return (
    <>
      <TopBar title="Take attendance" back />
      <div className="sticky top-[53px] z-10 border-b border-border bg-surface/90 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between"><div><p className="font-semibold text-foreground">{att.data?.className ?? '—'} · {att.data?.subject ?? ''}</p><p className="text-[12px] text-muted-foreground">{att.data?.date} · {list.length} students</p></div><Button size="sm" variant="outline" onClick={() => setList((s) => s.map((x) => ({ ...x, status: 'Present' })))}>Present all</Button></div>
        <div className="mt-2.5 flex gap-2 text-[12px] font-semibold"><span className="text-ok">{counts.Present} present</span><span className="text-danger">{counts.Absent} absent</span><span className="text-warn">{counts.Late} late</span></div>
      </div>
      <div className="divide-y divide-border px-1">
        {!classId && <p className="py-16 text-center text-sm text-muted-foreground">You have no classes to take attendance for.</p>}
        {classId && att.loading && list.length === 0 && <p className="py-16 text-center text-sm text-muted-foreground">Loading class…</p>}
        {list.map((s, i) => (
          <div key={s.id} className="flex items-center gap-3 px-3 py-2.5">
            <span className="w-5 font-mono text-[11px] text-muted-foreground tnum">{String(i + 1).padStart(2, '0')}</span>
            <Avatar name={s.name} size={34} />
            <span className="flex-1 text-sm font-medium text-foreground">{s.name}</span>
            <button onClick={() => set(s.id, cycle[s.status!])} className={cx('rounded-lg px-3 py-1.5 text-[12px] font-bold', s.status === 'Present' ? 'bg-ok-soft text-ok' : s.status === 'Absent' ? 'bg-danger-soft text-danger' : 'bg-warn-soft text-warn')}>{s.status}</button>
          </div>
        ))}
      </div>
      <div className="sticky bottom-24 mx-4 mt-3">
        <Button variant="primary" block size="lg" disabled={list.length === 0} onClick={() => void submit()}>{att.data?.marked ? 'Update attendance' : 'Submit attendance'}</Button>
      </div>
    </>
  )
}

/* ============ REQUEST LEAVE ============ */
function RequestLeave() {
  const { navigate } = useApp()
  const { balances, leave, dash, act } = useLive()
  const today: string = dash?.today.date ?? new Date().toISOString().slice(0, 10)
  const [type, setType] = useState('Medical leave')
  const [from, setFrom] = useState(today)
  const [to, setTo] = useState(today)
  const [reason, setReason] = useState('')
  async function submit() {
    const r = await act(() => api.requestLeave({ type, from, to, reason: reason || undefined }), { ok: { title: 'Leave request submitted', desc: 'Management has been notified.' }, reload: ['leave', 'balances', 'dash'] })
    if (r) navigate('home')
  }
  const total = balances.reduce((a: number, b: { remaining: number }) => a + b.remaining, 0)
  return (
    <>
      <TopBar title="Request leave" back />
      <div className="flex flex-col gap-4 px-4 py-4">
        <Card className="p-4"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-foreground">Leave balance</p><Badge tone="ok">{total} days left</Badge></div>
          <div className="mt-3 grid grid-cols-3 gap-2">{balances.map((b: { type: string; remaining: number }) => <div key={b.type} className="rounded-lg bg-muted p-2 text-center"><p className="font-display text-lg font-bold text-foreground tnum">{b.remaining}</p><p className="text-[11px] text-muted-foreground">{b.type.replace(' leave', '')}</p></div>)}</div>
        </Card>
        <Field label="Leave type"><Select value={type} onChange={(e) => setType(e.target.value)}><option>Medical leave</option><option>Casual leave</option><option>Annual leave</option><option>Study leave</option></Select></Field>
        <div className="grid grid-cols-2 gap-3"><Field label="Start date"><Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); if (e.target.value > to) setTo(e.target.value) }} /></Field><Field label="End date"><Input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} /></Field></div>
        <Field label="Reason"><textarea rows={4} className="w-full rounded-lg border border-border bg-surface-2 p-3 text-sm outline-none focus:border-primary" placeholder="Briefly describe your reason…" value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
        <Button variant="primary" block size="lg" onClick={() => void submit()}>Submit request</Button>
        {leave.length > 0 && (
          <div>
            <p className="mb-2 text-[13px] font-semibold text-foreground">My requests</p>
            <div className="flex flex-col gap-2">
              {leave.slice(0, 6).map((l) => (
                <Card key={l.id} className="flex items-center gap-3 p-3"><div className="flex-1"><p className="text-[13px] font-semibold text-foreground">{l.type}</p><p className="text-[12px] text-muted-foreground">{l.from} → {l.to} · {l.days} day{l.days > 1 ? 's' : ''}</p></div><Badge tone={l.status === 'Approved' ? 'ok' : l.status === 'Rejected' ? 'danger' : 'warn'} dot>{l.status}</Badge></Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

/* ============ MORE ============ */
function More({ onLogout, theme, toggleTheme }: { onLogout: () => void; theme: string; toggleTheme: () => void }) {
  const { navigate } = useApp()
  const { user, unread } = useLive()
  const items: { label: string; icon: IconName; go?: () => void }[] = [
    { label: 'Assignments', icon: 'clipboard', go: () => navigate('classes') },
    { label: 'Exams (my invigilation)', icon: 'award', go: () => navigate('exams') },
    { label: 'Request leave', icon: 'plane', go: () => navigate('leave') },
    { label: unread ? `Announcements (${unread} new)` : 'Announcements', icon: 'megaphone', go: () => navigate('announcements') },
  ]
  return (
    <>
      <TopBar title="More" />
      <div className="px-4 py-4">
        <Card className="flex items-center gap-3 p-4"><Avatar name={user.name} size={48} /><div className="flex-1"><p className="font-display font-semibold text-foreground">{user.name}</p><p className="text-[12px] text-muted-foreground">{user.roleLabel} · {user.org.name}</p></div></Card>
        <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
          {items.map((it) => { const I = Icon[it.icon]; return (
            <button key={it.label} onClick={it.go} className="flex w-full items-center gap-3 border-b border-border px-4 py-3.5 text-left last:border-0 hover:bg-muted"><span className="text-muted-foreground"><I width={19} height={19} /></span><span className="flex-1 text-sm font-medium text-foreground">{it.label}</span><Icon.chevronRight width={16} height={16} className="text-muted-foreground" /></button>
          )})}
        </div>
        <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
          <button onClick={toggleTheme} className="flex w-full items-center gap-3 border-b border-border px-4 py-3.5 text-left hover:bg-muted"><span className="text-muted-foreground">{theme === 'dark' ? <Icon.sun width={19} height={19} /> : <Icon.moon width={19} height={19} />}</span><span className="flex-1 text-sm font-medium text-foreground">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span></button>
          <button onClick={onLogout} className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-danger-soft"><span className="text-danger"><Icon.logout width={19} height={19} /></span><span className="flex-1 text-sm font-medium text-danger">Sign out</span></button>
        </div>
      </div>
    </>
  )
}

/* ============ EXAMS (guru) ============ */
function TExams() {
  const { exams } = useLive()
  return (
    <>
      <TopBar title="My exams" back />
      <div className="flex flex-col gap-2.5 px-4 py-3">
        {exams.length === 0 && <p className="py-16 text-center text-sm text-muted-foreground">You have no invigilation duties.</p>}
        {exams.map((e) => (
          <Card key={e.id} className="p-4">
            <div className="flex items-center justify-between"><p className="font-semibold text-foreground">{e.title}</p><Badge tone={e.status === 'Completed' ? 'ok' : e.status === 'Grading' ? 'warn' : 'primary'} dot>{e.status}</Badge></div>
            <p className="mt-1 text-[12px] text-muted-foreground">{e.className} · {e.subject}</p>
            <p className="mt-2 text-[13px] text-foreground">{e.date} · {e.time} · {e.room}</p>
          </Card>
        ))}
      </div>
    </>
  )
}

/* ============ ANNOUNCEMENTS (guru) ============ */
function TAnnouncements() {
  const { announcements, refresh } = useLive()
  return (
    <>
      <TopBar title="Announcements" back />
      <div className="flex flex-col gap-2.5 px-4 py-3">
        {announcements.length === 0 && <p className="py-16 text-center text-sm text-muted-foreground">No announcements.</p>}
        {announcements.map((a) => (
          <Card key={a.id} className={cx('cursor-pointer p-3.5', !a.read && 'border-l-2 border-l-primary')} onClick={() => { if (!a.read) void api.readAnnouncement(a.id).then(() => refresh('announcements')) }}>
            <div className="flex items-center gap-2"><Badge tone={a.tag === 'Emergency' ? 'danger' : a.tag === 'Meeting' ? 'primary' : 'info'}>{a.tag}</Badge><span className="ml-auto text-[11px] text-muted-foreground">{a.time}</span></div>
            <p className="mt-1.5 text-[14px] font-semibold text-foreground">{a.title}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{a.body}</p>
            <p className="mt-2 text-[11px] text-muted-foreground">{a.author} · {a.audience}</p>
          </Card>
        ))}
      </div>
    </>
  )
}
