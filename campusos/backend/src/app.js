import { HttpError, compileRoutes, matchRoute, readJson, send } from './http.js'
import { verifyJwt } from './security.js'
import { can } from './perms.js'
import { makeCtx } from './lib.js'
import { createMailer } from './mailer.js'
import { authRoutes } from './modules/auth.js'
import { orgRoutes } from './modules/org.js'
import { peopleRoutes } from './modules/people.js'
import { scheduleRoutes } from './modules/schedule.js'
import { workRoutes } from './modules/work.js'
import { insightRoutes } from './modules/insight.js'

export function createApp({ db, config, deps = {} }) {
  const ctx = makeCtx(db, config)
  ctx.mail = createMailer(ctx, deps.fetch)
  const defs = [
    ['GET', '/health', () => ({ status: 'ok', time: Date.now() }), { auth: false }],
    ...authRoutes(ctx), ...orgRoutes(ctx), ...insightRoutes(ctx), ...peopleRoutes(ctx), // insight dahulu: /teachers/workload mesti menang atas /teachers/:id
    ...scheduleRoutes(ctx), ...workRoutes(ctx),
  ]
  const routes = compileRoutes(defs)
  const allowed = config.corsOrigin.split(',').map((s) => s.trim())

  function authenticate(req) {
    const h = req.headers.authorization ?? ''
    const p = h.startsWith('Bearer ') ? verifyJwt(h.slice(7), config.jwtSecret) : null
    const user = p && ctx.q('SELECT * FROM users WHERE id=? AND active=1').get(p.sub)
    if (!user) throw new HttpError(401, 'UNAUTHORIZED', 'Token tidak sah atau telah tamat tempoh')
    return user
  }

  async function handler(req, res) {
    const origin = req.headers.origin
    const cors = {
      'access-control-allow-origin': allowed.includes('*') ? '*' : allowed.includes(origin) ? origin : allowed[0],
      'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      'access-control-allow-headers': 'authorization,content-type',
      'access-control-max-age': '86400',
      vary: 'Origin',
      'x-content-type-options': 'nosniff',
    }
    try {
      if (req.method === 'OPTIONS') return send(res, 204, undefined, cors)
      const url = new URL(req.url, 'http://localhost')
      const { route, params, pathMatched } = matchRoute(routes, req.method, url.pathname)
      if (!route) throw new HttpError(pathMatched ? 405 : 404, pathMatched ? 'METHOD_NOT_ALLOWED' : 'NOT_FOUND', 'Endpoint tidak ditemui')
      const c = {
        req, res, params, query: url.searchParams, ip: req.socket.remoteAddress ?? 'unknown',
        body: () => readJson(req), user: null, org: null,
      }
      if (route.auth) {
        c.user = authenticate(req)
        c.org = ctx.q('SELECT * FROM organizations WHERE id=?').get(c.user.org_id)
        if (route.perm && !can(c.user.role, route.perm))
          throw new HttpError(403, 'FORBIDDEN', 'Anda tidak mempunyai kebenaran untuk tindakan ini', { required: route.perm })
      }
      const out = await route.handler(c)
      setImmediate(() => ctx.mail.flush().catch(() => {}))
      if (out === undefined) return send(res, 204, undefined, cors)
      if (out.__raw) return send(res, out.__raw.status, out.__raw.body, { ...cors, ...out.__raw.headers })
      if (out.__status) return send(res, out.__status, out.data, cors)
      send(res, 200, out, cors)
    } catch (e) {
      if (e instanceof HttpError) return send(res, e.status, { error: { code: e.code, message: e.message, ...e.extra } }, cors)
      console.error(e)
      send(res, 500, { error: { code: 'INTERNAL', message: 'Ralat dalaman pada pelayan' } }, cors)
    }
  }

  return { handler, ctx }
}
