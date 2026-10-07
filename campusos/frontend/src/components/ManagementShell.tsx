import { useEffect, useState, type ReactNode } from 'react'
import { Icon, type IconName } from '../lib/icons'
import { Avatar, Badge, Button, cx } from '../lib/ui'
import { useApp } from '../lib/store'
import { useLive } from '../lib/live'

const NAV: { group: string; items: { id: string; label: string; icon: IconName; badge?: string }[] }[] = [
  {
    group: 'Operations',
    items: [
      { id: 'overview', label: 'Overview', icon: 'grid' },
      { id: 'timetable', label: 'Timetable', icon: 'calendar', badge: '1' },
      { id: 'attendance', label: 'Attendance', icon: 'checkCircle' },
      { id: 'workload', label: 'Workload', icon: 'gauge' },
    ],
  },
  {
    group: 'People & Spaces',
    items: [
      { id: 'teachers', label: 'Teachers', icon: 'users' },
      { id: 'classes', label: 'Classes', icon: 'book' },
      { id: 'rooms', label: 'Rooms', icon: 'door' },
    ],
  },
  {
    group: 'Academics',
    items: [
      { id: 'assignments', label: 'Assignments', icon: 'clipboard' },
      { id: 'exams', label: 'Exams', icon: 'award' },
      { id: 'leave', label: 'Leave', icon: 'plane', badge: '3' },
      { id: 'tasks', label: 'Tasks', icon: 'check2' },
      { id: 'announcements', label: 'Announcements', icon: 'megaphone' },
    ],
  },
  {
    group: 'Insight',
    items: [
      { id: 'reports', label: 'Reports', icon: 'file' },
      { id: 'analytics', label: 'Analytics', icon: 'chart' },
    ],
  },
  {
    group: 'Workspace',
    items: [
      { id: 'settings', label: 'Settings', icon: 'settings' },
      { id: 'billing', label: 'Billing', icon: 'card' },
    ],
  },
]

export function ManagementShell({ children }: { children: ReactNode }) {
  const { route, navigate, theme, toggleTheme, logout, cmdOpen, setCmdOpen } = useApp()
  const { user, conflicts, leave } = useLive()
  const pendingLeave = leave.filter((l) => l.status === 'Pending').length
  const badgeOf = (id: string) => (id === 'timetable' && conflicts.length ? String(conflicts.length) : id === 'leave' && pendingLeave ? String(pendingLeave) : undefined)
  const [mobileNav, setMobileNav] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setCmdOpen(true) }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [setCmdOpen])

  const sidebar = (
    <nav className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-4">
        <Icon.logo />
        <span className="font-display text-lg font-bold tracking-tight text-foreground">CampusOS</span>
      </div>

      {/* Org switcher */}
      <div className="px-3 pb-2">
        <button className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-surface-2 px-2.5 py-2 text-left transition-colors hover:border-border-strong">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-[13px] font-bold text-primary-foreground">GA</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-semibold text-foreground">{user.org.name}</span>
            <span className="block truncate text-[11px] text-muted-foreground">Main Campus · 3 branches</span>
          </span>
          <Icon.chevronDown width={15} height={15} className="text-muted-foreground" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2">
        {NAV.map((g) => (
          <div key={g.group} className="mb-4">
            <p className="px-2.5 pb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">{g.group}</p>
            {g.items.map((it) => {
              const I = Icon[it.icon]
              const active = route === it.id
              return (
                <button
                  key={it.id}
                  onClick={() => { navigate(it.id); setMobileNav(false) }}
                  className={cx(
                    'group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
                    active ? 'bg-primary-soft text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <I width={18} height={18} className={active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'} />
                  <span className="flex-1 text-left">{it.label}</span>
                  {badgeOf(it.id) && <Badge tone={active ? 'primary' : 'neutral'}>{badgeOf(it.id)}</Badge>}
                </button>
              )
            })}
          </div>
        ))}
      </div>

    </nav>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border bg-surface lg:block">{sidebar}</aside>

      {/* Mobile drawer */}
      {mobileNav && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="overlay-in absolute inset-0 bg-black/45" onClick={() => setMobileNav(false)} />
          <div className="sheet-up absolute inset-y-0 left-0 w-64 border-r border-border bg-surface">{sidebar}</div>
        </div>
      )}

      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-15 items-center gap-3 border-b border-border bg-surface/85 px-4 py-3 backdrop-blur-lg lg:px-6">
          <button onClick={() => setMobileNav(true)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted lg:hidden"><Icon.grid width={20} height={20} /></button>

          <button
            onClick={() => setCmdOpen(true)}
            className="group flex h-9 max-w-md flex-1 items-center gap-2.5 rounded-lg border border-border bg-surface-2 px-3 text-sm text-muted-foreground transition-colors hover:border-border-strong"
          >
            <Icon.search width={16} height={16} />
            <span className="flex-1 text-left">Search teachers, classes, rooms…</span>
            <kbd className="hidden items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground sm:flex">⌘K</kbd>
          </button>

          <div className="ml-auto flex items-center gap-1">
            <button onClick={toggleTheme} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
              {theme === 'dark' ? <Icon.sun width={18} height={18} /> : <Icon.moon width={18} height={18} />}
            </button>

            <div className="relative">
              <button onClick={() => { setNotifOpen((v) => !v); setProfileOpen(false) }} className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
                <Icon.bell width={18} height={18} />
                {(conflicts.length > 0 || pendingLeave > 0) && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-surface bg-danger" />}
              </button>
              {notifOpen && <NotifPanel onClose={() => setNotifOpen(false)} onGo={(r) => { navigate(r); setNotifOpen(false) }} />}
            </div>

            <div className="relative pl-1">
              <button onClick={() => { setProfileOpen((v) => !v); setNotifOpen(false) }} className="flex items-center gap-2 rounded-lg p-1 hover:bg-muted">
                <Avatar name={user.name} size={30} />
                <Icon.chevronDown width={14} height={14} className="hidden text-muted-foreground sm:block" />
              </button>
              {profileOpen && (
                <div className="sheet-up absolute right-0 top-12 z-40 w-56 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
                  <div className="flex items-center gap-2.5 border-b border-border p-3">
                    <Avatar name={user.name} size={38} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-card-foreground">{user.name}</p>
                      <p className="truncate text-[12px] text-muted-foreground">{user.roleLabel}</p>
                    </div>
                  </div>
                  <div className="p-1.5">
                    <button onClick={() => { navigate('settings'); setProfileOpen(false) }} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground hover:bg-muted"><Icon.settings width={16} height={16} /> Settings</button>
                    <button onClick={() => { navigate('billing'); setProfileOpen(false) }} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground hover:bg-muted"><Icon.card width={16} height={16} /> Billing</button>
                    <button onClick={logout} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-danger hover:bg-danger-soft"><Icon.logout width={16} height={16} /> Sign out</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1400px] px-4 py-6 lg:px-8 lg:py-8">
          <div key={route} className="animate-in">{children}</div>
        </main>
      </div>

      {cmdOpen && <CommandPalette onClose={() => setCmdOpen(false)} />}
    </div>
  )
}

function NotifPanel({ onClose, onGo }: { onClose: () => void; onGo: (r: string) => void }) {
  const { conflicts, leave, overview, announcements } = useLive()
  const pending = leave.filter((l) => l.status === 'Pending').length
  const items: { icon: IconName; tone: string; title: string; desc: string; time: string; route: string }[] = []
  if (conflicts.length) items.push({ icon: 'alert', tone: 'text-danger', title: 'Schedule conflict detected', desc: conflicts[0].message, time: '', route: 'timetable' })
  if (pending) items.push({ icon: 'plane', tone: 'text-info', title: `${pending} pending leave request${pending > 1 ? 's' : ''}`, desc: 'Waiting for your decision.', time: '', route: 'leave' })
  const unmarked = overview?.attendancePending?.length ?? 0
  if (unmarked) items.push({ icon: 'checkCircle', tone: 'text-warn', title: 'Attendance not yet marked', desc: `${unmarked} class${unmarked > 1 ? 'es' : ''} scheduled today still need attendance.`, time: '', route: 'attendance' })
  const over = overview?.workloadAlerts ?? []
  if (over.length) items.push({ icon: 'gauge', tone: 'text-danger', title: 'Overloaded teachers', desc: over.map((t: { name: string; hours: number }) => `${t.name} (${t.hours}h)`).join(', '), time: '', route: 'workload' })
  if (announcements[0]) items.push({ icon: 'megaphone', tone: 'text-primary', title: 'Latest announcement', desc: announcements[0].title, time: announcements[0].time.replace(' ago', ''), route: 'announcements' })
  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <div className="sheet-up absolute right-0 top-12 z-40 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="font-display text-[15px] font-semibold text-card-foreground">Notifications</p>
        </div>
        <div className="max-h-[380px] overflow-y-auto">
          {items.length === 0 && <p className="px-4 py-8 text-center text-[13px] text-muted-foreground">You're all caught up.</p>}
          {items.map((it, i) => {
            const I = Icon[it.icon]
            return (
              <button key={i} onClick={() => onGo(it.route)} className="flex w-full gap-3 border-b border-border px-4 py-3 text-left last:border-0 hover:bg-muted">
                <span className={cx('mt-0.5 shrink-0', it.tone)}><I width={18} height={18} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-semibold text-card-foreground">{it.title}</span>
                  <span className="mt-0.5 block text-[12px] text-muted-foreground">{it.desc}</span>
                </span>
                <span className="shrink-0 text-[11px] text-muted-foreground">{it.time}</span>
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}

function CommandPalette({ onClose }: { onClose: () => void }) {
  const { navigate } = useApp()
  const { teachers, classes, rooms, announcements } = useLive()
  const [q, setQ] = useState('')
  const pages = NAV.flatMap((g) => g.items).map((i) => ({ type: 'Page', label: i.label, route: i.id }))
  const people = teachers.map((t) => ({ type: 'Teacher', label: t.name, route: 'teacher-profile', param: t.id }))
  const cls = classes.map((c) => ({ type: 'Class', label: c.name, route: 'class-detail', param: c.id }))
  const rms = rooms.map((r) => ({ type: 'Room', label: r.name, route: 'rooms' }))
  const ann = announcements.map((a) => ({ type: 'Announcement', label: a.title, route: 'announcements' }))
  const all = [...pages, ...people, ...cls, ...rms, ...ann]
  const results = q ? all.filter((r) => r.label.toLowerCase().includes(q.toLowerCase())).slice(0, 10) : pages.slice(0, 6)

  function go(r: any) { navigate(r.route, r.param); onClose() }

  return (
    <div className="fixed inset-0 z-[130] flex items-start justify-center px-4 pt-[12vh]">
      <div className="overlay-in absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
      <div className="sheet-up relative w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Icon.search width={18} height={18} className="text-muted-foreground" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search everything in CampusOS…" className="h-13 flex-1 bg-transparent py-4 text-[15px] outline-none placeholder:text-muted-foreground" />
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">ESC</kbd>
        </div>
        <div className="max-h-[52vh] overflow-y-auto p-2">
          {!q && <p className="px-2 pb-1 pt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Jump to</p>}
          {results.map((r, i) => (
            <button key={i} onClick={() => go(r)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-muted">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-muted-foreground"><Icon.chevronRight width={15} height={15} /></span>
              <span className="flex-1 text-sm font-medium text-card-foreground">{r.label}</span>
              <Badge>{r.type}</Badge>
            </button>
          ))}
          {results.length === 0 && <div className="px-3 py-8 text-center text-sm text-muted-foreground">No results for “{q}”.</div>}
        </div>
      </div>
    </div>
  )
}
