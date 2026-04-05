import { CheckCircle2 } from 'lucide-react'

interface ToastProps {
  message: string
  visible: boolean
  theme:   'light' | 'dark'
}

export default function Toast({ message, visible, theme }: ToastProps) {
  return (
    <div
      className="fixed top-8 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none transition-all duration-500"
      style={{ transform: `translateX(-50%) translateY(${visible ? '0' : '-16px'})`, opacity: visible ? 1 : 0 }}
    >
      <div className={`
        px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl backdrop-blur-xl border
        ${theme === 'dark'
          ? 'bg-sky-400/20 border-sky-400/30 text-sky-100'
          : 'bg-white border-slate-200 text-slate-900'
        }
      `}>
        <CheckCircle2 size={16} className="text-sky-400 flex-shrink-0" />
        <span className="text-sm font-bold tracking-tight whitespace-nowrap">
          {message}
        </span>
      </div>
    </div>
  )
}