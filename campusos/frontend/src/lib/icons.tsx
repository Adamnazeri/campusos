import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

function base(props: IconProps) {
  return {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    ...props,
  }
}

export const Icon = {
  grid: (p: IconProps) => (
    <svg {...base(p)}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /></svg>
  ),
  users: (p: IconProps) => (
    <svg {...base(p)}><path d="M16 19v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 19v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
  ),
  user: (p: IconProps) => (
    <svg {...base(p)}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
  ),
  book: (p: IconProps) => (
    <svg {...base(p)}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
  ),
  calendar: (p: IconProps) => (
    <svg {...base(p)}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
  ),
  check: (p: IconProps) => (
    <svg {...base(p)}><path d="M20 6 9 17l-5-5" /></svg>
  ),
  checkCircle: (p: IconProps) => (
    <svg {...base(p)}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" /></svg>
  ),
  gauge: (p: IconProps) => (
    <svg {...base(p)}><path d="M12 14 8 10" /><path d="M3.34 19a10 10 0 1 1 17.32 0" /><circle cx="12" cy="14" r="1.5" /></svg>
  ),
  door: (p: IconProps) => (
    <svg {...base(p)}><path d="M13 4h3a2 2 0 0 1 2 2v14M2 20h20M13 4v16M13 4 6 5v15" /><circle cx="10" cy="12" r="0.5" fill="currentColor" /></svg>
  ),
  clipboard: (p: IconProps) => (
    <svg {...base(p)}><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M9 12h6M9 16h4" /></svg>
  ),
  award: (p: IconProps) => (
    <svg {...base(p)}><circle cx="12" cy="8" r="6" /><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" /></svg>
  ),
  plane: (p: IconProps) => (
    <svg {...base(p)}><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" /></svg>
  ),
  megaphone: (p: IconProps) => (
    <svg {...base(p)}><path d="m3 11 18-5v12L3 14v-3z" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" /></svg>
  ),
  check2: (p: IconProps) => (
    <svg {...base(p)}><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
  ),
  chart: (p: IconProps) => (
    <svg {...base(p)}><path d="M3 3v18h18" /><rect x="7" y="12" width="3" height="5" rx="1" /><rect x="12" y="8" width="3" height="9" rx="1" /><rect x="17" y="5" width="3" height="12" rx="1" /></svg>
  ),
  file: (p: IconProps) => (
    <svg {...base(p)}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
  ),
  settings: (p: IconProps) => (
    <svg {...base(p)}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
  ),
  card: (p: IconProps) => (
    <svg {...base(p)}><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg>
  ),
  search: (p: IconProps) => (
    <svg {...base(p)}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
  ),
  bell: (p: IconProps) => (
    <svg {...base(p)}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
  ),
  chevronDown: (p: IconProps) => (
    <svg {...base(p)}><path d="m6 9 6 6 6-6" /></svg>
  ),
  chevronRight: (p: IconProps) => (
    <svg {...base(p)}><path d="m9 18 6-6-6-6" /></svg>
  ),
  chevronLeft: (p: IconProps) => (
    <svg {...base(p)}><path d="m15 18-6-6 6-6" /></svg>
  ),
  plus: (p: IconProps) => (
    <svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>
  ),
  x: (p: IconProps) => (
    <svg {...base(p)}><path d="M18 6 6 18M6 6l12 12" /></svg>
  ),
  sun: (p: IconProps) => (
    <svg {...base(p)}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
  ),
  moon: (p: IconProps) => (
    <svg {...base(p)}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z" /></svg>
  ),
  clock: (p: IconProps) => (
    <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
  ),
  mapPin: (p: IconProps) => (
    <svg {...base(p)}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" /></svg>
  ),
  home: (p: IconProps) => (
    <svg {...base(p)}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M9 22V12h6v10" /></svg>
  ),
  more: (p: IconProps) => (
    <svg {...base(p)}><circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none" /></svg>
  ),
  filter: (p: IconProps) => (
    <svg {...base(p)}><path d="M22 3H2l8 9.46V19l4 2v-8.54z" /></svg>
  ),
  download: (p: IconProps) => (
    <svg {...base(p)}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
  ),
  alert: (p: IconProps) => (
    <svg {...base(p)}><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><path d="M12 9v4M12 17h.01" /></svg>
  ),
  logout: (p: IconProps) => (
    <svg {...base(p)}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
  ),
  building: (p: IconProps) => (
    <svg {...base(p)}><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M9 22v-4h6v4M9 6h.01M15 6h.01M9 10h.01M15 10h.01M9 14h.01M15 14h.01" /></svg>
  ),
  logo: (p: IconProps) => (
    <svg width={28} height={28} viewBox="0 0 32 32" fill="none" {...p}>
      <rect width="32" height="32" rx="8" fill="var(--primary)" />
      <path d="M16 7 25 12v8l-9 5-9-5v-8l9-5z" stroke="var(--primary-foreground)" strokeWidth="1.8" strokeLinejoin="round" fill="none" opacity="0.55" />
      <path d="M16 12.5 20.5 15v3L16 20.5 11.5 18v-3L16 12.5z" fill="var(--primary-foreground)" />
    </svg>
  ),
  dot: (p: IconProps) => (
    <svg {...base(p)} viewBox="0 0 12 12" width={10} height={10}><circle cx="6" cy="6" r="5" fill="currentColor" stroke="none" /></svg>
  ),
  arrowUp: (p: IconProps) => (
    <svg {...base(p)}><path d="M12 19V5M5 12l7-7 7 7" /></svg>
  ),
  arrowDown: (p: IconProps) => (
    <svg {...base(p)}><path d="M12 5v14M19 12l-7 7-7-7" /></svg>
  ),
  command: (p: IconProps) => (
    <svg {...base(p)}><path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" /></svg>
  ),
  inbox: (p: IconProps) => (
    <svg {...base(p)}><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></svg>
  ),
}

export type IconName = keyof typeof Icon
