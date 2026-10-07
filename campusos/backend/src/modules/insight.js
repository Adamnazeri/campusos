import { HttpError, toCsv } from '../http.js'
import { oneOf, date, bad, clock } from '../validate.js'
import { csvReply, orgClock, addDays, pct, round1, workloadStatus, dayName } from '../lib.js'

const REPORTS = [
  { id: 'att', title: 'Attendance Report', desc: 'Student & class attendance by period' },
  { id: 'wl', title: 'Teacher Workload Report', desc: 'Hours and class load per teacher' },
  { id: 'cls', title: 'Class Activity Report', desc: 'Assignments, exams and engagement' },
  { id: 'tt', title: 'Timetable Report', desc: 'Full schedule by teacher/room/class' },
  { id: 'room', title: 'Room Utilization Report', desc: 'Capacity and usage per space' },
  { id: 'leave', title: 'Leave Report', desc: 'Requests, approvals and balances' },
  { id: 'asg', title: 'Assignment Report', desc: 'Submission rates and outstanding work' },
  { id: 'exam', title: 'Exam Report', desc: 'Exam schedule and grading progress' },
]
const RANGE_DAYS = { week: 7, month: 30, term: 90 }

export function insightRoutes(ctx) {
  const { q, ref, settingsOf, teacherOf } = ctx

  // ---- beban kerja ------------------------------------------------------
  const scheduledHours = (orgId) => new Map(q('SELECT teacher_id, SUM(duration)/60.0 h FROM sessions WHERE org_id=? AND teacher_id IS NOT NULL GROUP BY teacher_id').all(orgId).map((r) => [r.teacher_id, round1(r.h)]))
  const workload = ({ org }) => {
    const sched = scheduledHours(org.id)
    const items = ctx.svc.teachers(org.id).map((t) => ({ id: t.id, name: t.name, department: t.department, branch: t.branch, hours: t.hours, scheduledHours: sched.get(t.id) ?? 0, classes: t.classes, status: t.status }))
    const mix = { Light: 0, Healthy: 0, Heavy: 0, Overloaded: 0 }
    items.forEach((t) => mix[t.status]++)
    const dept = new Map()
    items.forEach((t) => dept.set(t.department ?? 'Unassigned', (dept.get(t.department ?? 'Unassigned') ?? 0) + t.hours))
    return { items, summary: { total: items.length, avgHours: items.length ? round1(items.reduce((a, t) => a + t.hours, 0) / items.length) : 0, ...mix }, byDepartment: [...dept].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value) }
  }

  // ---- analitik -----------------------------------------------------------
  const rangeFor = (org, query) => {
    const range = oneOf(query.get('range') ?? 'term', 'range', Object.keys(RANGE_DAYS))
    const to = orgClock(org).date
    return { range, to, from: addDays(to, -(RANGE_DAYS[range] - 1)), days: RANGE_DAYS[range] }
  }
  const analytics = ({ org, query }) => {
    const { range, from, to, days } = rangeFor(org, query)
    const cur = ctx.svc.attendanceStats(org, from, to)
    const prevTo = addDays(from, -1), prev = ctx.svc.attendanceStats(org, addDays(prevTo, -(days - 1)), prevTo)
    const rooms = ctx.svc.rooms(org)
    const asg = ctx.svc.assignments(org.id, { from, to }).filter((a) => a.status !== 'Draft')
    const sub = asg.reduce((a, x) => a + x.submitted, 0), tot = asg.reduce((a, x) => a + x.total, 0)
    const wl = workload({ org })
    return {
      range, from, to,
      attendance: { rate: cur.rate, previous: prev.rate, delta: cur.rate !== null && prev.rate !== null ? round1(cur.rate - prev.rate) : null, target: settingsOf(org).attendanceTarget },
      roomUtilization: rooms.length ? Math.round(rooms.reduce((a, r) => a + r.utilization, 0) / rooms.length) : 0,
      assignmentCompletion: pct(sub, tot),
      avgWorkload: wl.summary.avgHours,
      attendanceTrend: cur.trend,
      teacherStatusMix: { Healthy: wl.summary.Healthy, Heavy: wl.summary.Heavy, Overloaded: wl.summary.Overloaded, Light: wl.summary.Light, total: wl.summary.total },
      hoursByDepartment: wl.byDepartment,
    }
  }

  // ---- overview pengurusan --------------------------------------------------
  const overview = ({ user, org }) => {
    const clock0 = orgClock(org)
    const live = ctx.svc.live(org)
    const teachers = ctx.svc.teachers(org.id)
    const onLeave = new Set(q("SELECT teacher_id FROM leave_requests WHERE org_id=? AND status='Approved' AND from_date<=? AND to_date>=?").all(org.id, clock0.date, clock0.date).map((r) => r.teacher_id))
    const week = ctx.svc.attendanceStats(org, addDays(clock0.date, -6), clock0.date)
    const today = ctx.svc.attendanceStats(org, clock0.date, clock0.date)
    const classes = ctx.svc.classes(org)
    const markedToday = new Set(q('SELECT DISTINCT class_id FROM attendance WHERE org_id=? AND date=?').all(org.id, clock0.date).map((r) => r.class_id))
    const scheduled = q("SELECT DISTINCT c.id, c.name FROM sessions s JOIN classes c ON c.id=s.class_id WHERE s.org_id=? AND s.day=? AND c.status='Active'").all(org.id, clock0.day)
    return {
      date: clock0.date, day: clock0.day, user: { name: user.name, role: user.role },
      stats: {
        activeClasses: classes.length, branches: q('SELECT COUNT(*) c FROM branches WHERE org_id=?').get(org.id).c,
        teachers: teachers.length, teachersPresent: teachers.length - teachers.filter((t) => onLeave.has(t.id)).length, teachersOnLeave: onLeave.size,
        todaysClasses: live.totalToday, remainingToday: live.remainingToday,
        attendance: { today: today.rate, week: week.rate, target: settingsOf(org).attendanceTarget },
      },
      live,
      conflicts: ctx.svc.allConflicts(org.id),
      attendancePending: scheduled.filter((c) => !markedToday.has(c.id)),
      workloadAlerts: teachers.filter((t) => t.status === 'Overloaded').map((t) => ({ id: t.id, name: t.name, hours: t.hours })),
      pendingLeave: q("SELECT COUNT(*) c FROM leave_requests WHERE org_id=? AND status='Pending'").get(org.id).c,
      tasksDueSoon: q("SELECT COUNT(*) c FROM tasks WHERE org_id=? AND status<>'Completed' AND due_date<=?").get(org.id, addDays(clock0.date, 2)).c,
      activity: q('SELECT actor, text, at FROM activity WHERE org_id=? ORDER BY at DESC LIMIT 10').all(org.id),
    }
  }
  const activity = ({ org, query }) => {
    const limit = Math.min(Math.max(Number(query.get('limit') ?? 30) || 30, 1), 200)
    return { items: q('SELECT actor, text, at FROM activity WHERE org_id=? ORDER BY at DESC LIMIT ?').all(org.id, limit) }
  }

  // ---- dashboard guru -------------------------------------------------------
  const myDashboard = ({ user, org }) => {
    const t = teacherOf(user)
    const now = orgClock(org)
    if (!t) return { teacher: null, today: { date: now.date, day: now.day, sessions: [] }, tasks: [], unreadAnnouncements: 0, leaveBalances: [], pendingLeave: 0 }
    const cancelled = new Set(q('SELECT session_id FROM session_cancellations WHERE date=?').all(now.date).map((r) => r.session_id))
    const marked = new Set(q('SELECT DISTINCT class_id FROM attendance WHERE org_id=? AND date=?').all(org.id, now.date).map((r) => r.class_id))
    const sessions = ctx.svc.sessions(org.id, { teacherId: t.id, day: now.day }).map((s) => {
      const st = clock.toMin(s.start), en = clock.toMin(s.end)
      const state = cancelled.has(s.id) ? 'cancelled' : en <= now.minutes ? 'done' : st <= now.minutes ? 'in-progress' : 'upcoming'
      return { ...s, state, attendanceMarked: marked.has(s.classId) }
    })
    const next = sessions.find((s) => s.state === 'in-progress') ?? sessions.find((s) => s.state === 'upcoming') ?? null
    return {
      teacher: { id: t.id, name: t.name }, today: { date: now.date, day: now.day, sessions }, nextClass: next,
      classes: ctx.svc.classes(org, { teacherId: t.id }).map((c) => ({ id: c.id, name: c.name, subject: c.subject, students: c.students, attendance: c.attendance })),
      tasks: ctx.svc.tasks(org.id, { assigneeId: t.id }).filter((k) => k.status !== 'Completed').slice(0, 5),
      unreadAnnouncements: ctx.svc.announcementsFor(user).filter((a) => !a.read && a.status === 'Published').length,
      leaveBalances: ctx.svc.leaveBalances(org, t.id),
      pendingLeave: q("SELECT COUNT(*) c FROM leave_requests WHERE teacher_id=? AND status='Pending'").get(t.id).c,
    }
  }

  // ---- laporan ----------------------------------------------------------------
  const REPORT_BUILDERS = {
    att: ({ org, from, to, okClass, flt }) => {
      const s = ctx.svc.attendanceStats(org, from, to, flt)
      return { columns: [['class', 'Class'], ['teacher', 'Teacher'], ['rate', 'Attendance %'], ['absent', 'Absences'], ['late', 'Late']], rows: s.classes.filter(okClass).map((c) => ({ class: c.name, teacher: c.teacher, rate: c.rate, absent: c.absent, late: c.late })), summary: { rate: s.rate, present: s.present, absent: s.absent, late: s.late } }
    },
    wl: ({ org, okTeacher }) => {
      const w = workload({ org })
      return { columns: [['name', 'Teacher'], ['department', 'Department'], ['branch', 'Branch'], ['hours', 'Weekly hours'], ['scheduledHours', 'Scheduled hours'], ['classes', 'Classes'], ['status', 'Status']], rows: w.items.filter(okTeacher) }
    },
    cls: ({ org, from, to, okClass }) => {
      const asg = ctx.svc.assignments(org.id, { from, to }), exams = ctx.svc.exams(org.id, { from, to })
      return { columns: [['class', 'Class'], ['teacher', 'Teacher'], ['students', 'Students'], ['assignments', 'Assignments'], ['submissionRate', 'Submission %'], ['exams', 'Exams']], rows: ctx.svc.classes(org).filter((c) => okClass({ id: c.id })).map((c) => {
        const a = asg.filter((x) => x.classId === c.id && x.status !== 'Draft'), sub = a.reduce((n, x) => n + x.submitted, 0), tot = a.reduce((n, x) => n + x.total, 0)
        return { class: c.name, teacher: c.teacher, students: c.students, assignments: asg.filter((x) => x.classId === c.id).length, submissionRate: pct(sub, tot), exams: exams.filter((e) => e.classId === c.id).length }
      }) }
    },
    tt: ({ org, okClass }) => ({ columns: [['day', 'Day'], ['start', 'Start'], ['end', 'End'], ['className', 'Class'], ['subject', 'Subject'], ['teacher', 'Teacher'], ['room', 'Room']], rows: ctx.svc.sessions(org.id).filter((s) => okClass({ id: s.classId })) }),
    room: ({ org }) => ({ columns: [['name', 'Room'], ['building', 'Building'], ['type', 'Type'], ['capacity', 'Capacity'], ['utilization', 'Utilization %'], ['status', 'Status now']], rows: ctx.svc.rooms(org) }),
    leave: ({ org, from, to, okTeacher }) => ({ columns: [['teacher', 'Teacher'], ['type', 'Type'], ['from', 'From'], ['to', 'To'], ['days', 'Days'], ['status', 'Status'], ['reason', 'Reason']], rows: ctx.svc.leaveList(org.id, { from, to, limit: 5000 }).filter((l) => okTeacher({ id: l.teacherId })) }),
    asg: ({ org, from, to, okClass }) => ({ columns: [['title', 'Assignment'], ['className', 'Class'], ['teacher', 'Teacher'], ['due', 'Due'], ['submitted', 'Submitted'], ['total', 'Total'], ['rate', 'Submission %'], ['status', 'Status']], rows: ctx.svc.assignments(org.id, { from, to }).filter((a) => okClass({ id: a.classId })).map((a) => ({ ...a, rate: pct(a.submitted, a.total) })) }),
    exam: ({ org, from, to, okClass }) => ({ columns: [['title', 'Exam'], ['className', 'Class'], ['subject', 'Subject'], ['date', 'Date'], ['time', 'Time'], ['room', 'Room'], ['invigilator', 'Invigilator'], ['status', 'Status']], rows: ctx.svc.exams(org.id, { from, to }).filter((e) => okClass({ id: e.classId })) }),
  }

  const reportList = () => ({ items: REPORTS })
  const report = ({ org, params, query }) => {
    const meta = REPORTS.find((r) => r.id === params.type)
    if (!meta) throw new HttpError(404, 'NOT_FOUND', 'Jenis laporan tidak dikenali')
    const today = orgClock(org).date
    const from = date(query.get('from') ?? addDays(today, -30), 'from', { required: true })
    const to = date(query.get('to') ?? addDays(today, 30), 'to', { required: true })
    if (from > to) throw bad('from', 'mesti sebelum atau sama dengan to')
    const format = oneOf(query.get('format') ?? 'json', 'format', ['json', 'csv'])
    const branchId = query.get('branch') ? ref('branches', org.id, query.get('branch'), 'branch') : undefined
    const departmentId = query.get('department') ? ref('departments', org.id, query.get('department'), 'department') : undefined
    const tInfo = new Map(q('SELECT id, branch_id, department_id FROM teachers WHERE org_id=?').all(org.id).map((t) => [t.id, t]))
    const cInfo = new Map(q('SELECT id, branch_id, teacher_id FROM classes WHERE org_id=?').all(org.id).map((c) => [c.id, c]))
    const teacherPass = (t) => t && (!branchId || t.branch_id === branchId) && (!departmentId || t.department_id === departmentId)
    const okTeacher = (x) => (!branchId && !departmentId) || teacherPass(tInfo.get(x.id))
    const okClass = (x) => { if (!branchId && !departmentId) return true; const c = cInfo.get(x.id); return !!c && (!branchId || c.branch_id === branchId) && (!departmentId || teacherPass(tInfo.get(c.teacher_id))) }
    const built = REPORT_BUILDERS[meta.id]({ org, from, to, okTeacher, okClass, flt: { branchId, departmentId } })
    const columns = built.columns.map(([key, label]) => ({ key, label }))
    if (format === 'csv') return csvReply(`${meta.id}-report-${from}_${to}`, toCsv(columns, built.rows))
    return { id: meta.id, title: meta.title, from, to, generatedAt: Date.now(), columns, rows: built.rows, summary: built.summary ?? null, total: built.rows.length }
  }

  return [
    ['GET', '/v1/teachers/workload', workload, { perm: 'directory:read' }],
    ['GET', '/v1/analytics', analytics, { perm: 'directory:read' }],
    ['GET', '/v1/overview', overview, { perm: 'directory:read' }],
    ['GET', '/v1/activity', activity, { perm: 'directory:read' }],
    ['GET', '/v1/me/dashboard', myDashboard],
    ['GET', '/v1/reports', reportList, { perm: 'reports:read' }],
    ['GET', '/v1/reports/:type', report, { perm: 'reports:read' }],
  ]
}
