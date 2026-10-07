import { newId } from './security.js'

/**
 * E-mel dimasukkan ke peti keluar (jadual `emails`) dalam transaksi yang sama dengan tindakan,
 * kemudian dihantar selepas respons (flush). Jika MAIL_WEBHOOK_URL ditetapkan, setiap e-mel di-POST
 * sebagai JSON {from,to,subject,text}; jika tidak, ia hanya direkod/dilog (status "logged").
 */
export function createMailer(ctx, doFetch = globalThis.fetch) {
  const { q, config } = ctx
  let flushing = false

  function send({ orgId = null, to, subject, text }) {
    q('INSERT INTO emails (id,org_id,to_email,subject,body,created_at) VALUES (?,?,?,?,?,?)').run(newId(), orgId, to, subject, text, Date.now())
  }

  async function flush() {
    if (flushing) return
    flushing = true
    try {
      const rows = q("SELECT * FROM emails WHERE status='queued' ORDER BY created_at LIMIT 50").all()
      for (const m of rows) {
        if (!config.mailWebhook) {
          console.log(`[mail] → ${m.to_email}: ${m.subject}`)
          q("UPDATE emails SET status='logged', sent_at=? WHERE id=?").run(Date.now(), m.id)
          continue
        }
        try {
          const r = await doFetch(config.mailWebhook, {
            method: 'POST',
            headers: { 'content-type': 'application/json', ...(config.mailWebhookAuth ? { authorization: config.mailWebhookAuth } : {}) },
            body: JSON.stringify({ from: config.mailFrom, to: m.to_email, subject: m.subject, text: m.body }),
          })
          if (!r.ok) throw new Error(`HTTP ${r.status}`)
          q("UPDATE emails SET status='sent', sent_at=? WHERE id=?").run(Date.now(), m.id)
        } catch (e) {
          q("UPDATE emails SET status='failed', error=? WHERE id=?").run(String(e.message).slice(0, 200), m.id)
        }
      }
    } finally { flushing = false }
  }

  return { send, flush }
}
