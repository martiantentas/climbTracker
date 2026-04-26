import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Resend } from 'resend'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { name, company, phone, email, message, recaptchaToken } = req.body ?? {}

  // ── Basic validation ────────────────────────────────────────────────────────
  if (!name?.trim() || !email?.trim()) {
    return res.status(400).json({ error: 'Missing required fields' })
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
            <tr><td style="padding:6px 12px 6px 0;color:#555;white-space:nowrap">Name</td><td style="padding:6px 0"><strong>${name}</strong></td></tr>
            <tr><td style="padding:6px 12px 6px 0;color:#555">Company</td><td style="padding:6px 0">${company || '—'}</td></tr>
            <tr><td style="padding:6px 12px 6px 0;color:#555">Email</td><td style="padding:6px 0"><a href="mailto:${email}">${email}</a></td></tr>
            <tr><td style="padding:6px 12px 6px 0;color:#555">Phone</td><td style="padding:6px 0">${phone || '—'}</td></tr>
          </table>
          ${message ? `<div style="margin-top:20px;padding:16px;background:#f5f5f5;border-radius:6px;white-space:pre-wrap">${message}</div>` : ''}
        </div>
      `,
    })
    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Resend error:', err)
    return res.status(500).json({ error: 'Failed to send email' })
  }
}
