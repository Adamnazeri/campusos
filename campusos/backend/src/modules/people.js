import { HttpError } from '../http.js'
import { newId } from '../security.js'
import { str, int, oneOf, date, email as vEmail, list, bad, clock } from '../validate.js'
import { can } from '../perms.js'
import { created, workloadStatus, orgClock, addDays, pct, round1, DAYS } from '../lib.js'
import { checkLimit, createInvite, insertTeacher } from '../services.js'

const ROOM_TYPES = ['Classroom', 'Laboratory', 'Computer Lab', 'Auditorium', 'Library', 'Gym', 'Other']

export function peopleRoutes(ctx) {
  const { q, tx, must, log, ref, settingsOf, teacherOf } = ctx

  // ===================== GURU =====================
  const TSQL = `SELECT t.*, d.name department, b.name branch,
    (SELECT COUNT(*) FROM classes c WHERE c.teacher_id=t.id AND c.status='Active') classes_count
    FROM teachers t LEFT JOIN departments d ON d.id=t.department_id LEFT JOIN branches b ON b.id=t.branch_id`
  const toTeacher = (r) => ({
    id: r.id, name: r.name, email: r.email, phone: r.phone, department: r.department, departmentId: r.department_id,
    branch: r.branch, branchId: r.branch_id, subjects: JSON.parse(r.subjects), role: r.title, joined: r.joined_at,
    hours: r.weekly_hours, classes: r.classes_count, status: workloadStatus(r.weekly_hours),
    attendanceRate: r.attendance_rate, hasAccount: !!r.user_id,
  })
  ctx.svc.teachers = (orgId) => q(`${TSQL} WHERE t.org_id=? AND t.active=1 ORDER BY t.name`).all(orgId).map(toTeacher)

  const subjectsOf = (v) => list(v, 'subjects', { max: 20 }).map((s) => str(s, 'subjects[]', { required: true, max: 60 }))

  const listTeachers = ({ user, query }) => {
    let rows = ctx.svc.teachers(user.org_id)
    const term = query.get('q')?.toLowerCase().trim()
    if (term) rows = rows.filter((t) => [t.name, t.email, ...t.subjects].some((s) => s.toLowerCase().includes(term)))
    for (const [param, key] of [['department', 'departmentId'], ['branch', 'branchId']]) {
      const v = query.get(param)
      if (v) { const id = ref(param === 'department' ? 'departments' : 'branches', user.org_id, v, param); rows = rows.filter((t) => t[key] === id) }
    }
    const st = query.get('status')
    if (st) rows = rows.filter((t) => t.status === st)
    const total = rows.length
    const limit = Math.min(Math.max(Number(query.get('limit') ?? 200) || 200, 1), 500), offset = Math.max(Number(query.get('offset') ?? 0) || 0, 0)
    return { items: rows.slice(offset, offset + limit), total, limit, offset }
  }

  const teacherFields = (b, orgId, partial = false) => {
    const has = (k) => b[k] !== undefined
    const f = {}
    if (!partial || has('name')) f.name = str(b.name, 'name', { required: true, max: 80 })
    if (!partial || has('email')) f.email = vEmail(b.email)
    if (has('phone')) f.phone = str(b.phone, 'phone', { max: 30 })
    if (has('department')) f.department_id = ref('departments', orgId, b.department, 'department')
    if (has('branch')) f.branch_id = ref('branches', orgId, b.branch, 'branch')
    if (has('subjects')) f.subjects = subjectsOf(b.subjects)
    if (has('title') || has('role')) f.title = str(b.title ?? b.role, 'title', { required: true, max: 60 })
    if (has('joined')) f.joined_at = date(b.joined, 'joined')
    if (has('weeklyHours')) f.weekly_hours = int(b.weeklyHours, 'weeklyHours', { min: 0, max: 80, required: true })
    if (has('attendanceRate')) { if (typeof b.attendanceRate !== 'number' || b.attendanceRate < 0 || b.attendanceRate > 100) throw bad('attendanceRate', 'mesti 0–100'); f.attendance_rate = b.attendanceRate }
    return f
  }

  const addTeacher = async ({ user, org, body }) => {
    const b = await body()
    const f = teacherFields(b, org.id)
    const wantInvite = b.invite !== false
    const out = tx(() => {
      checkLimit(ctx, org.id, org.plan, 'teachers')
      const id = insertTeacher(ctx, org.id, f)
      const token = wantInvite ? createInvite(ctx, { orgId: org.id, email: f.email, role: 'teacher', teacherId: id, createdBy: user.id }) : null
      log(user, `Added teacher ${f.name}`)
      return { id, token }
    })
    return created({ ...toTeacher(q(`${TSQL} WHERE t.id=?`).get(out.id)), invited: wantInvite, ...(out.token && ctx.config.exposeInviteTokens ? { inviteToken: out.token } : {}) })
  }

  const getTeacher = ({ user, params }) => {
    const t = must(q(`${TSQL} WHERE t.id=? AND t.org_id=?`).get(params.id, user.org_id), 'Guru')
    if (!can(user.role, 'directory:read') && teacherOf(user)?.id !== t.id) throw new HttpError(403, 'FORBIDDEN', 'Anda hanya boleh melihat profil sendiri')
    return {
      ...toTeacher(t),
      classList: q("SELECT id,name,subject FROM classes WHERE teacher_id=? AND status='Active' ORDER BY name").all(t.id),
      schedule: ctx.svc.sessions(user.org_id, { teacherId: t.id }),
      leave: { balances: ctx.svc.leaveBalances(ctx.q('SELECT * FROM organizations WHERE id=?').get(user.org_id), t.id), recent: ctx.svc.leaveList(user.org_id, { teacherId: t.id, limit: 5 }) },
      openTasks: q("SELECT COUNT(*) c FROM tasks WHERE assignee_id=? AND status<>'Completed'").get(t.id).c,
    }
  }

  const patchTeacher = async ({ user, params, body }) => {
    const t = must(q('SELECT * FROM teachers WHERE id=? AND org_id=? AND active=1').get(params.id, user.org_id), 'Guru')
    const f = teacherFields(await body(), user.org_id, true)
    const cols = Object.keys(f)
    if (cols.length) {
      try {
        q(`UPDATE teachers SET ${cols.map((c) => `${c}=?`).join(', ')} WHERE id=?`).run(...cols.map((c) => (c === 'subjects' ? JSON.stringify(f[c]) : f[c])), t.id)
      } catch (e) { if (String(e.message).includes('UNIQUE')) throw new HttpError(409, 'EMAIL_TAKEN', 'E-mel sudah digunakan guru lain'); throw e }
      if (f.name && t.user_id) q('UPDATE users SET name=? WHERE id=?').run(f.name, t.user_id)
      log(user, `Updated teacher ${f.name ?? t.name}`)
    }
    return toTeacher(q(`${TSQL} WHERE t.id=?`).get(t.id))
  }

  const archiveTeacher = ({ user, params }) => {
    const t = must(q('SELECT * FROM teachers WHERE id=? AND org_id=? AND active=1').get(params.id, user.org_id), 'Guru')
    const n = q("SELECT COUNT(*) c FROM classes WHERE teacher_id=? AND status='Active'").get(t.id).c
    if (n) throw new HttpError(409, 'HAS_CLASSES', `Guru ini masih mengajar ${n} kelas aktif. Tukar guru kelas terlebih dahulu.`, { classes: n })
    tx(() => {
      q('UPDATE teachers SET active=0 WHERE id=?').run(t.id)
      if (t.user_id) { q('UPDATE users SET active=0 WHERE id=?').run(t.user_id); q('UPDATE refresh_tokens SET revoked=1 WHERE user_id=?').run(t.user_id) }
      q('DELETE FROM sessions WHERE teacher_id=?').run(t.id)
      log(user, `Archived teacher ${t.name}`)
    })
  }

  // ===================== PELAJAR =====================
  const toStudent = (s) => ({ id: s.id, name: s.name, classId: s.class_id, class: s.class_name })
  const listStudents = ({ user, query }) => {
    const where = ['s.org_id=?', 's.active=1'], args = [user.org_id]
    if (query.get('classId')) { where.push('s.class_id=?'); args.push(query.get('classId')) }
    const term = query.get('q')?.trim()
    if (term) { where.push("s.name LIKE ? ESCAPE '\\'"); args.push(`%${term.replace(/[\\%_]/g, '\\$&')}%`) }
    const limit = Math.min(Math.max(Number(query.get('limit') ?? 200) || 200, 1), 500), offset = Math.max(Number(query.get('offset') ?? 0) || 0, 0)
    const rows = q(`SELECT s.*, c.name class_name FROM students s LEFT JOIN classes c ON c.id=s.class_id WHERE ${where.join(' AND ')} ORDER BY c.name, s.name LIMIT ? OFFSET ?`).all(...args, limit, offset)
    return { items: rows.map(toStudent), limit, offset }
  }
  const addStudents = async ({ user, body }) => {
    const b = await body()
    const classId = b.classId ? must(q('SELECT id FROM classes WHERE id=? AND org_id=?').get(b.classId, user.org_id), 'Kelas').id : null
    const names = (b.names !== undefined ? list(b.names, 'names', { max: 200 }) : [b.name]).map((n) => str(n, 'name', { required: true, max: 80 }))
    if (!names.length) throw bad('names', 'wajib diisi')
    const ids = tx(() => names.map((n) => { const id = newId(); q('INSERT INTO students (id,org_id,class_id,name,created_at) VALUES (?,?,?,?,?)').run(id, user.org_id, classId, n, Date.now()); return id }))
    log(user, `Added ${names.length} student(s)`)
    return created({ items: ids.map((id, i) => ({ id, name: names[i], classId })) })
  }
  const patchStudent = async ({ user, params, body }) => {
    const s = must(q('SELECT * FROM students WHERE id=? AND org_id=? AND active=1').get(params.id, user.org_id), 'Pelajar')
    const b = await body()
    const name = b.name !== undefined ? str(b.name, 'name', { required: true, max: 80 }) : s.name
    const classId = b.classId !== undefined ? (b.classId ? must(q('SELECT id FROM classes WHERE id=? AND org_id=?').get(b.classId, user.org_id), 'Kelas').id : null) : s.class_id
    q('UPDATE students SET name=?, class_id=? WHERE id=?').run(name, classId, s.id)
    return { id: s.id, name, classId }
  }
  const delStudent = ({ user, params }) => {
    must(q('SELECT id FROM students WHERE id=? AND org_id=? AND active=1').get(params.id, user.org_id), 'Pelajar')
    q('UPDATE students SET active=0 WHERE id=?').run(params.id)
  }

  // ===================== KELAS =====================
  const CSQL = `SELECT c.*, t.name teacher, b.name branch, r.name room,
    (SELECT COUNT(*) FROM students s WHERE s.class_id=c.id AND s.active=1) students
    FROM classes c LEFT JOIN teachers t ON t.id=c.teacher_id LEFT JOIN branches b ON b.id=c.branch_id LEFT JOIN rooms r ON r.id=c.room_id`

  function scheduleText(orgId) {
    const rows = q('SELECT class_id, day, start_min FROM sessions WHERE org_id=?').all(orgId)
    const by = new Map()
    for (const r of rows) { const e = by.get(r.class_id) ?? { days: new Set(), min: 1e9 }; e.days.add(r.day); e.min = Math.min(e.min, r.start_min); by.set(r.class_id, e) }
    return (cid) => { const e = by.get(cid); return e ? `${DAYS.filter((d) => e.days.has(d)).join(', ')} · ${clock.fmt(e.min)}` : null }
  }
  function attRates(org, days = 30) {
    const from = addDays(orgClock(org).date, -days)
    const map = new Map()
    for (const r of q("SELECT class_id, COUNT(*) total, SUM(status<>'Absent') att FROM attendance WHERE org_id=? AND date>=? GROUP BY class_id").all(org.id, from)) map.set(r.class_id, pct(r.att, r.total))
    return map
  }
  const toClass = (r, sched, rates) => ({
    id: r.id, name: r.name, subject: r.subject, teacher: r.teacher, teacherId: r.teacher_id, branch: r.branch, branchId: r.branch_id,
    room: r.room, roomId: r.room_id, students: r.students, schedule: sched(r.id), attendance: rates.get(r.id) ?? null, status: r.status,
  })
  ctx.svc.classes = (org, { branchId, teacherId, status = 'Active' } = {}) => {
    const sched = scheduleText(org.id), rates = attRates(org)
    return q(`${CSQL} WHERE c.org_id=? ORDER BY c.name`).all(org.id)
      .filter((c) => (status === 'all' || c.status === status) && (!branchId || c.branch_id === branchId) && (!teacherId || c.teacher_id === teacherId))
      .map((c) => toClass(c, sched, rates))
  }
  /** Pastikan pengguna boleh mengakses kelas ini (guru: kelas sendiri sahaja). */
  ctx.svc.classAccess = (user, classId, { allowAnyMgmt = true } = {}) => {
    const c = must(q('SELECT * FROM classes WHERE id=? AND org_id=?').get(classId, user.org_id), 'Kelas')
    if (!(allowAnyMgmt && can(user.role, 'attendance:any')) && !(can(user.role, 'classes:manage')) && teacherOf(user)?.id !== c.teacher_id)
      throw new HttpError(403, 'FORBIDDEN', 'Anda hanya boleh mengakses kelas yang anda ajar')
    return c
  }

  const listClasses = ({ user, org, query }) => {
    const mine = !can(user.role, 'directory:read') ? teacherOf(user)?.id ?? 'none' : query.get('teacherId') ? ctx.teacherRef(org.id, query.get('teacherId'), 'teacherId') : undefined
    const items = ctx.svc.classes(org, {
      branchId: query.get('branch') ? ref('branches', org.id, query.get('branch'), 'branch') : undefined,
      teacherId: mine, status: query.get('status') ?? 'Active',
    })
    return { items, total: items.length }
  }

  const classInput = (b, orgId, partial = false) => {
    const has = (k) => b[k] !== undefined
    const f = {}
    if (!partial || has('name')) f.name = str(b.name, 'name', { required: true, max: 80 })
    if (has('subject')) f.subject = str(b.subject, 'subject', { max: 80 })
    if (has('teacher')) f.teacher_id = ctx.teacherRef(orgId, b.teacher, 'teacher')
    if (has('branch')) f.branch_id = ref('branches', orgId, b.branch, 'branch')
    if (has('room')) f.room_id = ref('rooms', orgId, b.room, 'room')
    if (has('status')) f.status = oneOf(b.status, 'status', ['Active', 'Archived'], { required: true })
    return f
  }
  const addClass = async ({ user, org, body }) => {
    const f = classInput(await body(), org.id)
    const id = newId()
    tx(() => {
      checkLimit(ctx, org.id, org.plan, 'classes')
      try {
        q('INSERT INTO classes (id,org_id,name,subject,teacher_id,branch_id,room_id,created_at) VALUES (?,?,?,?,?,?,?,?)')
          .run(id, org.id, f.name, f.subject ?? null, f.teacher_id ?? null, f.branch_id ?? null, f.room_id ?? null, Date.now())
      } catch (e) { if (String(e.message).includes('UNIQUE')) throw new HttpError(409, 'ALREADY_EXISTS', 'Nama kelas sudah wujud'); throw e }
      log(user, `Created class ${f.name}`)
    })
    return created(ctx.svc.classes(org).find((c) => c.id === id))
  }
  const getClass = ({ user, org, params }) => {
    const c = ctx.svc.classAccess(user, params.id, { allowAnyMgmt: true })
    const row = ctx.svc.classes(org, { status: 'all' }).find((x) => x.id === c.id)
    const recent = q(`SELECT date, COUNT(*) total, SUM(status='Present') present, SUM(status='Absent') absent, SUM(status='Late') late
      FROM attendance WHERE class_id=? GROUP BY date ORDER BY date DESC LIMIT 7`).all(c.id)
    return {
      ...row,
      roster: q('SELECT id,name FROM students WHERE class_id=? AND active=1 ORDER BY name').all(c.id),
      sessions: ctx.svc.sessions(org.id, { classId: c.id }),
      recentAttendance: recent.map((r) => ({ date: r.date, present: r.present, absent: r.absent, late: r.late, rate: pct(r.present + r.late, r.total) })),
      assignments: q("SELECT id,title,due_date dueDate,status FROM assignments WHERE class_id=? ORDER BY due_date DESC LIMIT 5").all(c.id),
    }
  }
  const patchClass = async ({ user, org, params, body }) => {
    const c = must(q('SELECT * FROM classes WHERE id=? AND org_id=?').get(params.id, org.id), 'Kelas')
    const f = classInput(await body(), org.id, true)
    const cols = Object.keys(f)
    tx(() => {
      if (f.status === 'Active' && c.status === 'Archived') checkLimit(ctx, org.id, org.plan, 'classes')
      if (cols.length) {
        try { q(`UPDATE classes SET ${cols.map((k) => `${k}=?`).join(', ')} WHERE id=?`).run(...cols.map((k) => f[k]), c.id) }
        catch (e) { if (String(e.message).includes('UNIQUE')) throw new HttpError(409, 'ALREADY_EXISTS', 'Nama kelas sudah wujud'); throw e }
      }
      if (f.status === 'Archived') q('DELETE FROM sessions WHERE class_id=?').run(c.id)
      if (cols.length) log(user, `Updated class ${f.name ?? c.name}`)
    })
    return ctx.svc.classes(org, { status: 'all' }).find((x) => x.id === c.id)
  }
  const archiveClass = ({ user, params }) => {
    const c = must(q('SELECT * FROM classes WHERE id=? AND org_id=?').get(params.id, user.org_id), 'Kelas')
    tx(() => { q("UPDATE classes SET status='Archived' WHERE id=?").run(c.id); q('DELETE FROM sessions WHERE class_id=?').run(c.id); log(user, `Archived class ${c.name}`) })
  }

  // ===================== BILIK =====================
  const roomMetrics = (org) => {
    const s = settingsOf(org)
    const avail = s.operatingDays.length * (clock.toMin(s.dayEnd) - clock.toMin(s.dayStart))
    const used = new Map(q('SELECT room_id, SUM(duration) m FROM sessions WHERE org_id=? AND room_id IS NOT NULL GROUP BY room_id').all(org.id).map((r) => [r.room_id, r.m]))
    const now = orgClock(org)
    const cancelled = new Set(q('SELECT session_id FROM session_cancellations WHERE date=?').all(now.date).map((r) => r.session_id))
    const live = new Set(q('SELECT id, room_id FROM sessions WHERE org_id=? AND day=? AND start_min<=? AND start_min+duration>?').all(org.id, now.day, now.minutes, now.minutes).filter((s) => !cancelled.has(s.id)).map((s) => s.room_id))
    return (r) => ({
      id: r.id, name: r.name, capacity: r.capacity, building: r.building, type: r.type,
      status: r.status === 'Maintenance' ? 'Maintenance' : live.has(r.id) ? 'Occupied' : 'Available',
      utilization: avail > 0 ? Math.min(100, Math.round(((used.get(r.id) ?? 0) / avail) * 100)) : 0,
    })
  }
  ctx.svc.rooms = (org) => { const m = roomMetrics(org); return q('SELECT * FROM rooms WHERE org_id=? ORDER BY name').all(org.id).map(m) }

  const listRooms = ({ org, query }) => {
    let items = ctx.svc.rooms(org)
    if (query.get('status')) items = items.filter((r) => r.status === query.get('status'))
    if (query.get('type')) items = items.filter((r) => r.type === query.get('type'))
    return { items, total: items.length }
  }
  const roomFields = (b, partial = false) => {
    const has = (k) => b[k] !== undefined
    const f = {}
    if (!partial || has('name')) f.name = str(b.name, 'name', { required: true, max: 80 })
    if (has('capacity')) f.capacity = int(b.capacity, 'capacity', { min: 1, max: 5000, required: true })
    if (has('building')) f.building = str(b.building, 'building', { max: 80 })
    if (has('type')) f.type = oneOf(b.type, 'type', ROOM_TYPES, { required: true })
    if (has('status')) f.status = oneOf(b.status, 'status', ['Available', 'Maintenance'], { required: true })
    return f
  }
  const addRoom = async ({ user, org, body }) => {
    const f = roomFields(await body())
    const id = newId()
    try { q('INSERT INTO rooms (id,org_id,name,capacity,building,type,status) VALUES (?,?,?,?,?,?,?)').run(id, org.id, f.name, f.capacity ?? 30, f.building ?? null, f.type ?? 'Classroom', f.status ?? 'Available') }
    catch (e) { if (String(e.message).includes('UNIQUE')) throw new HttpError(409, 'ALREADY_EXISTS', 'Nama bilik sudah wujud'); throw e }
    log(user, `Added room ${f.name}`)
    return created(ctx.svc.rooms(org).find((r) => r.id === id))
  }
  const patchRoom = async ({ user, org, params, body }) => {
    const r = must(q('SELECT * FROM rooms WHERE id=? AND org_id=?').get(params.id, org.id), 'Bilik')
    const f = roomFields(await body(), true)
    const cols = Object.keys(f)
    if (cols.length) {
      try { q(`UPDATE rooms SET ${cols.map((k) => `${k}=?`).join(', ')} WHERE id=?`).run(...cols.map((k) => f[k]), r.id) }
      catch (e) { if (String(e.message).includes('UNIQUE')) throw new HttpError(409, 'ALREADY_EXISTS', 'Nama bilik sudah wujud'); throw e }
      log(user, `Updated room ${f.name ?? r.name}`)
    }
    return ctx.svc.rooms(org).find((x) => x.id === r.id)
  }
  const delRoom = ({ user, params }) => {
    const r = must(q('SELECT * FROM rooms WHERE id=? AND org_id=?').get(params.id, user.org_id), 'Bilik')
    if (q('SELECT COUNT(*) c FROM sessions WHERE room_id=?').get(r.id).c) throw new HttpError(409, 'IN_USE', 'Bilik masih digunakan dalam jadual waktu')
    q('DELETE FROM rooms WHERE id=?').run(r.id)
    log(user, `Removed room ${r.name}`)
  }

  return [
    ['GET', '/v1/teachers', listTeachers, { perm: 'directory:read' }],
    ['POST', '/v1/teachers', addTeacher, { perm: 'teachers:manage' }],
    ['GET', '/v1/teachers/:id', getTeacher],
    ['PATCH', '/v1/teachers/:id', patchTeacher, { perm: 'teachers:manage' }],
    ['DELETE', '/v1/teachers/:id', archiveTeacher, { perm: 'teachers:manage' }],
    ['GET', '/v1/students', listStudents, { perm: 'directory:read' }],
    ['POST', '/v1/students', addStudents, { perm: 'classes:manage' }],
    ['PATCH', '/v1/students/:id', patchStudent, { perm: 'classes:manage' }],
    ['DELETE', '/v1/students/:id', delStudent, { perm: 'classes:manage' }],
    ['GET', '/v1/classes', listClasses],
    ['POST', '/v1/classes', addClass, { perm: 'classes:manage' }],
    ['GET', '/v1/classes/:id', getClass],
    ['PATCH', '/v1/classes/:id', patchClass, { perm: 'classes:manage' }],
    ['DELETE', '/v1/classes/:id', archiveClass, { perm: 'classes:manage' }],
    ['GET', '/v1/rooms', listRooms],
    ['POST', '/v1/rooms', addRoom, { perm: 'rooms:manage' }],
    ['PATCH', '/v1/rooms/:id', patchRoom, { perm: 'rooms:manage' }],
    ['DELETE', '/v1/rooms/:id', delRoom, { perm: 'rooms:manage' }],
  ]
}
