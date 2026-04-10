import { useEffect, useRef, useState } from 'react'
import { Undo2, X } from 'lucide-react'

interface UndoToastProps {
  message:   string                // e.g. "Boulder #3 deleted"
  theme:     'light' | 'dark'
  onUndo:    () => void            // called if user clicks Undo
  onCommit:  () => void            // called after 5s if not undone
  onDismiss: () => void            // called after either outcome
}

const DURATION = 5000 // ms

export default function UndoToast({ message, theme, onUndo, onCommit, onDismiss }: UndoToastProps) {
  const [progress, setProgress] = useState(100)
  const startRef   = useRef<number>(Date.now())
  const rafRef     = useRef<number | null>(null)
  const commitedRef = useRef(false)

  useEffect(() => {
    function tick() {
      const elapsed = Date.now() - startRef.current
      const remaining = Math.max(0, 100 - (elapsed / DURATION) * 100)
      setProgress(remaining)
      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(tick)
      } else if (!commitedRef.current) {
        commitedRef.current = true
        onCommit()
        onDismiss()
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [onCommit, onDismiss])

  function handleUndo() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (!commitedRef.current) {
      commitedRef.current = true
      onUndo()
      onDismiss()
    }
  }

  function handleDismiss() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (!commitedRef.current) {
      commitedRef.current = true
      onCommit()
      onDismiss()
    }
  }

  return (
    <div className={`
      fixed bottom-6 left-1/2 -translate-x-1/2 z-[600]
      min-w-[320px] max-w-sm w-full mx-4
      rounded-2xl border shadow-2xl overflow-hidden
      ${theme === 'dark'
        ? 'bg-slate-800 border-white/15 text-white'
        : 'bg-white border-slate-200 text-slate-900 shadow-slate-200/60'
      }
    `}>
      {/* Content row */}
      <div className="flex items-center gap-3 px-4 py-3.5">
        <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 ${theme === 'dark' ? 'bg-red-400/15' : 'bg-red-50'}`}>
          <Undo2 size={13} className="text-red-400" />
        </div>

        <p className={`flex-1 text-sm font-bold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>
          {message}
        </p>

        <button
          onClick={handleUndo}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all bg-sky-400 text-sky-950 hover:bg-sky-300 flex-shrink-0"
        >
          <Undo2 size={11} /> Undo
        </button>

        <button
          onClick={handleDismiss}
          className={`p-1.5 rounded-lg transition-all flex-shrink-0 ${theme === 'dark' ? 'text-slate-500 hover:text-slate-300 hover:bg-white/5' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
        >
          <X size={14} />
        </button>
      </div>

      {/* Animated progress bar */}
      <div className={`h-0.5 ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-100'}`}>
        <div
          className="h-full bg-sky-400 transition-none"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}