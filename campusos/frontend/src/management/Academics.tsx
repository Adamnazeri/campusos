import { useState } from 'react'
import { Icon } from '../lib/icons'
import { Avatar, Badge, Button, Card, cx, Field, Input, Meter, Modal, PageHeader, Select, Tabs, useToast } from '../lib/ui'
import { Td, Th, TableWrap, Toolbar, StatCard } from '../components/common'
import type { LeaveReq, Task } from '../lib/data'
import { api, monthOf } from '../lib/api'
import { useFetch, useLive } from '../lib/live'

/* ============ ASSIGNMENTS ============ */
export function Assignments() {
  const { assignments: ASSIGN, classes, act } = useLive()
  const [tab, setTab] = useState('all')
  const [open, setOpen] = useState(false)
  const [f, setF] = useState({ title: '', classId: '', due: '', status: 'Draft' })
  async function submit() {
    const r = await act(() => api.addAssignment({ title: f.title, classId: f.classId, due: f.due || undefined, status: f.status }), { ok: { title: 'Assignment created', desc: f.title }, reload: ['assignments'] })
    if (r) { setOpen(false); setF({ title: '', classId: '', due: '', status: 'Draft' }) }
  }
  const tabs = [
    { id: 'all', label: 'All', count: ASSIGN.length },
    { id: 'Published', label: 'Published', count: ASSIGN.filter((a) => a.status === 'Published').length },
    { id: 'Draft', label: 'Draft', count: ASSIGN.filter((a) => a.status === 'Draft').length },
    { id: 'Completed', label: 'Completed', count: ASSIGN.filter((a) => a.status === 'Completed').length },
  ]
  const list = ASSIGN.filter((a) => tab === 'all' || a.status === tab)
  const tone = { Published: 'primary', Draft: 'neutral', Completed: 'ok' } as const
  return (
    <>
      <PageHeader title="Assignments" subtitle="Organization-wide assignment activity and submission progress." actions={<Button icon="plus" variant="primary" onClick={() => setOpen(true)}>New assignment</Button>} />
      <Tabs value={tab} onChange={setTab} tabs={tabs} />
      <Modal open={open} onClose={() => setOpen(false)} title="New assignment" footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button variant="primary" onClick={() => void submit()}>Create</Button></>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><Field label="Title"><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="e.g. Problem Set 5" /></Field></div>
          <Field label="Class"><Select value={f.classId} onChange={(e) => setF({ ...f, classId: e.target.value })}><option value="">Select a class…</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.subject}</option>)}</Select></Field>
          <Field label="Due date"><Input type="date" value={f.due} onChange={(e) => setF({ ...f, due: e.target.value })} /></Field>
          <Field label="Status"><Select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}><option>Draft</option><option>Published</option></Select></Field>
        </div>
      </Modal>
      <div className="mt-4">
        <TableWrap>
          <thead className="border-b border-border bg-surface-2"><tr><Th>Assignment</Th><Th>Class</Th><Th>Teacher</Th><Th>Due</Th><Th>Submissions</Th><Th>Status</Th></tr></thead>
          <tbody className="divide-y divide-border">
            {list.map((a) => (
              <tr key={a.id} className="hover:bg-muted/50">
                <Td><div><p className="font-semibold">{a.title}</p><p className="text-[12px] text-muted-foreground">{a.subject}</p></div></Td>
                <Td className="text-muted-foreground">{a.className}</Td>
                <Td className="text-muted-foreground">{a.teacher}</Td>
                <Td className="text-muted-foreground">{a.due}</Td>
                <Td><div className="flex items-center gap-2"><Meter value={a.total ? (a.submitted / a.total) * 100 : 0} tone={a.total && a.submitted === a.total ? 'ok' : 'primary'} className="w-20" /><span className="font-mono text-[12px] text-muted-foreground tnum">{a.submitted}/{a.total}</span></div></Td>
                <Td><Badge tone={tone[a.status]} dot>{a.status}</Badge></Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </div>
    </>
  )
}

/* ============ EXAMS ============ */
export function Exams() {
  const { exams: EXAMS, classes, rooms, teachers, act } = useLive()
  const [open, setOpen] = useState(false)
  const blank = { title: '', classId: '', date: '', time: '09:00', room: '', invigilator: '' }
  const [f, setF] = useState(blank)
  const today = new Date().toISOString().slice(0, 10)
  const upcoming = EXAMS.filter((e) => e.status === 'Scheduled' && e.rawDate >= today)
  async function submit() {
    const r = await act(() => api.addExam({ title: f.title, classId: f.classId, date: f.date, time: f.time, room: f.room || undefined, invigilator: f.invigilator || undefined }),
      { ok: { title: 'Exam scheduled', desc: f.title }, reload: ['exams'] })
    if (r) { setOpen(false); setF(blank) }
  }
  const tone = { Scheduled: 'primary', Grading: 'warn', Completed: 'ok' } as const
  return (
    <>
      <PageHeader title="Exams" subtitle="Exam timetable, invigilation and grading status." actions={<Button icon="plus" variant="primary" onClick={() => setOpen(true)}>Schedule exam</Button>} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Upcoming exams" value={String(upcoming.length)} icon="calendar" sub="Scheduled" />
        <StatCard label="Awaiting grading" value={String(EXAMS.filter((e) => e.status === 'Grading').length)} deltaTone="neutral" icon="clock" />
        <StatCard label="Completed" value={String(EXAMS.filter((e) => e.status === 'Completed').length)} icon="checkCircle" />
        <StatCard label="Invigilators" value={String(new Set(EXAMS.map((e) => e.invigilator).filter((x) => x !== '—')).size)} icon="users" sub="Assigned this cycle" />
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Schedule exam" footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button variant="primary" onClick={() => void submit()}>Schedule</Button></>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><Field label="Title"><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="e.g. Mathematics Mid-Term" /></Field></div>
          <Field label="Class"><Select value={f.classId} onChange={(e) => setF({ ...f, classId: e.target.value })}><option value="">Select a class…</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
          <Field label="Room"><Select value={f.room} onChange={(e) => setF({ ...f, room: e.target.value })}><option value="">None</option>{rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</Select></Field>
          <Field label="Date"><Input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
          <Field label="Time"><Input type="time" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} /></Field>
          <Field label="Invigilator"><Select value={f.invigilator} onChange={(e) => setF({ ...f, invigilator: e.target.value })}><option value="">None</option>{teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</Select></Field>
        </div>
      </Modal>
      <Card className="mt-5 overflow-hidden">
        <div className="border-b border-border px-5 py-3.5"><h2 className="font-display text-[15px] font-semibold text-card-foreground">Examination calendar</h2></div>
        <div className="divide-y divide-border">
          {EXAMS.length === 0 && <p className="px-5 py-10 text-center text-sm text-muted-foreground">No exams scheduled.</p>}
          {EXAMS.map((e) => (
            <div key={e.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
              <div className="flex w-14 flex-col items-center rounded-lg bg-primary-soft py-1.5 text-primary"><span className="text-[10px] font-semibold uppercase">{monthOf(e.rawDate)}</span><span className="font-display text-lg font-bold leading-none tnum">{e.date.split(' ')[0]}</span></div>
              <div className="min-w-[180px] flex-1"><p className="font-semibold text-foreground">{e.title}</p><p className="text-[12px] text-muted-foreground">{e.className} · {e.subject}</p></div>
              <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground"><Icon.clock width={14} height={14} /> {e.time}</div>
              <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground"><Icon.mapPin width={14} height={14} /> {e.room}</div>
              <div className="flex items-center gap-2"><Avatar name={e.invigilator} size={26} /><span className="text-[13px] text-muted-foreground">{e.invigilator.split(' ')[0]}</span></div>
              <Badge tone={tone[e.status]} dot>{e.status}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}

/* ============ LEAVE ============ */
export function Leave() {
  const { push } = useToast()
  const { leave: items, overview, act, refresh } = useLive()
  const [tab, setTab] = useState('Pending')
  const list = items.filter((l) => l.status === tab)
  async function decide(l: LeaveReq, status: 'Approved' | 'Rejected') {
    const r = await act(() => api.decideLeave(l.id, status), { reload: ['leave', 'overview'] })
    if (!r) return
    push({ title: `Leave ${status.toLowerCase()}`, desc: `${l.teacher} — ${l.type}`, tone: status === 'Approved' ? 'ok' : 'danger',
      action: { label: 'Undo', onClick: () => { void act(() => api.reopenLeave(l.id), { reload: ['leave', 'overview'] }); void refresh('leave') } } })
  }
  const tone = { Pending: 'warn', Approved: 'ok', Rejected: 'danger' } as const
  return (
    <>
      <PageHeader title="Leave management" subtitle="Review and approve leave requests across your organization." actions={<Button icon="download" variant="outline">History</Button>} />
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Pending requests" value={String(items.filter((l) => l.status === 'Pending').length)} deltaTone="neutral" icon="clock" />
        <StatCard label="Approved" value={String(items.filter((l) => l.status === 'Approved').length)} icon="checkCircle" />
        <StatCard label="On leave today" value={String(overview?.stats.teachersOnLeave ?? 0)} icon="plane" sub="Approved absences" />
      </div>
      <div className="mt-5"><Tabs value={tab} onChange={setTab} tabs={[
        { id: 'Pending', label: 'Pending', count: items.filter((l) => l.status === 'Pending').length },
        { id: 'Approved', label: 'Approved', count: items.filter((l) => l.status === 'Approved').length },
        { id: 'Rejected', label: 'Rejected', count: items.filter((l) => l.status === 'Rejected').length },
      ]} /></div>
      <div className="mt-4 flex flex-col gap-3">
        {list.length === 0 && <Card className="p-10 text-center text-sm text-muted-foreground">No {tab.toLowerCase()} requests.</Card>}
        {list.map((l) => (
          <Card key={l.id} className="flex flex-wrap items-center gap-4 p-4">
            <Avatar name={l.teacher} size={42} />
            <div className="min-w-[180px] flex-1">
              <div className="flex items-center gap-2"><p className="font-semibold text-foreground">{l.teacher}</p><Badge tone={tone[l.status]} dot>{l.type}</Badge></div>
              <p className="mt-0.5 text-[13px] text-muted-foreground">{l.reason}</p>
            </div>
            <div className="text-right"><p className="text-[13px] font-semibold text-foreground">{l.from} → {l.to}</p><p className="text-[12px] text-muted-foreground">{l.days} day{l.days > 1 ? 's' : ''}</p></div>
            {l.status === 'Pending' && <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => void decide(l, 'Rejected')}>Reject</Button><Button size="sm" variant="primary" onClick={() => void decide(l, 'Approved')}>Approve</Button></div>}
          </Card>
        ))}
      </div>
    </>
  )
}

/* ============ TASKS (kanban) ============ */
export function Tasks() {
  const { tasks: items, teachers, act } = useLive()
  const [open, setOpen] = useState(false)
  const blank = { title: '', assignee: '', due: '', priority: 'Medium' }
  const [f, setF] = useState(blank)
  async function create() {
    const r = await act(() => api.addTask({ title: f.title, assignee: f.assignee || undefined, due: f.due || undefined, priority: f.priority }), { ok: { title: 'Task created', desc: f.title }, reload: ['tasks', 'overview'] })
    if (r) { setOpen(false); setF(blank) }
  }
  const cols: Task['status'][] = ['To Do', 'In Progress', 'Completed']
  const colTone = { 'To Do': 'neutral', 'In Progress': 'info', Completed: 'ok' } as const
  const prTone = { High: 'danger', Medium: 'warn', Low: 'neutral' } as const
  function advance(t: Task) {
    const next = t.status === 'To Do' ? 'In Progress' : 'Completed'
    void act(() => api.advanceTask(t.id), { ok: { title: 'Task updated', desc: `Moved to ${next}.` }, reload: ['tasks', 'overview'] })
  }
  return (
    <>
      <PageHeader title="Tasks" subtitle="Operational tasks assigned across staff." actions={<Button icon="plus" variant="primary" onClick={() => setOpen(true)}>New task</Button>} />
      <Modal open={open} onClose={() => setOpen(false)} title="New task" footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button variant="primary" onClick={() => void create()}>Create</Button></>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><Field label="Task"><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="What needs doing?" /></Field></div>
          <Field label="Assign to"><Select value={f.assignee} onChange={(e) => setF({ ...f, assignee: e.target.value })}><option value="">Unassigned</option>{teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</Select></Field>
          <Field label="Due date"><Input type="date" value={f.due} onChange={(e) => setF({ ...f, due: e.target.value })} /></Field>
          <Field label="Priority"><Select value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value })}><option>High</option><option>Medium</option><option>Low</option></Select></Field>
        </div>
      </Modal>
      <div className="grid gap-4 lg:grid-cols-3">
        {cols.map((col) => {
          const list = items.filter((t) => t.status === col)
          return (
            <div key={col} className="rounded-xl border border-border bg-surface-2/60 p-3">
              <div className="mb-3 flex items-center gap-2 px-1"><Badge tone={colTone[col]} dot>{col}</Badge><span className="ml-auto font-mono text-[12px] text-muted-foreground tnum">{list.length}</span></div>
              <div className="flex flex-col gap-2.5">
                {list.map((t) => (
                  <Card key={t.id} className="p-3.5">
                    <div className="mb-2 flex items-center justify-between"><Badge tone={prTone[t.priority]}>{t.priority}</Badge><span className="text-[11px] text-muted-foreground">Due {t.due}</span></div>
                    <p className={cx('text-[13px] font-medium leading-snug', t.status === 'Completed' ? 'text-muted-foreground line-through' : 'text-foreground')}>{t.title}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-1.5"><Avatar name={t.assignee} size={22} /><span className="text-[12px] text-muted-foreground">{t.assignee.split(' ')[0]}</span></div>
                      {t.status !== 'Completed' && <button onClick={() => advance(t)} className="rounded-md px-2 py-1 text-[12px] font-semibold text-primary hover:bg-primary-soft">Move →</button>}
                    </div>
                  </Card>
                ))}
                {list.length === 0 && <p className="px-1 py-6 text-center text-[12px] text-muted-foreground">Nothing here.</p>}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

/* ============ ANNOUNCEMENTS ============ */
export function Announcements() {
  const { announcements: items, reach, act, refresh } = useLive()
  const branchesQ = useFetch(() => api.branches())
  const deptsQ = useFetch(() => api.departments())
  const [compose, setCompose] = useState(false)
  const blank = { title: '', audience: 'all|', tag: 'General', body: '' }
  const [f, setF] = useState(blank)
  async function send(status: 'Published' | 'Draft') {
    const [audienceType, audienceValue] = f.audience.split('|')
    const r = await act(() => api.addAnnouncement({ title: f.title, body: f.body, tag: f.tag, audienceType, audienceValue: audienceValue || undefined, status }),
      { ok: { title: status === 'Published' ? 'Announcement published' : 'Draft saved', desc: status === 'Published' ? 'Delivered to selected audience.' : undefined }, reload: ['announcements', 'reach', 'overview'] })
    if (r) { setCompose(false); setF(blank) }
  }
  const tagTone = { General: 'neutral', Schedule: 'info', Emergency: 'danger', Meeting: 'primary' } as const
  return (
    <>
      <PageHeader title="Announcements" subtitle="Broadcast to your whole organization or targeted groups." actions={<Button icon="plus" variant="primary" onClick={() => setCompose(true)}>New announcement</Button>} />
      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="flex flex-col gap-3">
          {items.map((a) => (
            <Card key={a.id} className={cx('cursor-pointer p-4', !a.read && 'border-l-2 border-l-primary')} onClick={() => { if (!a.read) void api.readAnnouncement(a.id).then(() => refresh('announcements')) }}>
              <div className="flex items-center gap-2"><Badge tone={tagTone[a.tag]} dot>{a.tag}</Badge>{!a.read && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}<span className="ml-auto text-[12px] text-muted-foreground">{a.time}</span></div>
              <h3 className="mt-2 font-display text-[15px] font-semibold text-card-foreground">{a.title}</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{a.body}</p>
              <div className="mt-3 flex items-center gap-2 text-[12px] text-muted-foreground"><Icon.megaphone width={13} height={13} /> {a.audience}<span className="text-border-strong">·</span> {a.author}</div>
            </Card>
          ))}
        </div>
        <Card className="h-fit p-5">
          <h3 className="mb-3 font-display text-[15px] font-semibold text-card-foreground">Delivery reach</h3>
          <div className="flex flex-col gap-3">
            {reach.map((r, i) => (
              <div key={r.label}><div className="mb-1 flex justify-between text-[13px]"><span className="text-muted-foreground">{r.label}</span><span className="font-mono text-muted-foreground tnum">{r.count} recipient{r.count === 1 ? '' : 's'}</span></div><Meter value={reach[0]?.count ? (r.count / reach[0].count) * 100 : 0} tone={(['ok', 'primary', 'info', 'warn'] as const)[i % 4] as any} /></div>
            ))}
          </div>
        </Card>
      </div>
      <Modal open={compose} onClose={() => setCompose(false)} title="New announcement" wide footer={<><Button variant="ghost" onClick={() => void send('Draft')}>Save draft</Button><Button variant="primary" onClick={() => void send('Published')}>Publish</Button></>}>
        <div className="flex flex-col gap-4">
          <Field label="Title"><Input placeholder="What's the announcement?" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Audience"><Select value={f.audience} onChange={(e) => setF({ ...f, audience: e.target.value })}>
              <option value="all|">Entire organization</option>
              {(branchesQ.data?.items ?? []).map((b: { id: string; name: string }) => <option key={b.id} value={`branch|${b.id}`}>{b.name}</option>)}
              {(deptsQ.data?.items ?? []).map((d: { id: string; name: string }) => <option key={d.id} value={`department|${d.id}`}>{d.name} dept.</option>)}
              <option value="role|teacher">Teachers</option><option value="role|coordinator">Coordinators</option>
            </Select></Field>
            <Field label="Type"><Select value={f.tag} onChange={(e) => setF({ ...f, tag: e.target.value })}><option>General</option><option>Schedule</option><option>Meeting</option><option>Emergency</option></Select></Field>
          </div>
          <Field label="Message"><textarea rows={4} className="w-full rounded-lg border border-border bg-surface-2 p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="Write your message…" value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} /></Field>
        </div>
      </Modal>
    </>
  )
}
