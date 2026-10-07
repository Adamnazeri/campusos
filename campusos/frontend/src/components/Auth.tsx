import { useState } from 'react'
import { Icon } from '../lib/icons'
import { Button, Field, Input } from '../lib/ui'
import { api, ApiError, type Session_ } from '../lib/api'

type Mode = 'signin' | 'forgot' | 'reset' | 'invite'

/** Baca ?invite=TOKEN / ?reset=TOKEN daripada pautan e-mel. */
function initialLink(): { mode: Mode; token: string } {
  const q = new URLSearchParams(window.location.search)
  if (q.get('invite')) return { mode: 'invite', token: q.get('invite')! }
  if (q.get('reset')) return { mode: 'reset', token: q.get('reset')! }
  return { mode: 'signin', token: '' }
}
const clearLink = () => window.history.replaceState({}, '', window.location.pathname)

export function Auth({ onEnter, onStartOnboarding }: { onEnter: (s: Session_) => void; onStartOnboarding: () => void }) {
  const start = initialLink()
  const [mode, setMode] = useState<Mode>(start.mode)
  const [token] = useState(start.token)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [needCode, setNeedCode] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null); setInfo(null); setBusy(true)
    try {
      if (mode === 'signin') {
        onEnter(await api.login(email.trim(), password, needCode ? code : undefined))
      } else if (mode === 'forgot') {
        const r = await api.forgotPassword(email.trim())
        setInfo(r.message)
      } else if (mode === 'reset') {
        await api.resetPassword(token, password)
        clearLink(); setMode('signin'); setPassword(''); setInfo('Password updated. Sign in with your new password.')
      } else {
        const s = await api.acceptInvite(token, password, name.trim() || undefined)
        clearLink(); onEnter(s)
      }
    } catch (err) {
      if (err instanceof ApiError && err.code === 'TOTP_REQUIRED') { setNeedCode(true); setInfo('Enter the 6-digit code from your authenticator app.') }
      else setError(err instanceof ApiError ? err.message : 'Something went wrong')
    } finally { setBusy(false) }
  }

  const title = { signin: 'Welcome back', forgot: 'Reset your password', reset: 'Choose a new password', invite: 'Accept your invitation' }[mode]
  const sub = { signin: 'Sign in to your organization workspace.', forgot: "Enter your work email and we'll send a reset link.", reset: 'Pick a new password for your account.', invite: 'Set a password to join your organization.' }[mode]
  const cta = { signin: 'Sign in to workspace', forgot: 'Send reset link', reset: 'Update password', invite: 'Create my account' }[mode]

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Left brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[#0a0d14] p-12 text-white lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.5]"
          style={{ background: 'radial-gradient(700px 400px at 20% 10%, rgba(79,70,229,0.35), transparent), radial-gradient(600px 500px at 90% 90%, rgba(2,132,199,0.22), transparent)' }}
        />
        <div className="relative flex items-center gap-2.5">
          <Icon.logo />
          <span className="font-display text-xl font-bold tracking-tight">CampusOS</span>
        </div>
        <div className="relative max-w-lg">
          <p className="mb-3 font-mono text-[12px] uppercase tracking-[0.2em] text-white/50">Operating system for education</p>
          <h1 className="font-display text-[40px] font-bold leading-[1.08] tracking-tight">See and control everything happening across your organization.</h1>
          <p className="mt-5 text-[15px] leading-relaxed text-white/60">
            Teachers, classes, timetables, attendance, workload and reporting — unified into one operational console for management and one focused day-planner for teachers.
          </p>
          <div className="mt-9 grid grid-cols-3 gap-4">
            {[['Live', 'Timetable & conflicts'], ['Daily', 'Attendance tracking'], ['One-click', 'CSV reports']].map(([n, l]) => (
              <div key={l} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur">
                <p className="font-display text-xl font-bold">{n}</p>
                <p className="mt-0.5 text-[12px] text-white/50">{l}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="relative flex items-center gap-6 text-[12px] text-white/40"><span>Schools · universities · training centres</span></div>
      </div>

      {/* Right form */}
      <div className="flex flex-col items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm animate-in">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <Icon.logo />
            <span className="font-display text-xl font-bold tracking-tight text-foreground">CampusOS</span>
          </div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{sub}</p>

          <form className="mt-6 flex flex-col gap-3.5" onSubmit={(e) => void submit(e)}>
            {mode === 'invite' && <Field label="Your name (optional)"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" /></Field>}
            {(mode === 'signin' || mode === 'forgot') && (
              <Field label="Work email"><Input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@school.edu" /></Field>
            )}
            {mode !== 'forgot' && (
              <Field label={mode === 'signin' ? 'Password' : 'New password'} hint={mode === 'signin' ? undefined : 'At least 8 characters'}>
                <Input type="password" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} value={password} onChange={(e) => setPassword(e.target.value)} />
              </Field>
            )}
            {mode === 'signin' && needCode && (
              <Field label="Authenticator code"><Input inputMode="numeric" maxLength={6} autoFocus value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" /></Field>
            )}
            {error && <p role="alert" className="text-[13px] font-medium text-danger">{error}</p>}
            {info && <p className="text-[13px] font-medium text-ok">{info}</p>}
            <Button variant="primary" size="lg" block type="submit" iconRight="chevronRight" disabled={busy}>{busy ? 'Please wait…' : cta}</Button>
          </form>

          {mode === 'signin' && (
            <button onClick={() => { setMode('forgot'); setError(null); setInfo(null) }} className="mt-4 block w-full text-center text-[13px] font-medium text-muted-foreground hover:text-foreground">Forgot your password?</button>
          )}
          {(mode === 'forgot') && (
            <button onClick={() => { setMode('signin'); setError(null); setInfo(null) }} className="mt-4 block w-full text-center text-[13px] font-medium text-muted-foreground hover:text-foreground">Back to sign in</button>
          )}
          {mode === 'signin' && (
            <p className="mt-6 text-center text-[13px] text-muted-foreground">
              New organization? <button onClick={onStartOnboarding} className="font-semibold text-primary hover:underline">Start onboarding</button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
