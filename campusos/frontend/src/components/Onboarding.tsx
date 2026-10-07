import { useState } from 'react'
import { api, ApiError, setSession, type Session_ } from '../lib/api'
import { Icon, type IconName } from '../lib/icons'
import { Avatar, Badge, Button, cx, Field, Input, Select } from '../lib/ui'

type StepDef = { id: string; label: string; title: string; desc: string; icon: IconName }
const STEPS: StepDef[] = [
  { id: 'org', label: 'Organization', title: 'Create your organization', desc: "Let's set up your workspace. You can change any of this later.", icon: 'building' },
  { id: 'type', label: 'Type', title: 'What kind of organization?', desc: 'This tailors terminology and defaults across CampusOS.', icon: 'grid' },
  { id: 'branches', label: 'Branches', title: 'Add your branches', desc: 'Campuses or locations you operate from.', icon: 'mapPin' },
  { id: 'departments', label: 'Departments', title: 'Create departments', desc: 'Group subjects and teachers by department.', icon: 'book' },
  { id: 'teachers', label: 'Teachers', title: 'Add your teachers', desc: 'Invite staff — they get an onboarding email.', icon: 'users' },
  { id: 'classes', label: 'Classes', title: 'Create classes', desc: 'The groups your teachers will teach.', icon: 'clipboard' },
  { id: 'rooms', label: 'Rooms', title: 'Add rooms', desc: 'Physical spaces to schedule sessions into.', icon: 'door' },
  { id: 'timetable', label: 'Timetable', title: 'Build your first timetable', desc: 'Set operating days and hours — schedule sessions after setup.', icon: 'calendar' },
  { id: 'invite', label: 'Invite', title: 'Invite your team', desc: 'Bring in admins and coordinators to help run things.', icon: 'megaphone' },
]

const ORG_TYPES: { name: string; desc: string; icon: IconName }[] = [
  { name: 'School', desc: 'Primary & secondary education', icon: 'book' },
  { name: 'University', desc: 'Higher education & faculties', icon: 'award' },
  { name: 'College', desc: 'Diplomas & further education', icon: 'clipboard' },
  { name: 'Tuition Centre', desc: 'Supplementary tuition', icon: 'users' },
  { name: 'Training Centre', desc: 'Vocational & professional', icon: 'gauge' },
  { name: 'Academy', desc: 'Specialized programs', icon: 'building' },
]

type ChipItem = { id: number; name: string; meta?: string }

export function Onboarding({ onComplete, onExit }: { onComplete: (s: Session_) => void; onExit: () => void }) {
  const [step, setStep] = useState(0)
  const [orgName, setOrgName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [password, setPassword] = useState('')
  const [timezone, setTimezone] = useState('GMT (UTC+0)')
  const [dayStart, setDayStart] = useState('08:00')
  const [dayEnd, setDayEnd] = useState('16:00')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [orgType, setOrgType] = useState('School')
  const [branches, setBranches] = useState<ChipItem[]>([])
  const [departments, setDepartments] = useState<ChipItem[]>([])
  const [teachers, setTeachers] = useState<ChipItem[]>([])
  const [classesL, setClassesL] = useState<ChipItem[]>([])
  const [rooms, setRooms] = useState<ChipItem[]>([])
  const [days, setDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])
  const [invites, setInvites] = useState<ChipItem[]>([])

  const s = STEPS[step]
  const pct = Math.round(((step + 1) / STEPS.length) * 100)
  const isLast = step === STEPS.length - 1

  const ROLE_IDS: Record<string, string> = { Admin: 'admin', 'Academic Manager': 'academic', Coordinator: 'coordinator' }
  async function finish() {
    setError(null)
    if (!orgName.trim() || !ownerName.trim() || !ownerEmail.trim() || password.length < 8) {
      setStep(0)
      setError('Enter the organization name, your name, a work email and a password of at least 8 characters.')
      return
    }
    const badTeacher = teachers.find((t) => !t.meta || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t.meta))
    if (badTeacher) { setStep(4); setError(`Add a valid work email for ${badTeacher.name}.`); return }
    setBusy(true)
    try {
      const session = await api.signupOrg({
        orgName: orgName.trim(), orgType, name: ownerName.trim(), email: ownerEmail.trim(), password, timezone,
        setup: {
          branches: branches.map((b) => b.name), departments: departments.map((d) => d.name),
          teachers: teachers.map((t) => ({ name: t.name, email: t.meta })),
          classes: classesL.map((c) => ({ name: c.name, subject: c.meta })),
          rooms: rooms.map((r) => ({ name: r.name, capacity: parseInt(r.meta ?? '', 10) || 30 })),
          timetable: { operatingDays: days, dayStart, dayEnd },
          invites: invites.map((i) => ({ email: i.name, role: ROLE_IDS[i.meta ?? 'Admin'] ?? 'admin' })),
        },
      })
      setSession(session)
      onComplete(session)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong')
      setBusy(false)
    }
  }
  function next() { isLast ? void finish() : setStep((n) => n + 1) }
  function back() { step === 0 ? onExit() : setStep((n) => n - 1) }

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[300px_1fr]">
      {/* Rail */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#0a0d14] p-8 text-white lg:flex">
        <div className="pointer-events-none absolute inset-0 opacity-50" style={{ background: 'radial-gradient(500px 400px at 20% 0%, rgba(79,70,229,0.32), transparent)' }} />
        <div className="relative">
          <div className="flex items-center gap-2.5"><Icon.logo /><span className="font-display text-lg font-bold tracking-tight">CampusOS</span></div>
          <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.18em] text-white/40">Setup · {pct}% complete</p>
          <nav className="mt-4 flex flex-col gap-1">
            {STEPS.map((st, i) => {
              const done = i < step
              const active = i === step
              return (
                <button key={st.id} onClick={() => i <= step && setStep(i)} disabled={i > step} className={cx('flex items-center gap-3 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors', active ? 'bg-white/10 text-white' : done ? 'text-white/60 hover:bg-white/5' : 'text-white/30')}>
                  <span className={cx('flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold', done ? 'bg-primary text-white' : active ? 'border-2 border-primary text-white' : 'border border-white/20')}>
                    {done ? <Icon.check width={13} height={13} /> : i + 1}
                  </span>
                  <span className="font-medium">{st.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
        <p className="relative text-[12px] text-white/40">You can skip steps and finish setup later from Settings.</p>
      </aside>

      {/* Content */}
      <div className="flex flex-col">
        {/* Mobile progress */}
        <div className="border-b border-border px-5 py-3 lg:hidden">
          <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Icon.logo /><span className="font-display font-bold text-foreground">CampusOS</span></div><span className="font-mono text-[12px] text-muted-foreground">Step {step + 1}/{STEPS.length}</span></div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} /></div>
        </div>

        <div className="flex flex-1 items-start justify-center overflow-y-auto px-5 py-8 lg:px-12 lg:py-14">
          <div key={s.id} className="animate-in w-full max-w-xl">
            <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">{(() => { const I = Icon[s.icon]; return <I width={22} height={22} /> })()}</span>
            <h1 className="font-display text-[26px] font-bold tracking-tight text-foreground">{s.title}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{s.desc}</p>

            <div className="mt-7">
              {s.id === 'org' && (
                <div className="flex flex-col gap-4">
                  <Field label="Organization name"><Input value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="e.g. Greenfield Academy" /></Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Your name"><Input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="e.g. Aisha Rahman" /></Field>
                    <Field label="Work email (your sign-in)"><Input type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} placeholder="you@school.edu" /></Field>
                    <Field label="Password"><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" /></Field>
                    <Field label="Timezone"><Select value={timezone} onChange={(e) => setTimezone(e.target.value)}><option>GMT (UTC+0)</option><option>WAT (UTC+1)</option><option>EAT (UTC+3)</option><option>MYT (UTC+8)</option></Select></Field>
                  </div>
                </div>
              )}

              {s.id === 'type' && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {ORG_TYPES.map((t) => { const I = Icon[t.icon]; const on = orgType === t.name; return (
                    <button key={t.name} onClick={() => setOrgType(t.name)} className={cx('flex items-start gap-3 rounded-xl border p-4 text-left transition-all', on ? 'border-primary bg-primary-soft ring-1 ring-primary' : 'border-border bg-card hover:border-border-strong')}>
                      <span className={cx('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', on ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}><I width={18} height={18} /></span>
                      <span><span className="block text-sm font-semibold text-foreground">{t.name}</span><span className="block text-[12px] text-muted-foreground">{t.desc}</span></span>
                    </button>
                  )})}
                </div>
              )}

              {s.id === 'branches' && <ChipBuilder items={branches} setItems={setBranches} placeholder="Branch name — e.g. East Branch" label="Branch" icon="mapPin" />}
              {s.id === 'departments' && <ChipBuilder items={departments} setItems={setDepartments} placeholder="Department name — e.g. Languages" label="Department" icon="book" />}
              {s.id === 'teachers' && <PersonBuilder items={teachers} setItems={setTeachers} />}
              {s.id === 'classes' && <MetaBuilder items={classesL} setItems={setClassesL} namePh="Class name — e.g. Form 5B" metaPh="Subject" icon="clipboard" />}
              {s.id === 'rooms' && <MetaBuilder items={rooms} setItems={setRooms} namePh="Room name — e.g. Lab 301" metaPh="Capacity" icon="door" />}

              {s.id === 'timetable' && (
                <div className="flex flex-col gap-5">
                  <div>
                    <p className="mb-2 text-[13px] font-semibold text-foreground">Operating days</p>
                    <div className="flex flex-wrap gap-2">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => { const on = days.includes(d); return (
                        <button key={d} onClick={() => setDays((v) => on ? v.filter((x) => x !== d) : [...v, d])} className={cx('rounded-lg border px-3.5 py-2 text-[13px] font-semibold transition-colors', on ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:border-border-strong')}>{d}</button>
                      )})}
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Day starts"><Select value={dayStart} onChange={(e) => setDayStart(e.target.value)}><option>07:00</option><option>08:00</option><option>09:00</option></Select></Field>
                    <Field label="Day ends"><Select value={dayEnd} onChange={(e) => setDayEnd(e.target.value)}><option>15:00</option><option>16:00</option><option>17:00</option></Select></Field>
                  </div>
                  <div className="rounded-xl border border-border bg-surface-2 p-4">
                    <p className="text-[13px] font-semibold text-foreground">Ready to schedule</p>
                    <p className="mt-1 text-[12px] text-muted-foreground">{days.length} operating days · {classesL.length} classes · {teachers.length} teachers. Drag sessions into the grid from the Timetable page after setup.</p>
                  </div>
                </div>
              )}

              {s.id === 'invite' && (
                <div className="flex flex-col gap-4">
                  <InviteBuilder items={invites} setItems={setInvites} />
                  <div className="rounded-xl border border-ok/25 bg-ok-soft p-4">
                    <p className="flex items-center gap-2 text-[13px] font-semibold text-ok"><Icon.checkCircle width={16} height={16} /> You're all set</p>
                    <p className="mt-1 text-[12px] text-ok/90">{orgName} is ready. Finish to open your operations console.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {error && <p role="alert" className="mx-5 mb-3 rounded-lg border border-danger/30 bg-danger-soft px-4 py-3 text-[13px] font-medium text-danger lg:mx-12">{error}</p>}
        {/* Footer nav */}
        <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-border bg-surface/90 px-5 py-4 backdrop-blur lg:px-12">
          <Button variant="ghost" icon="chevronLeft" onClick={back}>{step === 0 ? 'Back to sign in' : 'Back'}</Button>
          <div className="flex items-center gap-2">
            {!isLast && <Button variant="ghost" onClick={next}>Skip</Button>}
            <Button variant="primary" disabled={busy} iconRight={isLast ? 'check' : 'chevronRight'} onClick={next}>{isLast ? (busy ? 'Creating…' : 'Finish setup') : 'Continue'}</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---- builders ---- */
function useAdd<T extends ChipItem>(items: T[], setItems: (v: T[]) => void) {
  return (item: Omit<T, 'id'>) => setItems([...items, { ...item, id: Date.now() } as T])
}

function ChipBuilder({ items, setItems, placeholder, label, icon }: { items: ChipItem[]; setItems: (v: ChipItem[]) => void; placeholder: string; label: string; icon: IconName }) {
  const [val, setVal] = useState('')
  const add = useAdd(items, setItems)
  const I = Icon[icon]
  function submit() { if (!val.trim()) return; add({ name: val.trim() }); setVal('') }
  return (
    <div className="flex flex-col gap-3">
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); submit() }}>
        <div className="flex-1"><Input value={val} onChange={(e) => setVal(e.target.value)} placeholder={placeholder} /></div>
        <Button type="submit" variant="primary" icon="plus">Add</Button>
      </form>
      <div className="flex flex-col gap-2">
        {items.map((it) => (
          <div key={it.id} className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-soft text-primary"><I width={16} height={16} /></span>
            <span className="flex-1 text-sm font-medium text-foreground">{it.name}</span>
            <Badge>{label}</Badge>
            <button onClick={() => setItems(items.filter((x) => x.id !== it.id))} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-danger"><Icon.x width={15} height={15} /></button>
          </div>
        ))}
      </div>
    </div>
  )
}

function MetaBuilder({ items, setItems, namePh, metaPh, icon }: { items: ChipItem[]; setItems: (v: ChipItem[]) => void; namePh: string; metaPh: string; icon: IconName }) {
  const [name, setName] = useState('')
  const [meta, setMeta] = useState('')
  const add = useAdd(items, setItems)
  const I = Icon[icon]
  function submit() { if (!name.trim()) return; add({ name: name.trim(), meta: meta.trim() || undefined }); setName(''); setMeta('') }
  return (
    <div className="flex flex-col gap-3">
      <form className="grid gap-2 sm:grid-cols-[1.4fr_1fr_auto]" onSubmit={(e) => { e.preventDefault(); submit() }}>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={namePh} />
        <Input value={meta} onChange={(e) => setMeta(e.target.value)} placeholder={metaPh} />
        <Button type="submit" variant="primary" icon="plus">Add</Button>
      </form>
      <div className="flex flex-col gap-2">
        {items.map((it) => (
          <div key={it.id} className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-soft text-primary"><I width={16} height={16} /></span>
            <span className="flex-1 text-sm font-medium text-foreground">{it.name}</span>
            {it.meta && <span className="text-[12px] text-muted-foreground">{it.meta}</span>}
            <button onClick={() => setItems(items.filter((x) => x.id !== it.id))} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-danger"><Icon.x width={15} height={15} /></button>
          </div>
        ))}
      </div>
    </div>
  )
}

function PersonBuilder({ items, setItems }: { items: ChipItem[]; setItems: (v: ChipItem[]) => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const add = useAdd(items, setItems)
  function submit() { if (!name.trim()) return; add({ name: name.trim(), meta: email.trim() || undefined }); setName(''); setEmail('') }
  return (
    <div className="flex flex-col gap-3">
      <form className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]" onSubmit={(e) => { e.preventDefault(); submit() }}>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
        <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Work email" />
        <Button type="submit" variant="primary" icon="plus">Add</Button>
      </form>
      <div className="flex flex-col gap-2">
        {items.map((it) => (
          <div key={it.id} className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
            <Avatar name={it.name} size={32} />
            <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-foreground">{it.name}</span>{it.meta && <span className="block truncate text-[12px] text-muted-foreground">{it.meta}</span>}</span>
            <Badge tone="warn">Invite pending</Badge>
            <button onClick={() => setItems(items.filter((x) => x.id !== it.id))} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-danger"><Icon.x width={15} height={15} /></button>
          </div>
        ))}
        {items.length === 0 && <p className="rounded-lg border border-dashed border-border py-6 text-center text-[13px] text-muted-foreground">No teachers added yet.</p>}
      </div>
    </div>
  )
}

function InviteBuilder({ items, setItems }: { items: ChipItem[]; setItems: (v: ChipItem[]) => void }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('Admin')
  const add = useAdd(items, setItems)
  function submit() { if (!email.trim()) return; add({ name: email.trim(), meta: role }); setEmail('') }
  return (
    <div className="flex flex-col gap-3">
      <form className="grid gap-2 sm:grid-cols-[1.4fr_1fr_auto]" onSubmit={(e) => { e.preventDefault(); submit() }}>
        <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teammate@campusos.io" />
        <Select value={role} onChange={(e) => setRole(e.target.value)}><option>Admin</option><option>Academic Manager</option><option>Coordinator</option></Select>
        <Button type="submit" variant="primary" icon="plus">Invite</Button>
      </form>
      <div className="flex flex-col gap-2">
        {items.map((it) => (
          <div key={it.id} className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground"><Icon.inbox width={16} height={16} /></span>
            <span className="flex-1 truncate text-sm font-medium text-foreground">{it.name}</span>
            <Badge tone="primary">{it.meta}</Badge>
            <button onClick={() => setItems(items.filter((x) => x.id !== it.id))} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-danger"><Icon.x width={15} height={15} /></button>
          </div>
        ))}
        {items.length === 0 && <p className="rounded-lg border border-dashed border-border py-6 text-center text-[13px] text-muted-foreground">Optional — invite teammates now or later from Settings.</p>}
      </div>
    </div>
  )
}
