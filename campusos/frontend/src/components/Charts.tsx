import { useId } from 'react'

/* Sparkline / area line chart */
export function LineChart({ data, height = 120, min, max }: { data: { label: string; value: number }[]; height?: number; min?: number; max?: number }) {
  const id = useId()
  const w = 100
  const lo = min ?? Math.min(...data.map((d) => d.value)) - 1
  const hi = max ?? Math.max(...data.map((d) => d.value)) + 1
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w
    const y = height - ((d.value - lo) / (hi - lo)) * height
    return [x, y] as const
  })
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ')
  const area = `${line} L${w},${height} L0,${height} Z`
  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
        <defs>
          <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.24" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#g${id})`} />
        <path d={line} fill="none" stroke="var(--primary)" strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r="1.6" fill="var(--primary)" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <div className="mt-2 flex justify-between text-[11px] font-medium text-muted-foreground">
        {data.map((d) => <span key={d.label}>{d.label}</span>)}
      </div>
    </div>
  )
}

/* Horizontal bar chart */
export function BarChart({ data, unit = '' }: { data: { label: string; value: number }[]; unit?: string }) {
  const max = Math.max(...data.map((d) => d.value))
  return (
    <div className="flex flex-col gap-3">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate text-[13px] font-medium text-muted-foreground">{d.label}</span>
          <div className="h-6 flex-1 overflow-hidden rounded-md bg-muted">
            <div className="flex h-full items-center justify-end rounded-md bg-primary px-2 transition-all" style={{ width: `${Math.max(8, (d.value / max) * 100)}%` }}>
              <span className="text-[11px] font-bold text-primary-foreground tnum">{d.value}{unit}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/* Donut */
export function Donut({ segments, size = 132, label, sub }: { segments: { value: number; color: string }[]; size?: number; label: string; sub?: string }) {
  const total = segments.reduce((a, s) => a + s.value, 0)
  const r = size / 2 - 12
  const c = 2 * Math.PI * r
  let offset = 0
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--muted)" strokeWidth="12" />
        {segments.map((s, i) => {
          const len = (s.value / total) * c
          const el = (
            <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.color} strokeWidth="12" strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset} strokeLinecap="round" />
          )
          offset += len
          return el
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-xl font-bold text-foreground tnum">{label}</span>
        {sub && <span className="text-[11px] text-muted-foreground">{sub}</span>}
      </div>
    </div>
  )
}
