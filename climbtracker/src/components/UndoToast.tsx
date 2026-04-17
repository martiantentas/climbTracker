import { useEffect, useRef, useState } from 'react'
import { Undo2, X } from 'lucide-react'

interface UndoToastProps {
  message:   string
  theme:     'light' | 'dark'
  onUndo:    () => void
  onCommit:  () => void
  onDismiss: () => void
}

const DURATION = 5000

export default function UndoToast({ message, theme, onUndo, onCommit, onDismiss }: UndoToastProps) {
  const [progress, setProgress]   = useState(100)
  const startRef    = useRef<number>(Date.now())
  const rafRef      = useRef<number | null>(null)
  const commitedRef = useRef(false)
  const dk          = theme === 'dark'

  useEffect(() => {
    function tick() {
      const elapsed   = Date.now() - startRef.current
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
      rounded border overflow-hidden
      ${dk
        ? 'bg-[#1C1F24] border-white/15 text-[#EEEEEE]'
        : 'bg-white border-[#EEEEEE] text-[#171A20]'
      }
    `}>
      <div className="flex items-center gap-3 px-4 py-3.5">
        <div className={`w-7 h-7 rounded flex items-center justify-center flex-shrink-0 ${dk ? 'bg-red-400/15' : 'bg-red-50'}`}>
          <Undo2 size={13} className="text-red-400" />
        </div>

        <p className={`flex-1 text-sm font-medium ${dk ? 'text-[#D0D1D2]' : 'text-[#393C41]'}`}>
          {message}
        </p>

        <button
          onClick={handleUndo}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors duration-[330ms] bg-[#3E6AE1] text-white hover:bg-[#3056C7] flex-shrink-0"
        >
          <Undo2 size={11} /> Undo
        </button>

        <button
          onClick={handleDismiss}
          className={`p-1.5 rounded transition-colors duration-[330ms] flex-shrink-0 ${dk ? 'text-[#5C5E62] hover:text-[#D0D1D2] hover:bg-white/5' : 'text-[#8E8E8E] hover:text-[#393C41] hover:bg-[#F4F4F4]'}`}
        >
          <X size={14} />
        </button>
      </div>

      <div className={`h-0.5 ${dk ? 'bg-white/5' : 'bg-[#EEEEEE]'}`}>
        <div
          className="h-full bg-[#3E6AE1] transition-none"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
