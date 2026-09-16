import { CheckCircle2, AlertCircle } from 'lucide-react'

interface ToastProps {
  message:  string
  visible:  boolean
  theme:    'light' | 'dark'
  variant?: 'success' | 'error'
}

export default function Toast({ message, visible, theme, variant = 'success' }: ToastProps) {
  const isErr = variant === 'error'
  return (
    <div
      className="fixed top-8 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none transition-all duration-[330ms]"
      style={{ transform: `translateX(-50%) translateY(${visible ? '0' : '-16px'})`, opacity: visible ? 1 : 0 }}
    >
      <div className={`
        px-6 py-3 rounded border flex items-center gap-3 backdrop-blur
        ${isErr
          ? 'bg-red-950/90 border-red-700/40 text-red-200'
          : theme === 'dark'
            ? 'bg-[#121212]/90 border-white/10 text-[#EEEEEE]'
            : 'bg-white border-[#EEEEEE] text-[#121212]'
        }
      `}>
        {isErr
          ? <AlertCircle  size={16} className="text-red-400 flex-shrink-0" />
          : <CheckCircle2 size={16} className="text-[#7F8BAD] flex-shrink-0" />
        }
        <span className="text-sm font-medium whitespace-nowrap">{message}</span>
      </div>
    </div>
  )
}
