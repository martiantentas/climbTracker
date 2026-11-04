import { Component, type ErrorInfo, type ReactNode } from 'react'
import { translations, type Language } from '../translations'

// Catches any render error so the app shows a "reload" screen instead of a
// blank page. Also handles the classic SPA problem after a new deploy: an
// open tab asks for a page chunk (lazy import) that no longer exists. In that
// case we reload once automatically to pick up the new version.

const RELOAD_FLAG = 'ct-chunk-reload-at'

function isChunkLoadError(err: unknown): boolean {
  const msg = String((err as { message?: string })?.message ?? err)
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|ChunkLoadError|Loading chunk .* failed/i.test(msg)
}

function currentLang(): Language {
  const fromHash = window.location.hash.match(/^#\/(en|es|ca)(\/|$)/)?.[1]
  return (fromHash as Language) ?? 'es'
}

interface State { error: unknown }

export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: unknown): State {
    return { error }
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error('[app] crashed:', error, info.componentStack)
    if (isChunkLoadError(error)) {
      // Reload at most once per minute to avoid a reload loop.
      const last = Number(sessionStorage.getItem(RELOAD_FLAG) ?? 0)
      if (Date.now() - last > 60_000) {
        sessionStorage.setItem(RELOAD_FLAG, String(Date.now()))
        window.location.reload()
      }
    }
  }

  render() {
    if (!this.state.error) return this.props.children
    const t = translations[currentLang()]
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#121212', color: '#EEEEEE', fontFamily: 'system-ui, sans-serif', padding: 24 }}>
        <div style={{ maxWidth: 360, textAlign: 'center' }}>
          <h1 style={{ fontSize: 20, fontWeight: 500, marginBottom: 8 }}>{t.appCrashedTitle}</h1>
          <p style={{ fontSize: 14, color: '#9A9CA0', marginBottom: 24 }}>{t.appCrashedDesc}</p>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: '12px 24px', background: '#7F8BAD', color: '#fff', border: 0, borderRadius: 4, fontSize: 14, cursor: 'pointer' }}
          >
            {t.appCrashedReload}
          </button>
        </div>
      </div>
    )
  }
}
