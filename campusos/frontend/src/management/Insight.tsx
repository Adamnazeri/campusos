import { useState } from 'react'
import { Icon, type IconName } from '../lib/icons'
import { Badge, Button, Card, cx, Field, Input, PageHeader, Select, Tabs, useToast } from '../lib/ui'
import { StatCard } from '../components/common'
import { LineChart, BarChart, Donut } from '../components/Charts'
import { api, ApiError, downloadReport, fmtDay, getSession, setSession } from '../lib/api'
import { useFetch, useLive } from '../lib/live'
import { useSession } from '../lib/session'

const errText = (e: unknown) => (e instanceof ApiError ? e.message : 'Terjadi ralat')
const isoDay = (d: Date) => d.toISOString().slice(0, 10)

/* ============ REPORTS ============ */
const REPORT_ICONS: Record<string, IconName> = { att: 'checkCircle', wl: 'gauge', cls: 'book', tt: 'calendar', room: 'door', leave: 'plane', asg: 'clipboard', exam: 'award' }
export function Reports() {
  const { push } = useToast()
  const list = useFetch(() => api.reports())
  const branches = useFetch(() => api.branches())
  const depts = useFetch(() => api.departments())
  const [sel, setSel] = useState('att')
  const [range, setRange] = useState('month')
  const [branch, setBranch] = useState('')
  const [dept, setDept] = useState('')
  const [preview, setPreview] = useState<{ columns: { key: string; label: string }[]; rows: Record<string, unknown>[]; total: number } | null>(null)
  const [busy, setBusy] = useState(false)
  const reports = list.data?.items ?? []
  const active = reports.find((r) => r.id === sel) ?? reports[0]
  const A = Icon[REPORT_ICONS[active?.id ?? 'att'] ?? 'file']

  function params() {
    const to = new Date(), from = new Date()
    from.setDate(to.getDate() - (range === 'week' ? 7 : range === 'month' ? 30 : 90))
    const p: Record<string, string> = { from: isoDay(from), to: isoDay(range === 'week' || range === 'month' || range === 'term' ? to : to) }
    if (branch) p.branch = branch
    if (dept) p.department = dept
    return p
  }
  async function generate() {
    if (!active) return
    setBusy(true)
    try { await downloadReport(active.id, params()); push({ title: 'Report downloaded', desc: `${active.title} (CSV).`, tone: 'ok' }) }
    catch (e) { push({ title: 'Report failed', desc: errText(e), tone: 'danger' }) }
    finally { setBusy(false) }
  }
  async function doPreview() {
    if (!active) return
    setBusy(true)
    try { setPreview(await api.reportJson(active.id, params()) as never) }
    catch (e) { push({ title: 'Preview failed', desc: errText(e), tone: 'danger' }) }
    finally { setBusy(false) }
  }

  return (
    <>
      <PageHeader title="Reports" subtitle="Generate and export operational reports as CSV." />
      <div className="grid gap-5 lg:grid-cols-[1fr_1.3fr]">
        <div className="grid gap-2.5 sm:grid-cols-2">
          {reports.map((r) => {
            const I = Icon[REPORT_ICONS[r.id] ?? 'file']
            return (
              <button key={r.id} onClick={() => { setSel(r.id); setPreview(null) }} className={cx('flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all', sel === r.id ? 'border-primary bg-primary-soft ring-1 ring-primary' : 'border-border bg-card hover:border-border-strong')}>
                <span className={cx('flex h-9 w-9 items-center justify-center rounded-lg', sel === r.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}><I width={18} height={18} /></span>
                <span className="text-[13px] font-semibold text-foreground">{r.title}</span>
                <span className="text-[11px] leading-tight text-muted-foreground">{r.desc}</span>
              </button>
            )
          })}
        </div>
        <Card className="h-fit p-5">
          {active && (
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary"><A width={22} height={22} /></span>
              <div><h2 className="font-display text-lg font-semibold text-card-foreground">{active.title}</h2><p className="text-[13px] text-muted-foreground">{active.desc}</p></div>
            </div>
          )}
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Field label="Date range"><Select value={range} onChange={(e) => setRange(e.target.value)}><option value="week">Last 7 days</option><option value="month">Last 30 days</option><option value="term">Last 90 days</option></Select></Field>
            <Field label="Branch"><Select value={branch} onChange={(e) => setBranch(e.target.value)}><option value="">All branches</option>{(branches.data?.items ?? []).map((b: { id: string; name: string }) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select></Field>
            <Field label="Department"><Select value={dept} onChange={(e) => setDept(e.target.value)}><option value="">All departments</option>{(depts.data?.items ?? []).map((d: { id: string; name: string }) => <option key={d.id} value={d.id}>{d.name}</option>)}</Select></Field>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="primary" icon="download" disabled={busy} onClick={() => void generate()}>Download CSV</Button>
            <Button variant="outline" icon="file" disabled={busy} onClick={() => void doPreview()}>Preview</Button>
          </div>
          {preview && (
            <div className="mt-5 overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-[12px]">
                <thead className="bg-surface-2"><tr>{preview.columns.map((c) => <th key={c.key} className="whitespace-nowrap px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{c.label}</th>)}</tr></thead>
                <tbody className="divide-y divide-border">
                  {preview.rows.slice(0, 8).map((r, i) => <tr key={i}>{preview.columns.map((c) => <td key={c.key} className="whitespace-nowrap px-3 py-2 text-foreground">{String(r[c.key] ?? '—')}</td>)}</tr>)}
                  {preview.rows.length === 0 && <tr><td className="px-3 py-6 text-center text-muted-foreground" colSpan={preview.columns.length}>No data for this period.</td></tr>}
                </tbody>
              </table>
              {preview.total > 8 && <p className="border-t border-border px-3 py-2 text-[11px] text-muted-foreground">Showing 8 of {preview.total} rows — download the CSV for everything.</p>}
            </div>
          )}
        </Card>
      </div>
    </>
  )
}

/* ============ ANALYTICS ============ */
export function Analytics() {
  const [range, setRange] = useState('term')
  const { data: a, loading, error } = useFetch(() => api.analytics(range), [range])
  const trend = (a?.attendanceTrend ?? []).filter((t: { rate: number | null }) => t.rate !== null).map((t: { date: string; rate: number }) => ({ label: fmtDay(t.date), value: t.rate }))
  const mix = a?.teacherStatusMix
  const delta = a?.attendance.delta as number | null | undefined
  return (
    <>
      <PageHeader title="Analytics" subtitle="Operational trends across your organization." actions={<Select value={range} onChange={(e) => setRange(e.target.value)}><option value="term">Last 90 days</option><option value="month">Last 30 days</option><option value="week">Last 7 days</option></Select>} />
      {error && <p className="mb-3 text-[13px] text-danger">{error}</p>}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Attendance rate" value={a?.attendance.rate != null ? `${a.attendance.rate}%` : '—'} delta={delta != null ? `${Math.abs(delta)}%` : undefined} deltaTone={delta != null && delta < 0 ? 'danger' : 'ok'} icon="checkCircle" sub={a ? `Target ${a.attendance.target}%` : ''} />
        <StatCard label="Room utilization" value={a ? `${a.roomUtilization}%` : '—'} icon="door" />
        <StatCard label="Assignment completion" value={a?.assignmentCompletion != null ? `${a.assignmentCompletion}%` : '—'} icon="clipboard" />
        <StatCard label="Avg workload" value={a ? `${a.avgWorkload}h` : '—'} deltaTone="neutral" icon="gauge" />
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-4 font-display text-[15px] font-semibold text-card-foreground">Attendance trend</h2>
          {trend.length > 1 ? <LineChart data={trend} min={Math.max(0, Math.floor(Math.min(...trend.map((t: { value: number }) => t.value)) - 3))} max={100} height={200} /> : <p className="py-16 text-center text-[13px] text-muted-foreground">{loading ? 'Loading…' : 'Not enough attendance data for this period.'}</p>}
        </Card>
        <Card className="flex flex-col items-center p-5">
          <h2 className="mb-4 self-start font-display text-[15px] font-semibold text-card-foreground">Teacher status mix</h2>
          {mix && mix.total > 0 ? (
            <>
              <Donut label={String(mix.total)} sub="teachers" segments={[{ value: mix.Healthy, color: 'var(--ok)' }, { value: mix.Heavy, color: 'var(--warn)' }, { value: mix.Overloaded, color: 'var(--danger)' }, { value: mix.Light, color: 'var(--info)' }].filter((s) => s.value > 0)} />
              <div className="mt-4 flex flex-col gap-2 self-stretch">
                {[['Healthy', mix.Healthy, 'var(--ok)'], ['Heavy', mix.Heavy, 'var(--warn)'], ['Overloaded', mix.Overloaded, 'var(--danger)'], ['Light', mix.Light, 'var(--info)']].map(([l, n, c]) => (
                  <div key={l as string} className="flex items-center gap-2 text-[13px]"><span className="h-2.5 w-2.5 rounded-full" style={{ background: c as string }} /><span className="flex-1 text-muted-foreground">{l}</span><span className="font-mono text-muted-foreground tnum">{n}</span></div>
                ))}
              </div>
            </>
          ) : <p className="py-10 text-[13px] text-muted-foreground">No teachers yet.</p>}
        </Card>
      </div>
      <Card className="mt-5 p-5">
        <h2 className="mb-4 font-display text-[15px] font-semibold text-card-foreground">Teaching hours by department</h2>
        {(a?.hoursByDepartment ?? []).length ? <BarChart data={a.hoursByDepartment} unit="h" /> : <p className="py-8 text-center text-[13px] text-muted-foreground">No data yet.</p>}
      </Card>
    </>
  )
}

/* ============ SETTINGS ============ */
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className={cx('flex h-6 w-11 items-center rounded-full p-0.5 transition-colors', on ? 'bg-primary' : 'bg-muted')}>
      <span className={cx('h-5 w-5 rounded-full bg-white shadow transition-transform', on && 'translate-x-5')} />
    </button>
  )
}

export function Settings() {
  const { user, setUser } = useSession()
  const { act } = useLive()
  const [tab, setTab] = useState('org')
  const org = useFetch(() => api.org())
  const settings = useFetch(() => api.settings())
  const roles = useFetch(() => api.roles())
  const branches = useFetch(() => api.branches())
  const depts = useFetch(() => api.departments())
  const [orgF, setOrgF] = useState<{ name: string; type: string; contactEmail: string; timezone: string } | null>(null)
  const o = orgF ?? (org.data ? { name: org.data.name, type: org.data.type, contactEmail: org.data.contactEmail ?? '', timezone: org.data.timezone } : null)
  const [newBranch, setNewBranch] = useState('')
  const [newDept, setNewDept] = useState('')
  const [tfa, setTfa] = useState<{ secret: string; otpauthUrl: string } | null>(null)
  const [code, setCode] = useState('')
  const [pw, setPw] = useState('')
  const s = settings.data

  async function patchSetting(patch: Record<string, unknown>) {
    const r = await act(() => api.patchSettings(patch))
    if (r) settings.reload()
  }
  async function saveOrg() {
    if (!o) return
    const r = await act(() => api.patchOrg(o), { ok: { title: 'Settings saved' } })
    if (!r) return
    const me = await api.me(); const cur = getSession(); if (cur) setSession({ ...cur, user: me }); setUser(me); org.reload()
  }
  async function addBranch() { if (!newBranch.trim()) return; const r = await act(() => api.addBranch(newBranch.trim()), { ok: { title: 'Branch added' } }); if (r) { setNewBranch(''); branches.reload() } }
  async function addDept() { if (!newDept.trim()) return; const r = await act(() => api.addDepartment(newDept.trim()), { ok: { title: 'Department added' } }); if (r) { setNewDept(''); depts.reload() } }
  async function start2fa() { const r = await act(() => api.twoFaSetup()); if (r) setTfa(r) }
  async function enable2fa() { const r = await act(() => api.twoFaEnable(code), { ok: { title: 'Two-factor authentication enabled' } }); if (r) { setUser(r); setTfa(null); setCode('') } }
  async function disable2fa() { const r = await act(() => api.twoFaDisable(pw, code), { ok: { title: 'Two-factor authentication disabled' } }); if (r) { setUser(r); setCode(''); setPw('') } }

  const toggles: Record<string, { label: string; get: (x: NonNullable<typeof s>) => boolean; set: (v: boolean) => Record<string, unknown> }[]> = {
    academic: [
      { label: 'Auto-archive completed classes', get: (x) => x.autoArchive, set: (v) => ({ autoArchive: v }) },
      { label: 'Public holiday calendar', get: (x) => x.holidays, set: (v) => ({ holidays: v }) },
    ],
    notif: [
      { label: 'Schedule conflict alerts', get: (x) => x.notifications.conflicts, set: (v) => ({ notifications: { conflicts: v } }) },
      { label: 'Leave request notifications (email)', get: (x) => x.notifications.leave, set: (v) => ({ notifications: { leave: v } }) },
      { label: 'Attendance below target', get: (x) => x.notifications.attendance, set: (v) => ({ notifications: { attendance: v } }) },
      { label: 'Weekly digest email', get: (x) => x.notifications.digest, set: (v) => ({ notifications: { digest: v } }) },
    ],
    security: [
      { label: 'Require two-factor for all staff', get: (x) => x.security.twoFactor, set: (v) => ({ security: { twoFactor: v } }) },
      { label: 'Single sign-on (SSO)', get: (x) => x.security.sso, set: (v) => ({ security: { sso: v } }) },
      { label: 'Audit logging', get: (x) => x.security.audit, set: (v) => ({ security: { audit: v } }) },
    ],
  }

  return (
    <>
      <PageHeader title="Settings" subtitle="Configure your organization workspace." />
      <Tabs value={tab} onChange={setTab} tabs={[
        { id: 'org', label: 'Organization' }, { id: 'academic', label: 'Academic year' }, { id: 'structure', label: 'Structure' },
        { id: 'roles', label: 'Roles & permissions' }, { id: 'notif', label: 'Notifications' }, { id: 'security', label: 'Security' },
      ]} />
      <div className="mt-5">
        {tab === 'org' && o && (
          <Card className="max-w-2xl p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Organization name"><Input value={o.name} onChange={(e) => setOrgF({ ...o, name: e.target.value })} /></Field>
              <Field label="Organization type"><Select value={o.type} onChange={(e) => setOrgF({ ...o, type: e.target.value })}>{['School', 'University', 'College', 'Tuition Centre', 'Training Centre', 'Academy'].map((t) => <option key={t}>{t}</option>)}</Select></Field>
              <Field label="Primary contact"><Input value={o.contactEmail} onChange={(e) => setOrgF({ ...o, contactEmail: e.target.value })} /></Field>
              <Field label="Timezone"><Select value={o.timezone} onChange={(e) => setOrgF({ ...o, timezone: e.target.value })}>{['GMT (UTC+0)', 'WAT (UTC+1)', 'EAT (UTC+3)', 'MYT (UTC+8)'].map((t) => <option key={t}>{t}</option>)}</Select></Field>
            </div>
            <div className="mt-5 flex justify-end"><Button variant="primary" onClick={() => void saveOrg()}>Save changes</Button></div>
          </Card>
        )}
        {tab === 'structure' && (
          <Card className="max-w-2xl p-5">
            <h3 className="mb-3 font-display text-[15px] font-semibold text-card-foreground">Organization structure</h3>
            <div className="rounded-lg border border-border bg-surface-2 p-4 font-mono text-[13px] text-foreground">
              <p className="flex items-center gap-2"><Icon.building width={15} height={15} className="text-primary" /> {user.org.name}</p>
              {(branches.data?.items ?? []).map((b: { id: string; name: string; teachers: number; classes: number }, i: number, arr: unknown[]) => (
                <p key={b.id} className="ml-4 mt-1.5 flex items-center gap-2 text-muted-foreground"><span>{i === arr.length - 1 ? '└─' : '├─'}</span> {b.name} <span className="text-muted-foreground/60">· {b.teachers} teachers · {b.classes} classes</span></p>
              ))}
              <p className="ml-4 mt-3 text-[11px] uppercase tracking-widest text-muted-foreground/70">Departments</p>
              {(depts.data?.items ?? []).map((d: { id: string; name: string; teachers: number }) => <p key={d.id} className="ml-8 text-muted-foreground/80">• {d.name} <span className="text-muted-foreground/50">({d.teachers})</span></p>)}
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <div className="flex gap-2"><Input placeholder="New branch" value={newBranch} onChange={(e) => setNewBranch(e.target.value)} /><Button size="sm" icon="plus" variant="outline" onClick={() => void addBranch()}>Add</Button></div>
              <div className="flex gap-2"><Input placeholder="New department" value={newDept} onChange={(e) => setNewDept(e.target.value)} /><Button size="sm" icon="plus" variant="outline" onClick={() => void addDept()}>Add</Button></div>
            </div>
          </Card>
        )}
        {tab === 'roles' && roles.data && (
          <Card className="max-w-3xl overflow-hidden">
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead className="border-b border-border bg-surface-2"><tr>
                <th className="px-4 py-2.5 text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Permission</th>
                {roles.data.roles.map((r: { id: string; label: string }) => <th key={r.id} className="px-3 py-2.5 text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{r.label}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-border">
                {roles.data.rows.map((row: { permission: string; allowed: Record<string, boolean> }) => (
                  <tr key={row.permission}><td className="px-4 py-2.5 font-medium text-foreground">{row.permission}</td>
                    {roles.data!.roles.map((r: { id: string }) => <td key={r.id} className="px-3 py-2.5 text-center">{row.allowed[r.id] ? <Icon.check width={16} height={16} className="mx-auto text-ok" /> : <Icon.x width={14} height={14} className="mx-auto text-muted-foreground/40" />}</td>)}
                  </tr>
                ))}
              </tbody>
            </table></div>
          </Card>
        )}
        {s && (tab === 'academic' || tab === 'notif' || tab === 'security') && (
          <div className="flex max-w-2xl flex-col gap-5">
            <Card className="p-5">
              {tab === 'academic' && (
                <div className="grid gap-4 border-b border-border pb-4 sm:grid-cols-2">
                  <Field label="Academic year"><Input defaultValue={s.academicYear} onBlur={(e) => e.target.value !== s.academicYear && void patchSetting({ academicYear: e.target.value })} /></Field>
                  <Field label="Current term"><Input defaultValue={s.term} onBlur={(e) => e.target.value !== s.term && void patchSetting({ term: e.target.value })} /></Field>
                </div>
              )}
              <div className="flex flex-col divide-y divide-border">
                {toggles[tab].map((t) => (
                  <label key={t.label} className="flex items-center justify-between py-3"><span className="text-sm font-medium text-foreground">{t.label}</span><Toggle on={t.get(s)} onChange={(v) => void patchSetting(t.set(v))} /></label>
                ))}
              </div>
            </Card>
            {tab === 'security' && (
              <Card className="p-5">
                <div className="flex items-center justify-between"><div><h3 className="font-display text-[15px] font-semibold text-card-foreground">Your account: authenticator app (2FA)</h3><p className="text-[13px] text-muted-foreground">Protect {user.email} with a 6-digit code at sign-in.</p></div><Badge tone={user.twoFactor ? 'ok' : 'neutral'} dot>{user.twoFactor ? 'Enabled' : 'Off'}</Badge></div>
                {!user.twoFactor && !tfa && <Button className="mt-4" variant="outline" onClick={() => void start2fa()}>Set up 2FA</Button>}
                {!user.twoFactor && tfa && (
                  <div className="mt-4 flex flex-col gap-3">
                    <p className="text-[13px] text-muted-foreground">Add this key to Google Authenticator, Authy or 1Password, then enter the 6-digit code.</p>
                    <code className="select-all break-all rounded-lg bg-surface-2 p-3 font-mono text-[13px] text-foreground">{tfa.secret}</code>
                    <div className="flex gap-2"><Input placeholder="123456" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} /><Button variant="primary" onClick={() => void enable2fa()}>Enable</Button></div>
                  </div>
                )}
                {user.twoFactor && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                    <Input type="password" placeholder="Password" value={pw} onChange={(e) => setPw(e.target.value)} />
                    <Input placeholder="6-digit code" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} />
                    <Button variant="outline" onClick={() => void disable2fa()}>Disable</Button>
                  </div>
                )}
              </Card>
            )}
          </div>
        )}
      </div>
      
    </>
  )
}

/* ============ BILLING ============ */
const PLAN_COPY: Record<string, { tag: string; feats: string[] }> = {
  starter: { tag: 'For small learning organizations', feats: ['Up to 10 teachers', '25 classes', '1 branch', 'Core operations'] },
  growth: { tag: 'For growing organizations', feats: ['Up to 100 teachers', 'Unlimited classes', '5 branches', 'Analytics & reports', 'Priority support'] },
  enterprise: { tag: 'For large organizations', feats: ['Unlimited teachers', 'Unlimited branches', 'SSO & audit logs', 'Dedicated success manager', 'SLA & onboarding'] },
}
export function Billing() {
  const { act } = useLive()
  const { data: b, reload, error } = useFetch(() => api.billing())
  const money = (cents: number | null) => (cents === null ? 'Custom' : `$${(cents / 100).toFixed(cents % 100 ? 2 : 0)}`)
  async function change(plan: string) {
    const r = await act(() => api.changePlan(plan), { ok: { title: 'Plan updated', desc: `Switched to ${plan}.` } })
    if (r) reload()
  }
  if (error) return <Card className="p-8 text-center text-sm text-muted-foreground">{error}</Card>
  if (!b) return <Card className="p-8 text-center text-sm text-muted-foreground">Loading billing…</Card>
  const u = b.usage as Record<string, { used: number; limit: number | null }>
  return (
    <>
      <PageHeader title="Billing" subtitle="Manage your plan, usage and invoices." />
      <Card className="mb-5 flex flex-wrap items-center gap-5 p-5">
        <div><p className="text-[13px] text-muted-foreground">Current plan</p><p className="font-display text-xl font-bold text-foreground">{b.plan.name}</p></div>
        <div className="h-10 w-px bg-border" />
        {(['teachers', 'classes', 'branches'] as const).map((k) => (
          <div key={k}><p className="text-[13px] capitalize text-muted-foreground">{k}</p><p className="font-semibold text-foreground tnum">{u[k].used} / {u[k].limit ?? '∞'}</p></div>
        ))}
        <div className="ml-auto text-right"><p className="text-[13px] text-muted-foreground">Next invoice</p><p className="font-semibold text-foreground">{b.nextInvoice ? `${money(b.nextInvoice.amountCents)} · ${fmtDay(b.nextInvoice.date)}` : '—'}</p></div>
      </Card>
      <div className="grid gap-4 lg:grid-cols-3">
        {b.plans.map((p: { id: string; name: string; priceCents: number | null }) => {
          const current = p.id === b.plan.id
          return (
            <Card key={p.id} className={cx('flex flex-col p-5', current && 'border-primary ring-1 ring-primary')}>
              <div className="flex items-center justify-between"><h3 className="font-display text-lg font-bold text-foreground">{p.name}</h3>{current && <Badge tone="primary">Current</Badge>}</div>
              <p className="mt-0.5 text-[13px] text-muted-foreground">{PLAN_COPY[p.id]?.tag}</p>
              <p className="mt-4 font-display text-3xl font-bold text-foreground">{money(p.priceCents)}<span className="text-base font-medium text-muted-foreground">{p.priceCents ? '/mo' : ''}</span></p>
              <div className="mt-4 flex flex-1 flex-col gap-2.5">{(PLAN_COPY[p.id]?.feats ?? []).map((f) => <div key={f} className="flex items-center gap-2 text-[13px] text-foreground"><Icon.check width={15} height={15} className="text-ok" /> {f}</div>)}</div>
              <Button variant={current ? 'outline' : 'primary'} block className="mt-5" onClick={() => void change(p.id)} disabled={current}>{current ? 'Your plan' : p.id === 'enterprise' ? 'Contact sales' : p.priceCents === 0 ? 'Downgrade' : 'Upgrade'}</Button>
            </Card>
          )
        })}
      </div>
      <Card className="mt-5 overflow-hidden">
        <div className="border-b border-border px-5 py-3.5"><h2 className="font-display text-[15px] font-semibold text-card-foreground">Billing history</h2></div>
        <div className="divide-y divide-border">
          {b.invoices.length === 0 && <p className="px-5 py-8 text-center text-sm text-muted-foreground">No invoices yet.</p>}
          {b.invoices.map((i: { id: string; amountCents: number; status: string; issuedAt: number }) => (
            <div key={i.id} className="flex items-center gap-4 px-5 py-3"><Icon.file width={16} height={16} className="text-muted-foreground" /><span className="flex-1 text-sm text-foreground">{new Date(i.issuedAt).toDateString().slice(4)}</span><span className="font-mono text-sm text-foreground tnum">{money(i.amountCents)}</span><Badge tone={i.status === 'Paid' ? 'ok' : i.status === 'Due' ? 'warn' : 'danger'}>{i.status}</Badge></div>
          ))}
        </div>
      </Card>
    </>
  )
}
