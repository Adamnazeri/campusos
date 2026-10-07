import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
} from 'react'
import { Icon } from './icons'

/* ---------------- className helper ---------------- */
export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}

/* ---------------- Toasts ---------------- */
type Toast = { id: number; title: string; desc?: string; tone?: 'default' | 'ok' | 'warn' | 'danger'; action?: { label: string; onClick: () => void } }
const ToastCtx = createContext<{ push: (t: Omit<Toast, 'id'>) => void }>({ push: () => {} })
export const useToast = () => useContext(ToastCtx)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([])
  function push(t: Omit<Toast, 'id'>) {
    const id = Date.now() + Math.random()
    setItems((s) => [...s, { ...t, id }])
    setTimeout(() => setItems((s) => s.filter((x) => x.id !== id)), 4200)
  }
  const toneBar: Record<string, string> = {
    default: 'bg-primary',
    ok: 'bg-ok',
    warn: 'bg-warn',
    danger: 'bg-danger',
  }
  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[120] flex flex-col gap-2.5 w-[340px] max-w-[calc(100vw-2rem)]">
        {items.map((t) => (
          <div key={t.id} className="sheet-up relative overflow-hidden rounded-xl border border-border bg-card shadow-xl shadow-black/10">
            <div className={cx('absolute left-0 top-0 h-full w-1', toneBar[t.tone ?? 'default'])} />
            <div className="flex items-start gap-3 p-3.5 pl-5">
              <div className="flex-1">
                <p className="text-sm font-semibold text-card-foreground">{t.title}</p>
                {t.desc && <p className="mt-0.5 text-[13px] text-muted-foreground">{t.desc}</p>}
              </div>
              {t.action && (
                <button
                  onClick={() => { t.action!.onClick(); setItems((s) => s.filter((x) => x.id !== t.id)) }}
                  className="shrink-0 rounded-lg px-2.5 py-1 text-[13px] font-semibold text-primary hover:bg-primary-soft"
                >
                  {t.action.label}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

/* ---------------- Button ---------------- */
type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  icon?: keyof typeof Icon
  iconRight?: keyof typeof Icon
  block?: boolean
}
export function Button({ variant = 'secondary', size = 'md', icon, iconRight, block, className, children, ...rest }: BtnProps) {
  const variants: Record<string, string> = {
    primary: 'bg-primary text-primary-foreground hover:brightness-110 shadow-sm shadow-primary/25',
    secondary: 'bg-muted text-foreground hover:bg-border/70 border border-border',
    outline: 'border border-border-strong text-foreground hover:bg-muted',
    ghost: 'text-muted-foreground hover:bg-muted hover:text-foreground',
    danger: 'bg-danger text-white hover:brightness-110',
  }
  const sizes: Record<string, string> = {
    sm: 'h-8 px-2.5 text-[13px] gap-1.5',
    md: 'h-9.5 px-3.5 text-sm gap-2',
    lg: 'h-11 px-5 text-[15px] gap-2',
  }
  const IconL = icon ? Icon[icon] : null
  const IconR = iconRight ? Icon[iconRight] : null
  const s = size === 'sm' ? 15 : 17
  return (
    <button
      className={cx(
        'inline-flex items-center justify-center rounded-lg font-semibold transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]',
        variants[variant], sizes[size], block && 'w-full', className,
      )}
      {...rest}
    >
      {IconL && <IconL width={s} height={s} />}
      {children}
      {IconR && <IconR width={s} height={s} />}
    </button>
  )
}

/* ---------------- Card ---------------- */
export function Card({ className, children, ...rest }: { className?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx('rounded-xl border border-border bg-card', className)} {...rest}>
      {children}
    </div>
  )
}

/* ---------------- Badge ---------------- */
export function Badge({ tone = 'neutral', dot, children, className }: { tone?: 'neutral' | 'ok' | 'warn' | 'danger' | 'info' | 'primary'; dot?: boolean; children: ReactNode; className?: string }) {
  const tones: Record<string, string> = {
    neutral: 'bg-muted text-muted-foreground',
    ok: 'bg-ok-soft text-ok',
    warn: 'bg-warn-soft text-warn',
    danger: 'bg-danger-soft text-danger',
    info: 'bg-info-soft text-info',
    primary: 'bg-primary-soft text-primary',
  }
  const dotColor: Record<string, string> = {
    neutral: 'bg-muted-foreground', ok: 'bg-ok', warn: 'bg-warn', danger: 'bg-danger', info: 'bg-info', primary: 'bg-primary',
  }
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-semibold whitespace-nowrap', tones[tone], className)}>
      {dot && <span className={cx('h-1.5 w-1.5 rounded-full', dotColor[tone])} />}
      {children}
    </span>
  )
}

/* ---------------- Avatar ---------------- */
const AVATAR_COLORS = ['#4f46e5', '#0284c7', '#0891b2', '#7c3aed', '#c026d3', '#db2777', '#ea580c', '#16a34a']
export function Avatar({ name, size = 36, src }: { name: string; size?: number; src?: string }) {
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  const color = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
  if (src) return <img src={src} alt={name} width={size} height={size} className="rounded-full object-cover bg-muted" style={{ width: size, height: size }} />
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-semibold text-white font-display"
      style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  )
}

/* ---------------- Input / Field ---------------- */
export function Input({ className, icon, ...rest }: InputHTMLAttributes<HTMLInputElement> & { icon?: keyof typeof Icon }) {
  const IconL = icon ? Icon[icon] : null
  return (
    <div className="relative">
      {IconL && <IconL width={16} height={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />}
      <input
        className={cx(
          'h-9.5 w-full rounded-lg border border-border bg-surface-2 px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20',
          IconL && 'pl-9', className,
        )}
        {...rest}
      />
    </div>
  )
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-semibold text-foreground">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[12px] text-muted-foreground">{hint}</span>}
    </label>
  )
}

export function Select({ className, children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={cx('h-9.5 w-full appearance-none rounded-lg border border-border bg-surface-2 pl-3 pr-9 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20', className)}
        {...rest}
      >
        {children}
      </select>
      <Icon.chevronDown width={15} height={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}

/* ---------------- Tabs ---------------- */
export function Tabs({ tabs, value, onChange }: { tabs: { id: string; label: string; count?: number }[]; value: string; onChange: (id: string) => void }) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-border">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cx(
            'relative whitespace-nowrap px-3 py-2.5 text-sm font-semibold transition-colors',
            value === t.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {t.label}
          {t.count != null && <span className="ml-1.5 text-[12px] text-muted-foreground tnum">{t.count}</span>}
          {value === t.id && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />}
        </button>
      ))}
    </div>
  )
}

/* ---------------- Modal ---------------- */
export function Modal({ open, onClose, title, children, footer, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center sm:items-center">
      <div className="overlay-in absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={onClose} />
      <div className={cx('sheet-up relative m-0 sm:m-4 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl border border-border bg-card shadow-2xl', wide ? 'sm:max-w-2xl' : 'sm:max-w-md')}>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="font-display text-lg font-semibold text-card-foreground">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"><Icon.x width={18} height={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 border-t border-border bg-surface-2 px-5 py-3.5">{footer}</div>}
      </div>
    </div>
  )
}

/* ---------------- Progress / meter ---------------- */
export function Meter({ value, tone = 'primary', className }: { value: number; tone?: 'primary' | 'ok' | 'warn' | 'danger'; className?: string }) {
  const colors: Record<string, string> = { primary: 'bg-primary', ok: 'bg-ok', warn: 'bg-warn', danger: 'bg-danger' }
  return (
    <div className={cx('h-1.5 w-full overflow-hidden rounded-full bg-muted', className)}>
      <div className={cx('h-full rounded-full transition-all', colors[tone])} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  )
}

/* ---------------- Empty state ---------------- */
export function Empty({ icon = 'inbox', title, desc, action }: { icon?: keyof typeof Icon; title: string; desc?: string; action?: ReactNode }) {
  const I = Icon[icon]
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground"><I width={22} height={22} /></div>
      <p className="font-display text-[15px] font-semibold text-foreground">{title}</p>
      {desc && <p className="mt-1 max-w-xs text-sm text-muted-foreground">{desc}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

/* ---------------- Section header ---------------- */
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-[22px] font-bold tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
