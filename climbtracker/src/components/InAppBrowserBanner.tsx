import { useState } from 'react'
import type { Language } from '../translations'
import { translations } from '../translations'

// Google blocks sign-in inside the embedded browsers of social apps
// (Instagram, Facebook, TikTok, LinkedIn, Snapchat, generic Android WebView):
// "Error 403: disallowed_useragent". People who open the invite link from
// those apps would be stuck, so we tell them to open it in Chrome/Safari.
// WhatsApp and Telegram normally use the system browser or a secure in-app
// tab, which Google accepts, so they are not flagged.
export function isEmbeddedBrowser(ua: string = navigator.userAgent): boolean {
  return /FBAN|FBAV|FB_IAB|Instagram|musical_ly|TikTok|BytedanceWebview|LinkedInApp|Snapchat|; wv\)/i.test(ua)
}

export default function InAppBrowserBanner({ lang }: { lang: Language }) {
  const [copied, setCopied] = useState(false)
  if (typeof navigator === 'undefined' || !isEmbeddedBrowser()) return null
  const t       = translations[lang]
  const url     = window.location.href
  const android = /Android/i.test(navigator.userAgent)
  // Android can be sent straight to Chrome; iOS cannot, so we explain how.
  const chromeIntent = `intent://${url.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end`

  function copy() {
    navigator.clipboard?.writeText(url)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500) })
      .catch(() => prompt(t.inAppCopy, url))
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, background: '#F59E0B', color: '#121212', padding: '12px 16px', fontSize: 14, lineHeight: 1.4, boxShadow: '0 2px 8px rgba(0,0,0,.3)' }}>
      <strong>{t.inAppTitle}</strong>
      <div style={{ marginTop: 4 }}>{android ? t.inAppDescAndroid : t.inAppDescIos}</div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
        {android && (
          <a href={chromeIntent} style={{ background: '#121212', color: '#fff', padding: '8px 12px', borderRadius: 4, textDecoration: 'none', fontWeight: 600 }}>
            {t.inAppOpenChrome}
          </a>
        )}
        <button onClick={copy} style={{ background: '#fff', color: '#121212', padding: '8px 12px', borderRadius: 4, border: 0, fontWeight: 600 }}>
          {copied ? t.inAppCopied : t.inAppCopy}
        </button>
      </div>
    </div>
  )
}
