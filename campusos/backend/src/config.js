const prod = process.env.NODE_ENV === 'production'

export const config = {
  port: Number(process.env.PORT ?? 8788),
  jwtSecret: process.env.JWT_SECRET ?? 'dev-only-secret-change-me',
  accessTtlSec: 15 * 60,
  refreshTtlSec: 30 * 24 * 3600,
  inviteTtlMs: 7 * 24 * 3600_000,
  dbPath: process.env.DB_PATH ?? './data/campusos.db',
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  devEndpoints: !prod && process.env.DEV_ENDPOINTS !== '0',
  authRateMax: Number(process.env.AUTH_RATE_MAX ?? 30), // percubaan auth / minit / IP
  appUrl: (process.env.APP_URL ?? 'http://localhost:5174').replace(/\/$/, ''),
  mailFrom: process.env.MAIL_FROM ?? 'CampusOS <no-reply@campusos.local>',
  mailWebhook: process.env.MAIL_WEBHOOK_URL ?? '', // POST JSON {from,to,subject,text} — cocok dengan Resend/Zapier/n8n dsb.
  mailWebhookAuth: process.env.MAIL_WEBHOOK_AUTH ?? '',
  billingSecret: process.env.BILLING_WEBHOOK_SECRET ?? '',
  resetTtlMs: 60 * 60_000,
  exposeInviteTokens: !prod && process.env.EXPOSE_INVITE_TOKENS !== '0',
}

if (prod && config.jwtSecret.startsWith('dev-only')) throw new Error('JWT_SECRET mesti ditetapkan di production')
