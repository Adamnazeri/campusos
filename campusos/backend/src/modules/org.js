import { HttpError } from '../http.js'
import { newId } from '../security.js'
import { str, int, oneOf, bool, email as vEmail, time, bad } from '../validate.js'
import { PERMS, ROLES, ROLE_LABELS, MATRIX_ROWS, PLANS, can } from '../perms.js'
import { created, DAYS, isoDate } from '../lib.js'
import { usage, checkLimit, createInvite } from '../services.js'
import { ORG_TYPES, INVITE_ROLES } from './auth.js'

const SETTINGS_SCHEMA = {
  academicYear: 'str', term: 'str', autoArchive: 'bool', holidays: 'bool',
  operatingDays: 'days', dayStart: 'time', dayEnd: 'time', attendanceTarget: 'pct',
  leaveAllowance: { Annual: 'allow', Medical: 'allow', Casual: 'allow' },
  notifications: { conflicts: 'bool', leave: 'bool', attendance: 'bool', digest: 'bool' },
  security: { twoFactor: 'bool', sso: 'bool', sessionTimeoutMin: 'timeout', audit: 'bool' },
}

function applySettings(cur, patch, schema, path = 'settings') {
  if (typeof patch !== 'object' || patch === null || Array.isArray(patch)) throw bad(path, 'mesti object')
  const out = { ...cur }
  for (const [k, v] of Object.entries(patch)) {
    const rule = schema[k]
    const f = `${path}.${k}`
    if (rule === undefined) throw bad(f, 'tetapan tidak dikenali')
    if (typeof rule === 'object') { out[k] = applySettings(cur[k] ?? {}, v, rule, f); continue }
    if (rule === 'str') out[k] = str(v, f, { required: true, max: 60 })
    else if (rule === 'bool') { if (typeof v !== 'boolean') throw bad(f, 'mesti boolean'); out[k] = v }
    else if (rule === 'time') out[k] = time(v, f, { required: true })
    else if (rule === 'pct') out[k] = int(v, f, { min: 50, max: 100, required: true })
    else if (rule === 'allow') out[k] = int(v, f, { min: 0, max: 365, required: true })
    else if (rule === 'timeout') out[k] = int(v, f, { min: 5, max: 1440, required: true })
    else if (rule === 'days') {
      if (!Array.isArray(v) || !v.length) throw bad(f, 'mesti array tidak kosong')
      out[k] = DAYS.filter((d) => v.map((x) => oneOf(x, f, DAYS, { required: true })).includes(d))
    }
  }
  return out
}

export function orgRoutes(ctx) {
  const { q, tx, must, log, settingsOf } = ctx

  const orgView = (o) => ({ id: o.id, name: o.name, type: o.type, contactEmail: o.contact_email, timezone: o.timezone, plan: o.plan, createdAt: o.created_at })

  const getOrg = ({ org }) => orgView(org)
  const patchOrg = async ({ org, user, body }) => {
    const b = await body()
    const name = b.name !== undefined ? str(b.name, 'name', { required: true, max: 120 }) : org.name
    const type = b.type !== undefined ? oneOf(b.type, 'type', ORG_TYPES, { required: true }) : org.type
    const contact = b.contactEmail !== undefined ? vEmail(b.contactEmail, 'contactEmail', false) : org.contact_email
    const tz = b.timezone !== undefined ? str(b.timezone, 'timezone', { required: true, max: 40 }) : org.timezone
    q('UPDATE organizations SET name=?, type=?, contact_email=?, timezone=? WHERE id=?').run(name, type, contact, tz, org.id)
    log(user, 'Updated organization settings')
    return orgView(q('SELECT * FROM organizations WHERE id=?').get(org.id))
  }

  const getSettings = ({ org }) => settingsOf(org)
  const patchSettings = async ({ org, user, body }) => {
    const next = applySettings(settingsOf(org), await body(), SETTINGS_SCHEMA)
    if (next.dayStart >= next.dayEnd) throw bad('settings.dayEnd', 'mesti selepas dayStart')
    q('UPDATE organizations SET settings=? WHERE id=?').run(JSON.stringify(next), org.id)
    log(user, 'Updated workspace settings')
    return next
  }

  const rolesMatrix = () => ({
    roles: ROLES.map((r) => ({ id: r, label: ROLE_LABELS[r] })),
    rows: MATRIX_ROWS.map(([label, perm]) => ({ permission: label, allowed: Object.fromEntries(ROLES.map((r) => [r, can(r, perm)])) })),
  })

  // ---- cawangan & jabatan -------------------------------------------------
  const listBranches = ({ user }) => ({
    items: q(`SELECT b.id, b.name,
      (SELECT COUNT(*) FROM teachers t WHERE t.branch_id=b.id AND t.active=1) teachers,
      (SELECT COUNT(*) FROM classes c WHERE c.branch_id=b.id AND c.status='Active') classes
      FROM branches b WHERE b.org_id=? ORDER BY b.name`).all(user.org_id),
  })
  const addBranch = async ({ user, org, body }) => {
    const name = str((await body()).name, 'name', { required: true, max: 80 })
    checkLimit(ctx, org.id, org.plan, 'branches')
    if (q('SELECT 1 FROM branches WHERE org_id=? AND name=?').get(org.id, name)) throw new HttpError(409, 'ALREADY_EXISTS', 'Nama cawangan sudah wujud')
    const id = newId()
    q('INSERT INTO branches (id,org_id,name) VALUES (?,?,?)').run(id, org.id, name)
    log(user, `Added branch ${name}`)
    return created({ id, name })
  }
  const renameBranch = async ({ user, params, body }) => {
    const b = must(q('SELECT * FROM branches WHERE id=? AND org_id=?').get(params.id, user.org_id), 'Cawangan')
    const name = str((await body()).name, 'name', { required: true, max: 80 })
    try { q('UPDATE branches SET name=? WHERE id=?').run(name, b.id) } catch { throw new HttpError(409, 'ALREADY_EXISTS', 'Nama cawangan sudah wujud') }
    return { id: b.id, name }
  }
  const delBranch = ({ user, params }) => {
    const b = must(q('SELECT * FROM branches WHERE id=? AND org_id=?').get(params.id, user.org_id), 'Cawangan')
    const n = q("SELECT (SELECT COUNT(*) FROM teachers WHERE branch_id=? AND active=1) + (SELECT COUNT(*) FROM classes WHERE branch_id=? AND status='Active') c").get(b.id, b.id).c
    if (n) throw new HttpError(409, 'IN_USE', 'Cawangan masih mempunyai guru atau kelas aktif')
    q('DELETE FROM branches WHERE id=?').run(b.id)
    log(user, `Removed branch ${b.name}`)
  }

  const listDepartments = ({ user }) => ({
    items: q(`SELECT d.id, d.name, d.branch_id branchId, b.name branch,
      (SELECT COUNT(*) FROM teachers t WHERE t.department_id=d.id AND t.active=1) teachers
      FROM departments d LEFT JOIN branches b ON b.id=d.branch_id WHERE d.org_id=? ORDER BY d.name`).all(user.org_id),
  })
  const addDepartment = async ({ user, body }) => {
    const b = await body()
    const name = str(b.name, 'name', { required: true, max: 80 })
    const branchId = ctx.ref('branches', user.org_id, b.branch, 'branch')
    if (q('SELECT 1 FROM departments WHERE org_id=? AND name=?').get(user.org_id, name)) throw new HttpError(409, 'ALREADY_EXISTS', 'Nama jabatan sudah wujud')
    const id = newId()
    q('INSERT INTO departments (id,org_id,name,branch_id) VALUES (?,?,?,?)').run(id, user.org_id, name, branchId)
    log(user, `Added department ${name}`)
    return created({ id, name, branchId })
  }
  const delDepartment = ({ user, params }) => {
    const d = must(q('SELECT * FROM departments WHERE id=? AND org_id=?').get(params.id, user.org_id), 'Jabatan')
    if (q('SELECT COUNT(*) c FROM teachers WHERE department_id=? AND active=1').get(d.id).c) throw new HttpError(409, 'IN_USE', 'Jabatan masih mempunyai guru aktif')
    q('DELETE FROM departments WHERE id=?').run(d.id)
  }

  // ---- pengguna & jemputan -------------------------------------------------
  const assignable = (actorRole) => (actorRole === 'owner' ? INVITE_ROLES.concat('owner') : INVITE_ROLES.filter((r) => r !== 'admin'))
  const listUsers = ({ user }) => ({
    items: q('SELECT id,email,name,role,active,last_login_at lastLoginAt,created_at createdAt FROM users WHERE org_id=? ORDER BY name').all(user.org_id)
      .map((u) => ({ ...u, active: !!u.active, roleLabel: ROLE_LABELS[u.role] })),
  })
  const patchUser = async ({ user, params, body }) => {
    const target = must(q('SELECT * FROM users WHERE id=? AND org_id=?').get(params.id, user.org_id), 'Pengguna')
    const b = await body()
    const role = b.role !== undefined ? oneOf(b.role, 'role', ROLES, { required: true }) : target.role
    const active = b.active !== undefined ? bool(b.active) : target.active
    if (role !== target.role) {
      if (!assignable(user.role).includes(role) || (target.role === 'owner' && user.role !== 'owner') || (target.role === 'admin' && user.role !== 'owner'))
        throw new HttpError(403, 'FORBIDDEN', 'Anda tidak boleh menukar kepada/daripada peranan ini')
    }
    if (target.id === user.id && !active) throw new HttpError(400, 'SELF_DEACTIVATE', 'Anda tidak boleh menyahaktifkan akaun sendiri')
    const owners = q("SELECT COUNT(*) c FROM users WHERE org_id=? AND role='owner' AND active=1 AND id<>?").get(user.org_id, target.id).c
    if (target.role === 'owner' && (role !== 'owner' || !active) && owners === 0) throw new HttpError(409, 'LAST_OWNER', 'Mesti ada sekurang-kurangnya seorang owner aktif')
    q('UPDATE users SET role=?, active=? WHERE id=?').run(role, active, target.id)
    if (!active) q('UPDATE refresh_tokens SET revoked=1 WHERE user_id=?').run(target.id)
    log(user, `Updated account ${target.email}`)
    return q('SELECT id,email,name,role,active FROM users WHERE id=?').get(target.id)
  }
  const inviteUser = async ({ user, org, body }) => {
    const b = await body()
    const email = vEmail(b.email)
    const role = oneOf(b.role ?? 'teacher', 'role', ROLES, { required: true })
    if (!assignable(user.role).includes(role)) throw new HttpError(403, 'FORBIDDEN', 'Anda tidak boleh menjemput dengan peranan ini')
    const teacherId = b.teacherId ? must(q('SELECT id FROM teachers WHERE id=? AND org_id=?').get(b.teacherId, org.id), 'Guru').id : null
    const token = createInvite(ctx, { orgId: org.id, email, role, teacherId, createdBy: user.id })
    log(user, `Invited ${email} as ${ROLE_LABELS[role]}`)
    return created({ email, role, ...(ctx.config.exposeInviteTokens ? { token } : {}) })
  }
  const listInvites = ({ user }) => ({
    items: q('SELECT id,email,role,expires_at expiresAt,created_at createdAt FROM invites WHERE org_id=? AND accepted_at IS NULL AND expires_at>? ORDER BY created_at DESC').all(user.org_id, Date.now()),
  })
  const delInvite = ({ user, params }) => {
    must(q('SELECT id FROM invites WHERE id=? AND org_id=?').get(params.id, user.org_id), 'Jemputan')
    q('DELETE FROM invites WHERE id=?').run(params.id)
  }

  // ---- bil ----------------------------------------------------------------
  const planCard = (id) => ({ id, name: PLANS[id].name, priceCents: PLANS[id].priceCents, limits: PLANS[id].limits })
  const billing = ({ org }) => {
    const u = usage(ctx, org.id)
    const lim = PLANS[org.plan].limits
    const price = PLANS[org.plan].priceCents
    const first = new Date(); first.setUTCDate(1); first.setUTCMonth(first.getUTCMonth() + 1)
    return {
      plan: planCard(org.plan),
      usage: Object.fromEntries(Object.keys(u).map((k) => [k, { used: u[k], limit: lim[k] }])),
      nextInvoice: price ? { amountCents: price, date: isoDate(first.getTime()) } : null,
      plans: Object.keys(PLANS).map(planCard),
      invoices: q('SELECT id,amount_cents amountCents,status,plan,issued_at issuedAt FROM invoices WHERE org_id=? ORDER BY issued_at DESC LIMIT 24').all(org.id),
    }
  }
  const changePlan = async ({ org, user, body }) => {
    const plan = oneOf((await body()).plan, 'plan', Object.keys(PLANS), { required: true })
    if (plan === org.plan) throw new HttpError(400, 'SAME_PLAN', 'Ini sudah pelan semasa anda')
    if (plan === 'enterprise') throw new HttpError(400, 'CONTACT_SALES', 'Pelan Enterprise memerlukan perbincangan dengan pasukan jualan')
    const u = usage(ctx, org.id), lim = PLANS[plan].limits
    const over = Object.keys(u).filter((k) => lim[k] !== null && u[k] > lim[k])
    if (over.length) throw new HttpError(409, 'DOWNGRADE_BLOCKED', `Penggunaan semasa melebihi had pelan ${PLANS[plan].name}: ${over.map((k) => `${k} (${u[k]}/${lim[k]})`).join(', ')}`, { over })
    tx(() => {
      q('UPDATE organizations SET plan=? WHERE id=?').run(plan, org.id)
      // CATATAN: tiada gateway pembayaran — invois dicipta sebagai "Due" sahaja.
      if (PLANS[plan].priceCents) q('INSERT INTO invoices (id,org_id,amount_cents,status,plan,issued_at) VALUES (?,?,?,?,?,?)').run(newId(), org.id, PLANS[plan].priceCents, 'Due', plan, Date.now())
      log(user, `Changed plan to ${PLANS[plan].name}`)
    })
    return billing({ org: q('SELECT * FROM organizations WHERE id=?').get(org.id) })
  }


  // ---- webhook penyedia pembayaran (Stripe/Paddle/Billplz via perantara anda) ---------------
  const billingWebhook = async ({ req, body }) => {
    if (!ctx.config.billingSecret || req.headers.authorization !== `Bearer ${ctx.config.billingSecret}`)
      throw new HttpError(401, 'UNAUTHORIZED', 'Webhook secret salah')
    const b = await body()
    const org = q('SELECT * FROM organizations WHERE id=?').get(String(b.orgId ?? ''))
    if (!org) return { ok: true, ignored: true }
    const event = oneOf(b.event, 'event', ['payment_succeeded', 'payment_failed', 'subscription_cancelled'], { required: true })
    tx(() => {
      if (event === 'payment_succeeded') {
        const inv = b.invoiceId ? q('SELECT * FROM invoices WHERE id=? AND org_id=?').get(b.invoiceId, org.id) : q("SELECT * FROM invoices WHERE org_id=? AND status='Due' ORDER BY issued_at DESC").get(org.id)
        if (inv) q("UPDATE invoices SET status='Paid' WHERE id=?").run(inv.id)
        log({ org_id: org.id, name: 'Billing' }, 'Payment received')
      } else if (event === 'payment_failed') {
        const inv = q("SELECT * FROM invoices WHERE org_id=? AND status IN ('Due','Paid') ORDER BY issued_at DESC").get(org.id)
        if (inv && inv.status === 'Due') q("UPDATE invoices SET status='Failed' WHERE id=?").run(inv.id)
      } else {
        q("UPDATE organizations SET plan='starter' WHERE id=?").run(org.id)
        log({ org_id: org.id, name: 'Billing' }, 'Subscription cancelled — moved to Starter')
      }
    })
    return { ok: true }
  }
  const devOutbox = ({ user }) => {
    if (!ctx.config.devEndpoints) throw new HttpError(404, 'NOT_FOUND', 'Endpoint tidak ditemui')
    return { items: q('SELECT id,to_email "to",subject,body,status,created_at createdAt FROM emails WHERE org_id=? ORDER BY created_at DESC LIMIT 50').all(user.org_id) }
  }

  return [
    ['POST', '/v1/billing/webhook', billingWebhook, { auth: false }],
    ['GET', '/v1/dev/outbox', devOutbox, { perm: 'users:manage' }],
    ['GET', '/v1/org', getOrg],
    ['PATCH', '/v1/org', patchOrg, { perm: 'org:manage' }],
    ['GET', '/v1/org/settings', getSettings],
    ['PATCH', '/v1/org/settings', patchSettings, { perm: 'org:manage' }],
    ['GET', '/v1/org/roles', rolesMatrix, { perm: 'directory:read' }],
    ['GET', '/v1/branches', listBranches],
    ['POST', '/v1/branches', addBranch, { perm: 'org:manage' }],
    ['PATCH', '/v1/branches/:id', renameBranch, { perm: 'org:manage' }],
    ['DELETE', '/v1/branches/:id', delBranch, { perm: 'org:manage' }],
    ['GET', '/v1/departments', listDepartments],
    ['POST', '/v1/departments', addDepartment, { perm: 'org:manage' }],
    ['DELETE', '/v1/departments/:id', delDepartment, { perm: 'org:manage' }],
    ['GET', '/v1/users', listUsers, { perm: 'users:manage' }],
    ['PATCH', '/v1/users/:id', patchUser, { perm: 'users:manage' }],
    ['GET', '/v1/invites', listInvites, { perm: 'users:manage' }],
    ['POST', '/v1/invites', inviteUser, { perm: 'users:manage' }],
    ['DELETE', '/v1/invites/:id', delInvite, { perm: 'users:manage' }],
    ['GET', '/v1/billing', billing, { perm: 'billing:manage' }],
    ['POST', '/v1/billing/plan', changePlan, { perm: 'billing:manage' }],
  ]
}
