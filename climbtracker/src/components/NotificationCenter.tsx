import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Bell, X, Megaphone, ShieldCheck, Lock, Flag, Trophy, Trash2, Send } from 'lucide-react'

import type { Competition, Competitor } from '../types'
import type { Language } from '../translations'
import { translations } from '../translations'
import type { NotificationsState } from '../hooks/useNotifications'
import {
  type AppNotification, type NotificationAudience,
  EMPTY_AUDIENCE, genderGroups, isEveryone, memberMatches, parseBibs,
} from '../lib/notifications'

type T = (typeof translations)[Language]
const BTN_SPRING = { type: 'spring', stiffness: 420, damping: 26, mass: 0.7 } as const

// ─── TEXT ─────────────────────────────────────────────────────────────────────

function textOf(n: AppNotification, t: T): { title: string; body: string } {
  switch (n.kind) {
    case 'top_validated':   return { title: t.notifTopValidatedTitle(String(n.params?.number ?? '?')), body: t.notifTopValidatedBody }
    case 'results_locked':  return { title: t.notifLockedTitle,   body: t.notifLockedBody }
    case 'status_live':     return { title: t.notifLiveTitle,     body: t.notifLiveBody }
    case 'status_finished': return { title: t.notifFinishedTitle, body: t.notifFinishedBody }
    default:                return { title: n.title, body: n.body }
  }
}

function KindIcon({ kind, size = 15 }: { kind: AppNotification['kind']; size?: number }) {
  const cls = 'text-[#7F8BAD] flex-shrink-0'
  switch (kind) {
    case 'top_validated':   return <ShieldCheck size={size} className={cls} />
    case 'results_locked':  return <Lock        size={size} className={cls} />
    case 'status_live':     return <Flag        size={size} className={cls} />
    case 'status_finished': return <Trophy      size={size} className={cls} />
    default:                return <Megaphone   size={size} className={cls} />
  }
}

function timeAgo(at: number, lang: Language): string {
  const rtf  = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' })
  const secs = Math.round((at - Date.now()) / 1000)
  if (Math.abs(secs) < 60)    return rtf.format(secs, 'second')
  const mins = Math.round(secs / 60)
  if (Math.abs(mins) < 60)    return rtf.format(mins, 'minute')
  const hours = Math.round(mins / 60)
  if (Math.abs(hours) < 24)   return rtf.format(hours, 'hour')
  return rtf.format(Math.round(hours / 24), 'day')
}

function audienceSummary(a: NotificationAudience | undefined, competition: Competition, t: T): string {
  if (isEveryone(a)) return t.notifToEveryone
  const parts: string[] = []
  const roleLabel: Record<string, string> = {
    competitor: t.notifRoleCompetitor, judge: t.notifRoleJudge, organizer: t.notifRoleOrganizer,
  }
  if (a!.roles.length)   parts.push(a!.roles.map(r => roleLabel[r] ?? r).join(' / '))
  if (a!.traits.length)  parts.push(a!.traits.map(id => competition.traits?.find(x => x.id === id)?.name ?? id).join(' / '))
  if (a!.genders.length) {
    const groups = genderGroups(a!.genders, k => t[k])
    parts.push(groups.filter(g => g.values.some(v => a!.genders.includes(v))).map(g => g.label).join(' / '))
  }
  if (a!.bibs.length)    parts.push(t.notifBibsCount(a!.bibs.length))
  return parts.join(', ')
}

// ─── BELL + PANEL ─────────────────────────────────────────────────────────────

interface BellProps {
  state:       NotificationsState
  competition: Competition
  members:     Competitor[]
  theme:       'light' | 'dark'
  lang:        Language
}

export function NotificationBell({ state, competition, members, theme, lang }: BellProps) {
  const t  = translations[lang]
  const dk = theme === 'dark'
  const [open,      setOpen]      = useState(false)
  const [composing, setComposing] = useState(false)
  const [highlight, setHighlight] = useState<Set<string>>(new Set())
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const btnRef   = useRef<HTMLButtonElement>(null)

  function toggle() {
    if (open) { setOpen(false); return }
    // Remember what was unread when opening, then mark everything read.
    setHighlight(new Set(state.items.filter(n => !state.read.has(n.id)).map(n => n.id)))
    state.markAllRead()
    setConfirmId(null)
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      const target = e.target as Node
      if (panelRef.current?.contains(target) || btnRef.current?.contains(target)) return
      setOpen(false)
    }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); window.removeEventListener('keydown', onKey) }
  }, [open])

  // New items arriving while the panel is open are read too.
  useEffect(() => { if (open) state.markAllRead() }, [open, state.items.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const btnBase = `relative p-2 rounded-md transition-colors duration-200 flex items-center ${
    dk ? 'text-[#5C5E62] hover:text-[#EEEEEE] hover:bg-white/5' : 'text-[#8E8E8E] hover:text-[#121212] hover:bg-[#F4F4F4]'
  }`

  return (
    <>
      <motion.button
        ref={btnRef}
        onClick={toggle}
        aria-label={t.notifTitle}
        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.88 }} transition={BTN_SPRING}
        className={btnBase}
      >
        <Bell size={17} />
        {state.unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold leading-4 text-center">
            {state.unreadCount > 9 ? '9+' : state.unreadCount}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className={`fixed top-14 right-2 left-2 sm:left-auto sm:w-96 z-[200] rounded border shadow-xl max-h-[75vh] flex flex-col ${
              dk ? 'bg-[#181818] border-white/10' : 'bg-white border-[#EEEEEE]'
            }`}
          >
            <div className={`flex items-center justify-between px-4 py-3 border-b ${dk ? 'border-white/10' : 'border-[#EEEEEE]'}`}>
              <h2 className={`text-sm font-medium ${dk ? 'text-[#EEEEEE]' : 'text-[#121212]'}`}>{t.notifTitle}</h2>
              <div className="flex items-center gap-1">
                {state.isStaff && (
                  <button
                    onClick={() => { setComposing(true); setOpen(false) }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-[#7F8BAD] text-white hover:bg-[#6D799B] transition-colors duration-200"
                  >
                    <Megaphone size={13} />
                    {t.notifNew}
                  </button>
                )}
                <button onClick={() => setOpen(false)} aria-label={t.notifClose}
                  className={`p-1.5 rounded ${dk ? 'text-[#5C5E62] hover:bg-white/5' : 'text-[#8E8E8E] hover:bg-[#F4F4F4]'}`}>
                  <X size={15} />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto">
              {state.items.length === 0 ? (
                <p className={`px-4 py-8 text-center text-xs ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>{t.notifEmpty}</p>
              ) : state.items.map(n => {
                const { title, body } = textOf(n, t)
                const isNew = highlight.has(n.id)
                return (
                  <div key={n.id} className={`px-4 py-3 border-b last:border-b-0 ${dk ? 'border-white/5' : 'border-[#F4F4F4]'} ${isNew ? (dk ? 'bg-[#7F8BAD]/10' : 'bg-[#7F8BAD]/5') : ''}`}>
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5"><KindIcon kind={n.kind} /></div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium break-words ${dk ? 'text-[#EEEEEE]' : 'text-[#121212]'}`}>{title}</p>
                        {body && <p className={`text-xs mt-0.5 whitespace-pre-wrap break-words ${dk ? 'text-[#8E8E8E]' : 'text-[#5C5E62]'}`}>{body}</p>}
                        <p className={`text-[10px] mt-1 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
                          {timeAgo(n.createdAt, lang)}
                          {state.isStaff && n.kind === 'announcement' && <> · {audienceSummary(n.audience, competition, t)}</>}
                        </p>
                      </div>
                      {state.isStaff && n.kind === 'announcement' && (
                        confirmId === n.id ? (
                          <button
                            onClick={() => { state.remove(n.id).catch(err => console.error('[notifications] delete:', err)); setConfirmId(null) }}
                            className="text-[10px] font-medium px-2 py-1 rounded bg-red-400 text-white hover:bg-red-500 flex-shrink-0"
                          >
                            {t.notifDeleteConfirm}
                          </button>
                        ) : (
                          <button onClick={() => setConfirmId(n.id)} aria-label={t.notifDelete}
                            className={`p-1 rounded flex-shrink-0 ${dk ? 'text-[#5C5E62] hover:text-red-400' : 'text-[#D0D1D2] hover:text-red-500'}`}>
                            <Trash2 size={13} />
                          </button>
                        )
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {composing && (
          <Composer
            state={state} competition={competition} members={members}
            theme={theme} lang={lang} onClose={() => setComposing(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}

// ─── COMPOSER (organizers) ────────────────────────────────────────────────────

interface ComposerProps extends BellProps { onClose: () => void }

function Composer({ state, competition, members, theme, lang, onClose }: ComposerProps) {
  const t  = translations[lang]
  const dk = theme === 'dark'
  const [title,    setTitle]    = useState('')
  const [body,     setBody]     = useState('')
  const [roles,    setRoles]    = useState<string[]>([])
  const [traits,   setTraits]   = useState<string[]>([])
  const [genders,  setGenders]  = useState<string[]>([])  // group keys
  const [bibsText, setBibsText] = useState('')
  const [sending,  setSending]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const groups = useMemo(
    () => genderGroups(members.map(m => m.gender ?? '').filter(Boolean), k => t[k]),
    [members, t],
  )
  const bibs = useMemo(() => bibsText.trim() ? parseBibs(bibsText) : [], [bibsText])
  const audience: NotificationAudience = useMemo(() => ({
    ...EMPTY_AUDIENCE,
    roles,
    traits,
    genders: groups.filter(g => genders.includes(g.key)).flatMap(g => g.values),
    bibs:    bibs ?? [],
  }), [roles, traits, genders, groups, bibs])
  const recipients = useMemo(() => members.filter(m => memberMatches(m, audience)).length, [members, audience])

  const canSend = title.trim().length > 0 && bibs !== null && recipients > 0 && !sending

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape' && !sending) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, sending])

  async function submit() {
    if (!canSend) return
    setSending(true)
    setError(null)
    try {
      await state.send(title, body, audience)
      onClose()
    } catch (err) {
      console.error('[notifications] send:', err)
      setError(t.notifSendError)
      setSending(false)
    }
  }

  const toggle = (list: string[], set: (v: string[]) => void, v: string) =>
    set(list.includes(v) ? list.filter(x => x !== v) : [...list, v])

  const labelCls = `text-[11px] font-medium mb-1.5 block ${dk ? 'text-[#8E8E8E]' : 'text-[#5C5E62]'}`
  const inputCls = `w-full px-3 py-2 rounded border outline-none text-sm transition-colors duration-200 ${
    dk ? 'bg-white/5 border-white/10 text-[#EEEEEE] focus:border-[#7F8BAD]/50' : 'bg-white border-[#EEEEEE] text-[#121212] focus:border-[#7F8BAD]/50'
  }`
  const chip = (active: boolean) => `px-3 py-1.5 rounded text-xs font-medium border transition-colors duration-200 ${
    active
      ? 'bg-[#7F8BAD]/10 text-[#7F8BAD] border-[#7F8BAD]/30'
      : dk ? 'bg-white/5 text-[#D0D1D2] border-white/10 hover:bg-white/10' : 'bg-white text-[#393C41] border-[#EEEEEE] hover:bg-[#F4F4F4]'
  }`

  const roleOptions = [
    { value: 'competitor', label: t.notifRoleCompetitor },
    { value: 'judge',      label: t.notifRoleJudge },
    { value: 'organizer',  label: t.notifRoleOrganizer },
  ]

  return (
    <motion.div
      className="fixed inset-0 z-[1100] flex items-start sm:items-center justify-center bg-black/50 p-3 overflow-y-auto"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onMouseDown={e => { if (e.target === e.currentTarget && !sending) onClose() }}
    >
      <motion.div
        initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 12, opacity: 0 }}
        className={`w-full max-w-lg rounded border p-5 my-4 ${dk ? 'bg-[#181818] border-white/10' : 'bg-white border-[#EEEEEE]'}`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-base font-medium flex items-center gap-2 ${dk ? 'text-[#EEEEEE]' : 'text-[#121212]'}`}>
            <Megaphone size={16} className="text-[#7F8BAD]" />
            {t.notifNew}
          </h2>
          <button onClick={onClose} disabled={sending} aria-label={t.notifClose}
            className={`p-1.5 rounded ${dk ? 'text-[#5C5E62] hover:bg-white/5' : 'text-[#8E8E8E] hover:bg-[#F4F4F4]'}`}>
            <X size={16} />
          </button>
        </div>

        <label className={labelCls}>{t.notifFormTitle}</label>
        <input value={title} maxLength={120} onChange={e => setTitle(e.target.value)} className={`${inputCls} mb-3`} autoFocus />

        <label className={labelCls}>{t.notifFormBody}</label>
        <textarea value={body} maxLength={1000} rows={3} onChange={e => setBody(e.target.value)} className={`${inputCls} mb-4 resize-y`} />

        <p className={`text-sm font-medium mb-1 ${dk ? 'text-[#D0D1D2]' : 'text-[#393C41]'}`}>{t.notifAudience}</p>
        <p className={`text-[11px] mb-3 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>{t.notifAudienceHint}</p>

        <label className={labelCls}>{t.notifRoles}</label>
        <div className="flex flex-wrap gap-2 mb-3">
          {roleOptions.map(o => (
            <button key={o.value} onClick={() => toggle(roles, setRoles, o.value)} className={chip(roles.includes(o.value))}>{o.label}</button>
          ))}
        </div>

        {(competition.traits?.length ?? 0) > 0 && (
          <>
            <label className={labelCls}>{t.notifCategories}</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {competition.traits.map(tr => (
                <button key={tr.id} onClick={() => toggle(traits, setTraits, tr.id)} className={chip(traits.includes(tr.id))}>{tr.name}</button>
              ))}
            </div>
          </>
        )}

        <label className={labelCls}>{t.notifGender}</label>
        <div className="flex flex-wrap gap-2 mb-3">
          {groups.map(g => (
            <button key={g.key} onClick={() => toggle(genders, setGenders, g.key)} className={chip(genders.includes(g.key))}>{g.label}</button>
          ))}
        </div>

        <label className={labelCls}>{t.notifBibs}</label>
        <input value={bibsText} onChange={e => setBibsText(e.target.value)} placeholder={t.notifBibsPlaceholder} className={inputCls} />
        {bibs === null && <p className="text-[11px] mt-1 text-red-400">{t.notifBibsInvalid}</p>}

        <div className={`mt-4 px-3 py-2 rounded text-xs font-medium ${
          recipients > 0 ? (dk ? 'bg-[#7F8BAD]/10 text-[#7F8BAD]' : 'bg-[#7F8BAD]/5 text-[#5C6A8E]') : 'bg-red-400/10 text-red-400'
        }`}>
          {t.notifRecipients(recipients)}
        </div>

        {error && <p className="text-xs mt-3 text-red-400">{error}</p>}

        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} disabled={sending}
            className={`px-4 py-2 rounded text-sm font-medium ${dk ? 'bg-white/5 text-[#8E8E8E]' : 'bg-[#F4F4F4] text-[#5C5E62]'}`}>
            {t.cancel}
          </button>
          <button onClick={submit} disabled={!canSend}
            className="flex items-center gap-2 px-5 py-2 rounded text-sm font-medium bg-[#7F8BAD] text-white hover:bg-[#6D799B] transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed">
            <Send size={14} />
            {sending ? t.notifSending : t.notifSend}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── POP-UP ───────────────────────────────────────────────────────────────────
// Shows the oldest pending notification. Announcements stay until closed;
// automatic notices close by themselves after a few seconds.

interface PopupProps {
  state: NotificationsState
  theme: 'light' | 'dark'
  lang:  Language
}

export function NotificationPopup({ state, theme, lang }: PopupProps) {
  const t  = translations[lang]
  const dk = theme === 'dark'
  const current = state.popups[0]
  const more    = state.popups.length - 1

  // Depends on the id only: the app re-renders on every real-time event, and
  // restarting the timer each time would keep the notice open forever.
  const { dismissPopup } = state
  const currentId   = current?.id
  const currentKind = current?.kind
  useEffect(() => {
    if (!currentId || currentKind === 'announcement') return
    const timer = setTimeout(() => dismissPopup(currentId), 7000)
    return () => clearTimeout(timer)
  }, [currentId, currentKind, dismissPopup])

  return (
    <div className="fixed top-16 left-0 right-0 z-[1000] flex justify-center px-3 pointer-events-none">
      <AnimatePresence mode="wait">
        {current && (() => {
          const { title, body } = textOf(current, t)
          return (
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
              role="alert"
              className={`pointer-events-auto w-full max-w-md rounded border shadow-xl px-4 py-3 ${
                dk ? 'bg-[#181818]/95 border-[#7F8BAD]/30' : 'bg-white border-[#7F8BAD]/30'
              } backdrop-blur`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5"><KindIcon kind={current.kind} size={17} /></div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium break-words ${dk ? 'text-[#EEEEEE]' : 'text-[#121212]'}`}>{title}</p>
                  {body && <p className={`text-xs mt-1 whitespace-pre-wrap break-words ${dk ? 'text-[#8E8E8E]' : 'text-[#5C5E62]'}`}>{body}</p>}
                  {more > 0 && <p className="text-[10px] mt-1.5 text-[#7F8BAD]">{t.notifMore(more)}</p>}
                </div>
                <button onClick={() => state.dismissPopup(current.id)} aria-label={t.notifClose}
                  className={`p-1 rounded flex-shrink-0 ${dk ? 'text-[#5C5E62] hover:bg-white/5' : 'text-[#8E8E8E] hover:bg-[#F4F4F4]'}`}>
                  <X size={15} />
                </button>
              </div>
            </motion.div>
          )
        })()}
      </AnimatePresence>
    </div>
  )
}
