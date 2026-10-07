import type {
  Teacher, ClassRow, Room, LeaveReq, Task, Announce, Assignment, Exam, LiveClass, Session, Student,
} from './data'

/** Dalam development, Vite mem-proxy /v1 ke backend (lihat vite.config.ts). */
const BASE: string = import.meta.env.VITE_API_URL ?? ''
const KEY = 'campusos.session'

export type ApiUser = {
  id: string; email: string; name: string
  role: 'owner' | 'admin' | 'academic' | 'coordinator' | 'teacher'
  roleLabel: string; teacherId: string | null; permissions: string[]; twoFactor: boolean
  org: { id: string; name: string; type: string; plan: string; planName: string; timezone: string }
}
export type Session_ = { user: ApiUser; accessToken: string; refreshToken: string }

export class ApiError extends Error {
  status: number
  code: string
  extra: Record<string, unknown>
  constructor(status: number, code: string, message: string, extra: Record<string, unknown> = {}) {
    super(message)
    this.status = status
    this.code = code
    this.extra = extra
  }
}

// ---- sesi ------------------------------------------------------------------
let session: Session_ | null = (() => {
  try { return JSON.parse(localStorage.getItem(KEY) ?? 'null') as Session_ | null } catch { return null }
})()
export const getSession = () => session
export function setSession(s: Session_ | null) {
  session = s
  try { s ? localStorage.setItem(KEY, JSON.stringify(s)) : localStorage.removeItem(KEY) } catch { /* storan diblokir */ }
}
export const isManagement = (u: ApiUser | null) => !!u && u.role !== 'teacher'

// ---- request -----------------------------------------------------------------
let refreshing: Promise<boolean> | null = null
async function refresh(): Promise<boolean> {
  if (!session) return false
  refreshing ??= (async () => {
    try {
      const r = await fetch(`${BASE}/v1/auth/refresh`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refreshToken: session!.refreshToken }),
      })
      if (!r.ok) return false
      setSession((await r.json()) as Session_)
      return true
    } catch { return false } finally { refreshing = null }
  })()
  return refreshing
}

export async function request<T>(method: string, path: string, body?: unknown, retry = true): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
        ...(session ? { authorization: `Bearer ${session.accessToken}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'NETWORK', 'Tidak dapat menghubungi pelayan. Pastikan backend berjalan.')
  }
  if (res.status === 401 && retry && session && (await refresh())) return request<T>(method, path, body, false)
  if (res.status === 401 && session && retry) { setSession(null); window.dispatchEvent(new Event('campusos:signout')) }
  if (res.status === 204) return undefined as T
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const e = data?.error ?? {}
    throw new ApiError(res.status, e.code ?? 'ERROR', e.message ?? `Ralat ${res.status}`, e)
  }
  return data as T
}
const get = <T,>(p: string) => request<T>('GET', p)
const post = <T,>(p: string, b?: unknown) => request<T>('POST', p, b ?? {})
const patch = <T,>(p: string, b: unknown) => request<T>('PATCH', p, b)
const del = <T,>(p: string) => request<T>('DELETE', p)

// ---- pemformatan untuk UI ------------------------------------------------------
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
/** "2026-10-05" → "05 Oct" */
export const fmtDay = (iso?: string | null) => (iso ? `${iso.slice(8, 10)} ${MON[Number(iso.slice(5, 7)) - 1]}` : '—')
export const fmtMonYear = (iso?: string | null) => (iso ? `${MON[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}` : '—')
export const monthOf = (iso: string) => MON[Number(iso.slice(5, 7)) - 1].toUpperCase()
export function ago(ms: number) {
  const m = Math.max(0, Math.round((Date.now() - ms) / 60_000))
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  if (m < 1440) return `${Math.round(m / 60)}h ago`
  return `${Math.round(m / 1440)}d ago`
}
export const hhmm = (ms: number) => new Date(ms).toTimeString().slice(0, 5)

// ---- adapter: bentuk API → jenis dalam data.ts ------------------------------------
type R = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
export const toTeacher = (t: R): Teacher => ({
  id: t.id, name: t.name, email: t.email, department: t.department ?? '—', subjects: t.subjects ?? [], branch: t.branch ?? '—',
  hours: t.hours, classes: t.classes, status: t.status, attendanceRate: t.attendanceRate, role: t.role,
  phone: t.phone ?? '—', joined: fmtMonYear(t.joined),
})
export const toClass = (c: R): ClassRow => ({
  id: c.id, name: c.name, teacher: c.teacher ?? '—', students: c.students, schedule: c.schedule ?? '—', room: c.room ?? '—',
  attendance: c.attendance ?? 0, status: c.status, subject: c.subject ?? '—', branch: c.branch ?? '—',
})
export const toRoom = (r: R): Room => ({ id: r.id, name: r.name, capacity: r.capacity, status: r.status, building: r.building ?? '—', type: r.type, utilization: r.utilization })
export const toLeave = (l: R): LeaveReq => ({ id: l.id, teacher: l.teacher, type: l.type, from: fmtDay(l.from), to: fmtDay(l.to), days: l.days, reason: l.reason ?? '', status: l.status })
export const toTask = (t: R): Task => ({ id: t.id, title: t.title, assignee: t.assignee ?? 'Unassigned', due: fmtDay(t.due), priority: t.priority, status: t.status })
export const toAnnounce = (a: R): Announce => ({ id: a.id, title: a.title, body: a.body, audience: a.audience, author: a.author, time: ago(a.createdAt), tag: a.tag, read: a.read })
export const toAssignment = (a: R): Assignment => ({ id: a.id, title: a.title, className: a.className, teacher: a.teacher ?? '—', subject: a.subject ?? '—', due: fmtDay(a.due), submitted: a.submitted, total: a.total, status: a.status })
export const toExam = (e: R): Exam & { rawDate: string } => ({ id: e.id, title: e.title, className: e.className, subject: e.subject ?? '—', date: fmtDay(e.date), rawDate: e.date, time: e.time, room: e.room ?? '—', invigilator: e.invigilator ?? '—', status: e.status })
export const toLive = (i: R): LiveClass => ({ id: i.id, subject: i.subject ?? '—', room: i.room ?? '—', teacher: i.teacher ?? '—', className: i.className, time: i.time, state: i.state })
export const toSession = (s: R): Session => ({ id: s.id, day: s.day, slot: s.start, subject: s.subject ?? '—', className: s.className, teacher: s.teacher ?? '—', room: s.room ?? '—', span: Math.max(1, Math.round(s.duration / 60)) })
export const toStudent = (s: R): Student => ({ id: s.id, name: s.name, status: s.status ?? null })

// ---- endpoint -------------------------------------------------------------------------
export const api = {
  login: (email: string, password: string, code?: string) => post<Session_>('/v1/auth/login', { email, password, code }),
  signupOrg: (b: unknown) => post<Session_ & { invites: { email: string; role: string; token?: string }[] }>('/v1/auth/signup-org', b),
  acceptInvite: (token: string, password: string, name?: string) => post<Session_>('/v1/auth/accept-invite', { token, password, name }),
  forgotPassword: (email: string) => post<{ message: string }>('/v1/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) => post<{ ok: true }>('/v1/auth/reset-password', { token, password }),
  logout: () => post<void>('/v1/auth/logout', { refreshToken: session?.refreshToken }).catch(() => undefined),
  me: () => get<ApiUser>('/v1/me'),

  overview: () => get<R>('/v1/overview'),
  live: () => get<R>('/v1/timetable/live'),
  timetable: () => get<R>('/v1/timetable'),
  addSession: (b: unknown, force = false) => post<R>(`/v1/timetable/sessions${force ? '?force=1' : ''}`, b),
  cancelSession: (id: string, date?: string, reason?: string) => post<R>(`/v1/timetable/sessions/${id}/cancel`, { date, reason }),
  attendanceOverview: () => get<R>('/v1/attendance/overview'),
  classAttendance: (id: string) => get<R>(`/v1/classes/${id}/attendance`),
  putAttendance: (id: string, b: unknown) => request<R>('PUT', `/v1/classes/${id}/attendance`, b),
  workload: () => get<R>('/v1/teachers/workload'),
  analytics: (range: string) => get<R>(`/v1/analytics?range=${range}`),
  activity: () => get<{ items: R[] }>('/v1/activity?limit=30'),

  teachers: () => get<{ items: R[] }>('/v1/teachers?limit=500'),
  addTeacher: (b: unknown) => post<R>('/v1/teachers', b),
  teacher: (id: string) => get<R>(`/v1/teachers/${id}`),
  classes: () => get<{ items: R[] }>('/v1/classes'),
  addClass: (b: unknown) => post<R>('/v1/classes', b),
  classDetail: (id: string) => get<R>(`/v1/classes/${id}`),
  addStudents: (classId: string, names: string[]) => post<R>('/v1/students', { classId, names }),
  rooms: () => get<{ items: R[] }>('/v1/rooms'),
  addRoom: (b: unknown) => post<R>('/v1/rooms', b),

  assignments: () => get<{ items: R[] }>('/v1/assignments'),
  addAssignment: (b: unknown) => post<R>('/v1/assignments', b),
  exams: () => get<{ items: R[] }>('/v1/exams'),
  addExam: (b: unknown, force = false) => post<R>(`/v1/exams${force ? '?force=1' : ''}`, b),
  leave: () => get<{ items: R[] }>('/v1/leave'),
  leaveBalance: () => get<{ balances: R[] }>('/v1/leave/balance'),
  requestLeave: (b: unknown) => post<R>('/v1/leave', b),
  decideLeave: (id: string, status: 'Approved' | 'Rejected', note?: string) => post<R>(`/v1/leave/${id}/decide`, { status, note }),
  reopenLeave: (id: string) => post<R>(`/v1/leave/${id}/reopen`),
  tasks: () => get<{ items: R[] }>('/v1/tasks'),
  addTask: (b: unknown) => post<R>('/v1/tasks', b),
  advanceTask: (id: string) => post<R>(`/v1/tasks/${id}/advance`),
  announcements: () => get<{ items: R[]; unread: number }>('/v1/announcements'),
  announcementReach: () => get<{ items: { label: string; count: number }[] }>('/v1/announcements/reach'),
  addAnnouncement: (b: unknown) => post<R>('/v1/announcements', b),
  readAnnouncement: (id: string) => post<R>(`/v1/announcements/${id}/read`),
  reports: () => get<{ items: { id: string; title: string; desc: string }[] }>('/v1/reports'),
  reportJson: (id: string, params: Record<string, string> = {}) => get<R>(`/v1/reports/${id}?${new URLSearchParams(params)}`),
  settings: () => get<R>('/v1/org/settings'),
  patchSettings: (b: unknown) => patch<R>('/v1/org/settings', b),
  patchOrg: (b: unknown) => patch<R>('/v1/org', b),
  org: () => get<R>('/v1/org'),
  roles: () => get<R>('/v1/org/roles'),
  addBranch: (name: string) => post<R>('/v1/branches', { name }),
  addDepartment: (name: string, branch?: string) => post<R>('/v1/departments', { name, branch }),
  billing: () => get<R>('/v1/billing'),
  changePlan: (plan: string) => post<R>('/v1/billing/plan', { plan }),
  twoFaSetup: () => post<{ secret: string; otpauthUrl: string }>('/v1/me/2fa/setup'),
  twoFaEnable: (code: string) => post<ApiUser>('/v1/me/2fa/enable', { code }),
  twoFaDisable: (password: string, code: string) => post<ApiUser>('/v1/me/2fa/disable', { password, code }),
  myDashboard: () => get<R>('/v1/me/dashboard'),
  branches: () => get<{ items: R[] }>('/v1/branches'),
  departments: () => get<{ items: R[] }>('/v1/departments'),
}

/** Muat turun laporan CSV (perlu header Authorization, jadi tidak boleh pakai <a href>). */
export async function downloadReport(id: string, params: Record<string, string> = {}) {
  const qs = new URLSearchParams({ ...params, format: 'csv' })
  const res = await fetch(`${BASE}/v1/reports/${id}?${qs}`, { headers: { authorization: `Bearer ${session?.accessToken ?? ''}` } })
  if (!res.ok) throw new ApiError(res.status, 'ERROR', 'Gagal menjana laporan')
  const url = URL.createObjectURL(await res.blob())
  const a = Object.assign(document.createElement('a'), { href: url, download: `${id}-report.csv` })
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
}
