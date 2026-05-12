import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Resend } from 'resend'
import { guardJsonRequest } from './_auth'

// Strip CR/LF/tab characters that could be used for header injection in
// fields that flow into the subject or other single-line headers.
function stripHeaderChars(s: string): string {
  return s.replace(/[\r\n\t]+/g, ' ').trim().slice(0, 200)
}

// Escape characters that have special meaning in HTML so user-supplied
// values can be safely interpolated into the HTML email body.
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  if (!guardJsonRequest(req, res)) return

  const raw = req.body ?? {}
  const { recaptchaToken } = raw

  // Coerce to strings and sanitise. Header fields lose CR/LF/tab; the message
  // body keeps its newlines but is HTML-escaped before interpolation.
  const name    = typeof raw.name    === 'string' ? stripHeaderChars(raw.name)    : ''
  const company = typeof raw.company === 'string' ? stripHeaderChars(raw.company) : ''
  const phone   = typeof raw.phone   === 'string' ? stripHeaderChars(raw.phone)   : ''
  const email   = typeof raw.email   === 'string' ? stripHeaderChars(raw.email)   : ''
  const message = typeof raw.message === 'string' ? raw.message.slice(0, 5000)    : ''

  // ── Basic validation ────────────────────────────────────────────────────────
  if (!name || !email) {
    return res.status(400).json({ error: 'Missing required fields' })
  }
  // Reject anything that doesn't look like an email — protects replyTo header too.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email' })
  }

  // ── reCAPTCHA v3 verification ───────────────────────────────────────────────
  const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY
  if (recaptchaSecret) {
    try {
      const verifyRes = await fetch(
        `https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecret}&response=${recaptchaToken ?? ''}`,
        { method: 'POST' }
      )
      const data = await verifyRes.json() as { success: boolean; score: number }
      if (!data.success || data.score < 0.5) {
        return res.status(400).json({ error: 'reCAPTCHA check failed' })
      }
    } catch (err) {
      console.error('reCAPTCHA verification error:', err)
      return res.status(500).json({ error: 'Could not verify reCAPTCHA' })
    }
  }

  // ── Send email via Resend ───────────────────────────────────────────────────
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('RESEND_API_KEY is not set')
    return res.status(500).json({ error: 'Email service not configured' })
  }

  try {
    const resend = new Resend(apiKey)
    await resend.emails.send({
      from:    'Ascendr Demo <demo@ascendr.top>',
      to:      'blocopen@gmail.com',
      replyTo: email,
      subject: `Demo Request – ${name}${company ? ` (${company})` : ''}`,
      text: [
        'New demo request via ascendr.top',
        '',
        `Name:    ${name}`,
        `Company: ${company  || '—'}`,
        `Email:   ${email}`,
        `Phone:   ${phone    || '—'}`,
        '',
        'Message:',
        message || '—',
      ].join('\n'),
      html: `
        <div style="font-family:sans-serif;max-width:560px;color:#111">
          <h2 style="margin:0 0 16px">New demo request</h2>
          <table style="border-collapse:collapse;width:100%">
            <tr><td style="padding:6px 12px 6px 0;color:#555;white-space:nowrap">Name</td><td style="padding:6px 0"><strong>${escapeHtml(name)}</strong></td></tr>
            <tr><td style="padding:6px 12px 6px 0;color:#555">Company</td><td style="padding:6px 0">${company ? escapeHtml(company) : '—'}</td></tr>
            <tr><td style="padding:6px 12px 6px 0;color:#555">Email</td><td style="padding:6px 0"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
            <tr><td style="padding:6px 12px 6px 0;color:#555">Phone</td><td style="padding:6px 0">${phone ? escapeHtml(phone) : '—'}</td></tr>
          </table>
          ${message ? `<div style="margin-top:20px;padding:16px;background:#f5f5f5;border-radius:6px;white-space:pre-wrap">${escapeHtml(message)}</div>` : ''}
        </div>
      `,
    })
    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Resend error:', err)
    return res.status(500).json({ error: 'Failed to send email' })
  }
}
