import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Undo2, X } from 'lucide-react'
import { motion } from 'motion/react'

interface UndoToastProps {
  message:   string
  theme:     'light' | 'dark'
  onUndo:    () => void
  onCommit:  () => void
  onDismiss: () => void
}

const DURATION = 3000

export default function UndoToast({ message, theme, onUndo, onCommit, onDismiss }: UndoToastProps) {
  const [progress, setProgress]   = useState(100)
  const startRef    = useRef<number>(Date.now())
  const rafRef      = useRef<number | null>(null)
  const commitedRef = useRef(false)
  const dk          = theme === 'dark'

  // Always call the latest callbacks without restarting the countdown on re-render.
  const onCommitRef  = useRef(onCommit)
  const onDismissRef = useRef(onDismiss)
  const mountedRef   = useRef(false)
  onCommitRef.current  = onCommit
  onDismissRef.current = onDismiss

  useEffect(() => {
    mountedRef.current = true
    function tick() {
      const elapsed   = Date.now() - startRef.current
      const remaining = Math.max(0, 100 - (elapsed / DURATION) * 100)
      setProgress(remaining)
      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(tick)
      } else if (!commitedRef.current) {
        commitedRef.current = true
        onCommitRef.current()
        onDismissRef.current()
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      // Toast removed (e.g. replaced by another action) before undo/timeout: commit the
      // action instead of silently dropping it. Deferred so StrictMode's fake unmount is ignored.
      mountedRef.current = false
      setTimeout(() => {
        if (!mountedRef.current && !commitedRef.current) {
          commitedRef.current = true
          onCommitRef.current()
        }
      }, 0)
    }
  }, [])

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
    <motion.div
      role="status"
      className={`
        fixed inset-x-4 bottom-4 z-[600] mx-auto w-auto max-w-sm
        sm:left-auto sm:right-4 sm:mx-0 sm:w-full
        rounded-2xl border shadow-lg overflow-hidden select-none
        ${dk
          ? 'bg-[#1C1F24] border-white/15 text-[#EEEEEE]'
          : 'bg-white border-[#EEEEEE] text-[#121212]'
        }
      `}
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 380, damping: 30, mass: 0.85 }}
    >
      <div className="flex items-center gap-3 p-4">
        <CheckCircle2 size={16} className={`shrink-0 ${dk ? 'text-[#D0D1D2]' : 'text-[#393C41]'}`} aria-hidden="true" />

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="text-sm font-medium">{message}</p>
        </div>

        <button
          onClick={handleUndo}
          className={`shrink-0 inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border text-xs font-medium transition-colors duration-[330ms] ${dk ? 'border-white/15 text-[#EEEEEE] hover:bg-white/5' : 'border-[#D0D1D2] text-[#121212] hover:bg-[#F4F4F4]'}`}
        >
          <Undo2 size={12} /> Undo
        </button>

        <button
          onClick={handleDismiss}
          aria-label="Close toast"
          className={`relative shrink-0 p-1.5 rounded-lg transition-colors duration-[330ms] after:absolute after:-inset-2 after:content-[''] ${dk ? 'text-[#5C5E62] hover:text-[#EEEEEE] hover:bg-white/5' : 'text-[#8E8E8E] hover:text-[#121212] hover:bg-[#F4F4F4]'}`}
        >
          <X size={14} />
        </button>
      </div>

      <div className={`h-0.5 ${dk ? 'bg-white/5' : 'bg-[#EEEEEE]'}`}>
        <div
          className={`h-full transition-none ${dk ? 'bg-[#D0D1D2]' : 'bg-[#393C41]'}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  )
}
