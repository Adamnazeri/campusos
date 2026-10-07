import { useState } from 'react'
import { Icon } from '../lib/icons'
import { Avatar, Badge, Button, Card, cx, Field, Input, Meter, Modal, PageHeader, Select, Tabs, useToast } from '../lib/ui'
import { StatCard, Td, Th, TableWrap, Toolbar } from '../components/common'
import { useApp } from '../lib/store'
import { useFetch, useLive } from '../lib/live'
import { api, ApiError, downloadReport } from '../lib/api'

function statusTone(s: string) {
  return s === 'Overloaded' ? 'danger' : s === 'Heavy' ? 'warn' : s === 'Light' ? 'info' : 'ok'
}

/* ============ TEACHERS ============ */
export function Teachers() {
  const { navigate } = useApp()
  const { push } = useToast()
  const { teachers, act } = useLive()
  const deptsQ = useFetch(() => api.departments())
  const branchesQ = useFetch(() => api.branches())
  const [q, setQ] = useState('')
  const [dept, setDept] = useState('')
  const [branch, setBranch] = useState('')
  const [add, setAdd] = useState(false)
  const [f, setF] = useState({ name: '', email: '', department: '', branch: '', title: 'Teacher', hours: '20' })
  const depts = [...new Set(teachers.map((t) => t.department))]
  const list = teachers.filter((t) => (!q || t.name.toLowerCase().includes(q.toLowerCase())) && (!dept || t.department === dept) && (!branch || t.branch === branch))
  async function submit() {
    const r = await act(() => api.addTeacher({ name: f.name, email: f.email, department: f.department || undefined, branch: f.branch || undefined, title: f.title, weeklyHours: Number(f.hours) || 0 }),
      { ok: { title: 'Invitation sent', desc: `${f.name} will receive an onboarding email.` }, reload: ['teachers', 'overview', 'workload'] })
    if (r) { setAdd(false); setF({ name: '', email: '', department: '', branch: '', title: 'Teacher', hours: '20' }) }
  }

  return (
    <>
      <PageHeader title="Teachers" subtitle={`${teachers.length} staff across ${depts.length} department${depts.length === 1 ? '' : 's'}`} actions={<><Button icon="download" variant="outline" onClick={() => downloadReport('wl').catch((e) => push({ title: 'Export failed', desc: e instanceof ApiError ? e.message : undefined, tone: 'danger' }))}>Export</Button><Button icon="plus" variant="primary" onClick={() => setAdd(true)}>Add teacher</Button></>} />
      <Toolbar>
        <div className="min-w-[220px] flex-1"><Input icon="search" placeholder="Search teachers…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <Select value={dept} onChange={(e) => setDept(e.target.value)}><option value="">All departments</option>{depts.map((d) => <option key={d}>{d}</option>)}</Select>
        <Select value={branch} onChange={(e) => setBranch(e.target.value)}><option value="">All branches</option>{(branchesQ.data?.items ?? []).map((b: { id: string; name: string }) => <option key={b.id}>{b.name}</option>)}</Select>
      </Toolbar>

      <TableWrap>
        <thead className="border-b border-border bg-surface-2"><tr>
          <Th>Teacher</Th><Th>Department</Th><Th>Subjects</Th><Th>Classes</Th><Th>Weekly hours</Th><Th>Attendance</Th><Th>Status</Th><Th />
        </tr></thead>
        <tbody className="divide-y divide-border">
          {list.map((t) => (
            <tr key={t.id} className="cursor-pointer transition-colors hover:bg-muted/50" onClick={() => navigate('teacher-profile', t.id)}>
              <Td><div className="flex items-center gap-3"><Avatar name={t.name} size={34} /><div><p className="font-semibold">{t.name}</p><p className="text-[12px] text-muted-foreground">{t.role}</p></div></div></Td>
              <Td className="text-muted-foreground">{t.department}</Td>
              <Td><div className="flex gap-1">{t.subjects.slice(0, 2).map((s) => <Badge key={s}>{s}</Badge>)}</div></Td>
              <Td className="tnum">{t.classes}</Td>
              <Td className="tnum">{t.hours}h</Td>
              <Td className="tnum text-muted-foreground">{t.attendanceRate}%</Td>
              <Td><Badge tone={statusTone(t.status) as any} dot>{t.status}</Badge></Td>
              <Td><Icon.chevronRight width={16} height={16} className="text-muted-foreground" /></Td>
            </tr>
          ))}
        </tbody>
      </TableWrap>

      <Modal open={add} onClose={() => setAdd(false)} title="Add teacher" wide
        footer={<><Button variant="ghost" onClick={() => setAdd(false)}>Cancel</Button><Button variant="primary" onClick={() => void submit()}>Send invite</Button></>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name"><Input placeholder="e.g. Sarah Mensah" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Work email"><Input placeholder="name@campusos.io" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
          <Field label="Department"><Select value={f.department} onChange={(e) => setF({ ...f, department: e.target.value })}><option value="">None</option>{(deptsQ.data?.items ?? []).map((d: { id: string; name: string }) => <option key={d.id}>{d.name}</option>)}</Select></Field>
          <Field label="Branch"><Select value={f.branch} onChange={(e) => setF({ ...f, branch: e.target.value })}><option value="">None</option>{(branchesQ.data?.items ?? []).map((b: { id: string; name: string }) => <option key={b.id}>{b.name}</option>)}</Select></Field>
          <Field label="Role"><Select value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })}><option>Teacher</option><option>Senior Teacher</option><option>Coordinator</option></Select></Field>
          <Field label="Weekly hours target"><Input type="number" value={f.hours} onChange={(e) => setF({ ...f, hours: e.target.value })} /></Field>
        </div>
      </Modal>
    </>
  )
}

/* ============ TEACHER PROFILE ============ */
export function TeacherProfile({ id }: { id?: string }) {
  const { navigate } = useApp()
  const { teachers, classes, assignments, activity } = useLive()
  const t = teachers.find((x) => x.id === id) ?? teachers[0]
  const [tab, setTab] = useState('overview')
  const prof = useFetch(() => (t ? api.teacher(t.id) : Promise.resolve(null)), [t?.id])
  if (!t) return <Card className="p-10 text-center text-sm text-muted-foreground">Loading teacher…</Card>
  const myClasses = classes.filter((c) => c.teacher === t.name)
  const myAssign = assignments.filter((a) => a.teacher === t.name)
  const myActivity = activity.filter((a) => a.by === t.name)
  const pct = Math.min(100, (t.hours / 40) * 100)
  const bal: { type: string; allowance: number; remaining: number }[] = prof.data?.leave?.balances ?? []

  return (
    <>
      <button onClick={() => navigate('teachers')} className="mb-4 flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground hover:text-foreground"><Icon.chevronLeft width={16} height={16} /> Teachers</button>

      <Card className="mb-5 overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-primary/15 via-primary/5 to-transparent" />
        <div className="flex flex-wrap items-end gap-4 px-5 pb-5">
          <div className="-mt-8"><div className="rounded-full border-4 border-card"><Avatar name={t.name} size={72} /></div></div>
          <div className="flex-1">
            <div className="flex items-center gap-2"><h1 className="font-display text-xl font-bold text-foreground">{t.name}</h1><Badge tone={statusTone(t.status) as any} dot>{t.status}</Badge></div>
            <p className="text-sm text-muted-foreground">{t.role} · {t.department} · {t.branch}</p>
          </div>
          <div className="flex gap-2"><Button variant="outline" icon="megaphone" onClick={() => navigate('announcements')}>Message</Button><Button variant="primary" icon="calendar" onClick={() => navigate('timetable')}>View schedule</Button></div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Weekly hours" value={`${t.hours}h`} icon="gauge" sub={`${t.classes} classes`} />
        <StatCard label="Attendance activity" value={`${t.attendanceRate}%`} icon="checkCircle" sub="Marking consistency" />
        <StatCard label="Students taught" value={`${myClasses.reduce((a, c) => a + c.students, 0)}`} icon="users" sub={`${myClasses.length} classes`} />
        <StatCard label="Assignments" value={String(myAssign.length)} icon="clipboard" sub={`${myAssign.filter((a) => a.status === 'Published').length} published`} />
      </div>

      <div className="mt-5">
        <Tabs value={tab} onChange={setTab} tabs={[{ id: 'overview', label: 'Overview' }, { id: 'classes', label: 'Classes', count: myClasses.length }, { id: 'schedule', label: 'Schedule' }, { id: 'activity', label: 'Activity' }, { id: 'leave', label: 'Leave' }]} />
        <div className="mt-4">
          {tab === 'overview' && (
            <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
              <Card className="p-5">
                <h3 className="mb-3 font-display text-[15px] font-semibold text-card-foreground">Details</h3>
                <dl className="flex flex-col gap-3 text-sm">
                  {[['Email', t.email], ['Phone', t.phone], ['Department', t.department], ['Branch', t.branch], ['Joined', t.joined], ['Subjects', t.subjects.join(', ')]].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4"><dt className="text-muted-foreground">{k}</dt><dd className="text-right font-medium text-foreground">{v}</dd></div>
                  ))}
                </dl>
                <div className="mt-4 border-t border-border pt-4">
                  <div className="mb-1.5 flex justify-between text-[13px]"><span className="text-muted-foreground">Workload capacity</span><span className="font-semibold text-foreground">{t.hours}/40h</span></div>
                  <Meter value={pct} tone={statusTone(t.status) as any} />
                </div>
              </Card>
              <Card className="p-5">
                <h3 className="mb-4 font-display text-[15px] font-semibold text-card-foreground">Activity timeline</h3>
                <div className="relative pl-5">
                  <div className="absolute left-[6px] top-1 bottom-1 w-px bg-border" />
                  {myActivity.length === 0 && <p className="text-[13px] text-muted-foreground">No recent activity.</p>}
                  {myActivity.map((a, i) => (
                    <div key={i} className="relative mb-4 last:mb-0">
                      <span className="absolute -left-[15px] top-1 h-2.5 w-2.5 rounded-full border-2 border-card bg-primary" />
                      <p className="text-[13px] text-foreground">{a.text}</p>
                      <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{a.time}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
          {tab === 'classes' && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {myClasses.map((c) => (
                <Card key={c.id} className="cursor-pointer p-4 hover:border-border-strong" onClick={() => navigate('class-detail', c.id)}>
                  <div className="flex items-center justify-between"><p className="font-display font-semibold text-foreground">{c.name}</p><Badge tone="primary">{c.subject}</Badge></div>
                  <p className="mt-2 text-[13px] text-muted-foreground">{c.students} students · {c.room}</p>
                  <p className="mt-1 text-[12px] text-muted-foreground">{c.schedule}</p>
                </Card>
              ))}
            </div>
          )}
          {tab === 'schedule' && (
            <Card className="divide-y divide-border">
              {(prof.data?.schedule ?? []).length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">No sessions scheduled.</p>}
              {(prof.data?.schedule ?? []).map((s: { id: string; day: string; start: string; end: string; className: string; subject: string; room: string }) => (
                <div key={s.id} className="flex items-center gap-3 px-4 py-3"><span className="w-12 font-semibold text-foreground">{s.day}</span><span className="w-28 font-mono text-[12px] text-muted-foreground tnum">{s.start}–{s.end}</span><p className="flex-1 text-sm text-foreground">{s.subject} · {s.className}</p><span className="text-[13px] text-muted-foreground">{s.room}</span></div>
              ))}
            </Card>
          )}
          {tab === 'activity' && (
            <Card className="divide-y divide-border">
              {myActivity.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">No recent activity.</p>}
              {myActivity.map((a, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3"><span className="font-mono text-[12px] text-muted-foreground tnum">{a.time}</span><p className="text-sm text-foreground">{a.text}</p></div>
              ))}
            </Card>
          )}
          {tab === 'leave' && (
            <Card className="p-5">
              <div className="flex items-center justify-between"><p className="text-sm font-semibold text-foreground">Leave balance</p><Badge tone="ok">{bal.reduce((a, b) => a + b.remaining, 0)} days remaining</Badge></div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {bal.map((b) => [b.type.replace(' leave', ''), `${b.remaining} / ${b.allowance}`]).map(([k, v]) => (
                  <div key={k} className="rounded-lg border border-border bg-surface-2 p-3"><p className="text-[12px] text-muted-foreground">{k}</p><p className="mt-1 font-display text-lg font-bold text-foreground tnum">{v}</p></div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}

/* ============ CLASSES ============ */
export function Classes() {
  const { navigate } = useApp()
  const { push } = useToast()
  const { classes, teachers, rooms, act } = useLive()
  const branchesQ = useFetch(() => api.branches())
  const [q, setQ] = useState('')
  const [fSubject, setFSubject] = useState('')
  const [fTeacher, setFTeacher] = useState('')
  const [add, setAdd] = useState(false)
  const blank = { name: '', subject: '', teacher: '', room: '', branch: '' }
  const [f, setF] = useState(blank)
  const subjects = [...new Set(classes.map((c) => c.subject))]
  const list = classes.filter((c) => (!q || c.name.toLowerCase().includes(q.toLowerCase())) && (!fSubject || c.subject === fSubject) && (!fTeacher || c.teacher === fTeacher))
  async function submit() {
    const r = await act(() => api.addClass({ name: f.name, subject: f.subject || undefined, teacher: f.teacher || undefined, room: f.room || undefined, branch: f.branch || undefined }),
      { ok: { title: 'Class created', desc: f.name }, reload: ['classes', 'overview', 'workload'] })
    if (r) { setAdd(false); setF(blank) }
  }
  return (
    <>
      <PageHeader title="Classes" subtitle={`${classes.length} active classes`} actions={<><Button icon="download" variant="outline" onClick={() => downloadReport('cls').catch((e) => push({ title: 'Export failed', desc: e instanceof ApiError ? e.message : undefined, tone: 'danger' }))}>Export</Button><Button icon="plus" variant="primary" onClick={() => setAdd(true)}>Create class</Button></>} />
      <Toolbar>
        <div className="min-w-[220px] flex-1"><Input icon="search" placeholder="Search classes…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <Select value={fSubject} onChange={(e) => setFSubject(e.target.value)}><option value="">All subjects</option>{subjects.map((s) => <option key={s}>{s}</option>)}</Select>
        <Select value={fTeacher} onChange={(e) => setFTeacher(e.target.value)}><option value="">All teachers</option>{teachers.map((t) => <option key={t.id}>{t.name}</option>)}</Select>
      </Toolbar>
      <TableWrap>
        <thead className="border-b border-border bg-surface-2"><tr><Th>Class</Th><Th>Teacher</Th><Th>Students</Th><Th>Schedule</Th><Th>Room</Th><Th>Attendance</Th><Th>Status</Th><Th /></tr></thead>
        <tbody className="divide-y divide-border">
          {list.map((c) => (
            <tr key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate('class-detail', c.id)}>
              <Td><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-[13px] font-bold text-primary">{c.name.replace('Form ', '').slice(0, 3)}</span><div><p className="font-semibold">{c.name}</p><p className="text-[12px] text-muted-foreground">{c.subject}</p></div></div></Td>
              <Td className="text-muted-foreground">{c.teacher}</Td>
              <Td className="tnum">{c.students}</Td>
              <Td className="text-muted-foreground">{c.schedule}</Td>
              <Td className="text-muted-foreground">{c.room}</Td>
              <Td><div className="flex items-center gap-2"><Meter value={c.attendance} tone={c.attendance >= 95 ? 'ok' : 'primary'} className="w-16" /><span className="font-mono text-[12px] text-muted-foreground tnum">{c.attendance}%</span></div></Td>
              <Td><Badge tone="ok" dot>{c.status}</Badge></Td>
              <Td><Icon.chevronRight width={16} height={16} className="text-muted-foreground" /></Td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
      <Modal open={add} onClose={() => setAdd(false)} title="Create class" wide footer={<><Button variant="ghost" onClick={() => setAdd(false)}>Cancel</Button><Button variant="primary" onClick={() => void submit()}>Create class</Button></>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Class name"><Input placeholder="e.g. Form 4A" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Subject"><Input placeholder="e.g. Mathematics" value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} /></Field>
          <Field label="Assign teacher"><Select value={f.teacher} onChange={(e) => setF({ ...f, teacher: e.target.value })}><option value="">Unassigned</option>{teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</Select></Field>
          <Field label="Assign room"><Select value={f.room} onChange={(e) => setF({ ...f, room: e.target.value })}><option value="">None</option>{rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</Select></Field>
          <Field label="Branch"><Select value={f.branch} onChange={(e) => setF({ ...f, branch: e.target.value })}><option value="">None</option>{(branchesQ.data?.items ?? []).map((b: { id: string; name: string }) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select></Field>
        </div>
      </Modal>
    </>
  )
}

/* ============ CLASS DETAIL ============ */
export function ClassDetail({ id }: { id?: string }) {
  const { navigate } = useApp()
  const { classes, rooms } = useLive()
  const c = classes.find((x) => x.id === id) ?? classes[0]
  const [tab, setTab] = useState('overview')
  const det = useFetch(() => (c ? api.classDetail(c.id) : Promise.resolve(null)), [c?.id])
  if (!c) return <Card className="p-10 text-center text-sm text-muted-foreground">Loading class…</Card>
  const roster: { id: string; name: string }[] = det.data?.roster ?? []
  const recent: { date: string; present: number; absent: number; late: number; rate: number | null }[] = det.data?.recentAttendance ?? []
  const classAssignments: { id: string; title: string; dueDate: string | null; status: string }[] = det.data?.assignments ?? []
  return (
    <>
      <button onClick={() => navigate('classes')} className="mb-4 flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground hover:text-foreground"><Icon.chevronLeft width={16} height={16} /> Classes</button>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-soft font-display text-lg font-bold text-primary">{c.name.replace('Form ', '')}</span>
          <div><div className="flex items-center gap-2"><h1 className="font-display text-xl font-bold text-foreground">{c.name}</h1><Badge tone="ok" dot>{c.status}</Badge></div><p className="text-sm text-muted-foreground">{c.subject} · {c.students} students · {c.branch}</p></div>
        </div>
        <div className="flex gap-2"><Button variant="outline" icon="calendar" onClick={() => navigate('timetable')}>Reschedule</Button><Button variant="primary" icon="checkCircle" onClick={() => navigate('attendance')}>Attendance</Button></div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Assigned teacher" value={c.teacher.split(' ')[0]} icon="user" sub={c.teacher} />
        <StatCard label="Room" value={c.room.replace('Room ', 'Rm ')} icon="door" sub={rooms.find((r) => r.name === c.room)?.building ?? '—'} />
        <StatCard label="Attendance" value={`${c.attendance}%`} icon="checkCircle" sub="This term" />
        <StatCard label="Schedule" value={c.schedule.split(' · ')[0]} icon="clock" sub={c.schedule.split(' · ')[1]} />
      </div>

      <div className="mt-5">
        <Tabs value={tab} onChange={setTab} tabs={[{ id: 'overview', label: 'Overview' }, { id: 'students', label: 'Students', count: c.students }, { id: 'schedule', label: 'Schedule' }, { id: 'attendance', label: 'Attendance' }, { id: 'assignments', label: 'Assignments' }]} />
        <div className="mt-4">
          {tab === 'overview' && (
            <div className="grid gap-5 lg:grid-cols-2">
              <Card className="p-5"><h3 className="mb-3 font-display text-[15px] font-semibold text-card-foreground">Class information</h3>
                <dl className="flex flex-col gap-3 text-sm">{[['Teacher', c.teacher], ['Subject', c.subject], ['Room', c.room], ['Schedule', c.schedule], ['Students', String(c.students)], ['Branch', c.branch]].map(([k, v]) => <div key={k} className="flex justify-between"><dt className="text-muted-foreground">{k}</dt><dd className="font-medium text-foreground">{v}</dd></div>)}</dl>
              </Card>
              <Card className="p-5"><h3 className="mb-4 font-display text-[15px] font-semibold text-card-foreground">Recent attendance</h3>
                <div className="flex flex-col gap-3">{recent.length === 0 && <p className="text-[13px] text-muted-foreground">No attendance recorded yet.</p>}{recent.slice(0, 5).map((a) => <div key={a.date} className="flex gap-3 text-[13px]"><span className="font-mono text-muted-foreground tnum">{a.date.slice(5)}</span><span className="text-foreground">{a.rate ?? 0}% present · {a.absent} absent · {a.late} late</span></div>)}</div>
              </Card>
            </div>
          )}
          {tab === 'students' && (
            <Card className="divide-y divide-border">
              {roster.map((s, i) => (
                <div key={s.id} className="flex items-center gap-3 px-4 py-2.5"><span className="w-6 font-mono text-[12px] text-muted-foreground tnum">{String(i + 1).padStart(2, '0')}</span><Avatar name={s.name} size={30} /><span className="flex-1 text-sm font-medium text-foreground">{s.name}</span><Badge>{['96%', '92%', '98%', '89%'][i % 4]} attendance</Badge></div>
              ))}
            </Card>
          )}
          {tab === 'schedule' && <Card className="p-8 text-center text-sm text-muted-foreground">{c.schedule} in {c.room}. Open the <button onClick={() => navigate('timetable')} className="font-semibold text-primary hover:underline">Timetable</button> to edit.</Card>}
          {tab === 'attendance' && (
            <Card className="divide-y divide-border">
              {recent.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">No attendance recorded yet.</p>}
              {recent.map((a) => <div key={a.date} className="flex items-center gap-4 px-4 py-3 text-sm"><span className="w-24 font-mono text-[12px] text-muted-foreground tnum">{a.date}</span><span className="flex-1 text-foreground">{a.present} present · {a.absent} absent · {a.late} late</span><Badge tone={(a.rate ?? 0) >= 92 ? 'ok' : 'warn'}>{a.rate ?? 0}%</Badge></div>)}
            </Card>
          )}
          {tab === 'assignments' && (
            <Card className="divide-y divide-border">
              {classAssignments.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">No assignments for {c.name} yet.</p>}
              {classAssignments.map((a) => <div key={a.id} className="flex items-center gap-4 px-4 py-3 text-sm"><span className="flex-1 font-medium text-foreground">{a.title}</span><span className="text-[13px] text-muted-foreground">Due {a.dueDate ?? '—'}</span><Badge>{a.status}</Badge></div>)}
            </Card>
          )}
        </div>
      </div>
    </>
  )
}

/* ============ ROOMS ============ */
export function Rooms() {
  const { rooms, act } = useLive()
  const [add, setAdd] = useState(false)
  const blank = { name: '', capacity: '30', building: '', type: 'Classroom' }
  const [f, setF] = useState(blank)
  async function submit() {
    const r = await act(() => api.addRoom({ name: f.name, capacity: Number(f.capacity) || 30, building: f.building || undefined, type: f.type }), { ok: { title: 'Room added', desc: f.name }, reload: ['rooms'] })
    if (r) { setAdd(false); setF(blank) }
  }
  const tone = { Occupied: 'danger', Available: 'ok', Maintenance: 'warn' } as const
  return (
    <>
      <PageHeader title="Rooms" subtitle="Live availability and utilization across all buildings." actions={<Button icon="plus" variant="primary" onClick={() => setAdd(true)}>Add room</Button>} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total rooms" value={String(rooms.length)} icon="door" />
        <StatCard label="Occupied now" value={String(rooms.filter((r) => r.status === 'Occupied').length)} deltaTone="neutral" icon="user" />
        <StatCard label="Available" value={String(rooms.filter((r) => r.status === 'Available').length)} icon="checkCircle" />
        <StatCard label="Avg utilization" value={rooms.length ? `${Math.round(rooms.reduce((a, r) => a + r.utilization, 0) / rooms.length)}%` : '—'} icon="gauge" />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map((r) => (
          <Card key={r.id} className="p-4 transition-colors hover:border-border-strong">
            <div className="flex items-start justify-between">
              <div><p className="font-display font-semibold text-foreground">{r.name}</p><p className="text-[12px] text-muted-foreground">{r.building} · {r.type}</p></div>
              <Badge tone={tone[r.status]} dot>{r.status}</Badge>
            </div>
            <div className="mt-4 flex items-center justify-between text-[13px]"><span className="text-muted-foreground">Capacity</span><span className="font-semibold text-foreground tnum">{r.capacity} seats</span></div>
            <div className="mt-3"><div className="mb-1 flex justify-between text-[12px]"><span className="text-muted-foreground">Utilization</span><span className="font-mono text-muted-foreground tnum">{r.utilization}%</span></div><Meter value={r.utilization} tone={r.utilization > 80 ? 'danger' : r.utilization > 60 ? 'warn' : 'ok'} /></div>
          </Card>
        ))}
      </div>
      <Modal open={add} onClose={() => setAdd(false)} title="Add room" footer={<><Button variant="ghost" onClick={() => setAdd(false)}>Cancel</Button><Button variant="primary" onClick={() => void submit()}>Add room</Button></>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Room name"><Input placeholder="e.g. Lab 301" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Capacity"><Input type="number" value={f.capacity} onChange={(e) => setF({ ...f, capacity: e.target.value })} /></Field>
          <Field label="Building"><Input placeholder="e.g. Block B" value={f.building} onChange={(e) => setF({ ...f, building: e.target.value })} /></Field>
          <Field label="Type"><Select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>{['Classroom', 'Laboratory', 'Computer Lab', 'Auditorium', 'Library', 'Gym', 'Other'].map((t) => <option key={t}>{t}</option>)}</Select></Field>
        </div>
      </Modal>
    </>
  )
}
