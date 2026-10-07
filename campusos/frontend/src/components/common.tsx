import type { ReactNode } from 'react'
import { Icon, type IconName } from '../lib/icons'
import { Card, cx } from '../lib/ui'

export function StatCard({ label, value, delta, deltaTone = 'ok', icon, sub }: { label: string; value: string; delta?: string; deltaTone?: 'ok' | 'danger' | 'neutral'; icon: IconName; sub?: string }) {
  const I = Icon[icon]
  const dt = { ok: 'text-ok', danger: 'text-danger', neutral: 'text-muted-foreground' }[deltaTone]
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary"><I width={18} height={18} /></span>
        {delta && (
          <span className={cx('flex items-center gap-0.5 text-[12px] font-semibold', dt)}>
            {deltaTone === 'danger' ? <Icon.arrowDown width={13} height={13} /> : <Icon.arrowUp width={13} height={13} />}
            {delta}
          </span>
        )}
      </div>
      <p className="mt-3 font-display text-[26px] font-bold leading-none tracking-tight text-foreground tnum">{value}</p>
      <p className="mt-1.5 text-[13px] font-medium text-muted-foreground">{label}</p>
      {sub && <p className="mt-0.5 text-[12px] text-muted-foreground/80">{sub}</p>}
    </Card>
  )
}

export function Toolbar({ children }: { children: ReactNode }) {
  return <div className="mb-4 flex flex-wrap items-center gap-2">{children}</div>
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return <th className={cx('whitespace-nowrap px-4 py-2.5 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground', className)}>{children}</th>
}

export function Td({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={cx('whitespace-nowrap px-4 py-3 text-sm text-foreground', className)}>{children}</td>
}

export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">{children}</table>
      </div>
    </Card>
  )
}
