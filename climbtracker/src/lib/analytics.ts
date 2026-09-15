type EventParams = Record<string, unknown>

export function trackEvent(name: string, params: EventParams = {}) {
  const dl = (window as unknown as { dataLayer?: unknown[] }).dataLayer
  if (Array.isArray(dl)) {
    dl.push({ event: name, ...params })
  }
}
