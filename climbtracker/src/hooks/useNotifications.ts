import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Boulder, Competition, Completion } from '../types'
import {
  type AppNotification, type NotificationAudience,
  fetchNotifications, sendNotification, deleteNotification, rowToNotification,
  loadLocal, saveLocal, loadRead, saveRead,
} from '../lib/notifications'

// In-app notifications for the active competition:
//  • announcements written by organizers (table `notifications`, real time)
//  • automatic notices built here from data the app already receives, so
//    they add no load on the database: a judge validated my top, results
//    were locked, the competition started or finished.
// Read state and automatic notices live on the device (localStorage).

interface Options {
  competition?:  Competition
  userId?:       string
  myRole:        string | null      // role in the active competition ('organizer' for the owner)
  completions:   Completion[]       // all completions of the active competition
  boulders:      Boulder[]
}

export function useNotifications({ competition, userId, myRole, completions, boulders }: Options) {
  const compId  = competition?.id
  const isStaff = myRole === 'organizer'

  const scopeKey = compId && userId ? `${userId}:${compId}` : ''
  const [scope,  setScope]  = useState(scopeKey)
  const [remote, setRemote] = useState<AppNotification[]>([])
  const [local,  setLocal]  = useState<AppNotification[]>(() => compId && userId ? loadLocal(userId, compId) : [])
  const [read,   setRead]   = useState<Set<string>>(() => compId && userId ? loadRead(userId, compId) : new Set())
  const [popups, setPopups] = useState<AppNotification[]>([])

  // ── Reset when the competition or user changes ─────────────────────────────
  // Done during render (React's pattern for "reset state when a prop
  // changes") so the old competition's notices never flash on the new one.
  if (scope !== scopeKey) {
    setScope(scopeKey)
    setRemote([])
    setPopups([])
    setLocal(compId && userId ? loadLocal(userId, compId) : [])
    setRead(compId && userId ? loadRead(userId, compId) : new Set())
  }

  const knownIds     = useRef<Set<string>>(new Set())
  const loadedOnce   = useRef(false)
  useEffect(() => {
    knownIds.current = new Set()
    loadedOnce.current = false
  }, [compId, userId])

  const pushPopup = useCallback((n: AppNotification) => {
    setPopups(prev => prev.some(p => p.id === n.id) ? prev : [...prev, n].slice(-5))
  }, [])

  // Merge a fresh list of announcements. New ones (not the first load) pop up,
  // except the ones the user wrote.
  const applyRemote = useCallback((list: AppNotification[]) => {
    const first = !loadedOnce.current
    loadedOnce.current = true
    for (const n of list) {
      if (!knownIds.current.has(n.id)) {
        knownIds.current.add(n.id)
        if (!first && n.createdBy !== userId) pushPopup(n)
      }
    }
    setRemote(list)
  }, [pushPopup, userId])

  // ── Announcements: load + real time ────────────────────────────────────────
  useEffect(() => {
    if (!compId || !userId) return
    let cancelled = false
    let hasJoinedOnce = false

    const reload = () => {
      fetchNotifications(compId)
        .then(list => { if (!cancelled) applyRemote(list) })
        .catch(err => console.error('[notifications] fetch:', err))
    }
    reload()

    const channel = supabase
      .channel(`notif:${compId}:${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `competition_id=eq.${compId}` }, payload => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const n = rowToNotification(payload.new as any)
        setRemote(prev => prev.some(p => p.id === n.id) ? prev : [n, ...prev])
        if (!knownIds.current.has(n.id)) {
          knownIds.current.add(n.id)
          if (n.createdBy !== userId) pushPopup(n)
        }
      })
      // An organizer deleted an announcement: it arrives as an UPDATE that sets
      // deleted_at. (DELETE events are not used: they cannot be filtered by
      // competition, so every app would receive them.)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `competition_id=eq.${compId}` }, payload => {
        const row = payload.new as { id?: string; deleted_at?: string | null }
        if (!row.id || !row.deleted_at) return
        setRemote(prev => prev.filter(p => p.id !== row.id))
        setPopups(prev => prev.filter(p => p.id !== row.id))
      })
      .subscribe(status => {
        // A re-join means events may have been missed while offline.
        if (status === 'SUBSCRIBED') {
          if (hasJoinedOnce) reload()
          hasJoinedOnce = true
        }
      })

    let hiddenAt = 0
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') { hiddenAt = Date.now(); return }
      if (hiddenAt && Date.now() - hiddenAt > 15_000) reload()
      hiddenAt = 0
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('online', reload)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('online', reload)
      supabase.removeChannel(channel)
    }
  }, [compId, userId, applyRemote, pushPopup])

  // ── Automatic notices ──────────────────────────────────────────────────────
  const addLocal = useCallback((n: AppNotification) => {
    if (!compId || !userId) return
    setLocal(prev => {
      if (prev.some(p => p.id === n.id)) return prev
      const next = [n, ...prev]
      saveLocal(userId, compId, next)
      return next
    })
    pushPopup(n)
  }, [compId, userId, pushPopup])

  // A judge (or organizer) validated one of my tops. Only validations made
  // after this screen started watching count, so opening the app does not
  // replay old ones. The id makes it idempotent across reloads.
  const watchStart = useRef(0)   // set by the effect below (runs before the one that reads it)
  useEffect(() => { watchStart.current = Date.now() }, [compId, userId])
  const prevValidated = useRef<Set<string> | null>(null)
  useEffect(() => { prevValidated.current = null }, [compId, userId])

  useEffect(() => {
    if (!compId || !userId) return
    const mine = completions.filter(c => c.competitorId === userId && c.topValidated)
    const now  = new Set(mine.map(c => c.boulderId))
    const prev = prevValidated.current
    prevValidated.current = now
    if (!prev) return
    for (const c of mine) {
      if (prev.has(c.boulderId)) continue
      if (!c.topValidatedBy || c.topValidatedBy === userId) continue
      if ((c.topValidatedAt ?? 0) < watchStart.current - 60_000) continue
      const boulder = boulders.find(b => b.id === c.boulderId)
      // Reacting to data pushed in real time is what this effect is for.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      addLocal({
        id:        `top:${c.boulderId}:${c.topValidatedAt ?? 0}`,
        kind:      'top_validated',
        title:     '',
        body:      '',
        createdAt: Date.now(),
        params:    { number: boulder?.number ?? '?' },
      })
    }
  }, [completions, boulders, compId, userId, addLocal])

  // Competition state changes. Organizers make them, so they are not told.
  const prevComp = useRef<{ id: string; isLocked: boolean; status: string } | null>(null)
  useEffect(() => {
    if (!competition || !userId) { prevComp.current = null; return }
    const cur  = { id: competition.id, isLocked: !!competition.isLocked, status: competition.status }
    const prev = prevComp.current
    prevComp.current = cur
    if (!prev || prev.id !== cur.id || isStaff) return
    const stamp = Date.now()
    if (!prev.isLocked && cur.isLocked) {
      // Reacting to data pushed in real time is what this effect is for.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      addLocal({ id: `locked:${stamp}`, kind: 'results_locked', title: '', body: '', createdAt: stamp })
    }
    if (prev.status !== cur.status && cur.status === 'LIVE') {
      addLocal({ id: `live:${stamp}`, kind: 'status_live', title: '', body: '', createdAt: stamp })
    }
    if (prev.status !== cur.status && cur.status === 'FINISHED') {
      addLocal({ id: `finished:${stamp}`, kind: 'status_finished', title: '', body: '', createdAt: stamp })
    }
  }, [competition, userId, isStaff, addLocal])

  // ── Derived state + actions ────────────────────────────────────────────────
  const items = useMemo(
    () => [...remote, ...local].sort((a, b) => b.createdAt - a.createdAt),
    [remote, local],
  )
  const unreadCount = useMemo(
    () => items.filter(n => !read.has(n.id) && n.createdBy !== userId).length,
    [items, read, userId],
  )

  const markRead = useCallback((ids: string[]) => {
    if (!compId || !userId || ids.length === 0) return
    setRead(prev => {
      const next = new Set(prev)
      ids.forEach(id => next.add(id))
      saveRead(userId, compId, next)
      return next
    })
  }, [compId, userId])

  const markAllRead = useCallback(() => markRead(items.map(n => n.id)), [items, markRead])

  const dismissPopup = useCallback((id: string) => {
    setPopups(prev => prev.filter(p => p.id !== id))
    markRead([id])
  }, [markRead])

  const send = useCallback(async (title: string, body: string, audience: NotificationAudience) => {
    if (!compId) throw new Error('no competition')
    const n = await sendNotification(compId, title, body, audience)
    knownIds.current.add(n.id)
    setRemote(prev => prev.some(p => p.id === n.id) ? prev : [n, ...prev])
    return n
  }, [compId])

  const remove = useCallback(async (id: string) => {
    await deleteNotification(id)
    setRemote(prev => prev.filter(p => p.id !== id))
  }, [])

  return { items, unreadCount, read, popups, markAllRead, dismissPopup, send, remove, isStaff }
}

export type NotificationsState = ReturnType<typeof useNotifications>
