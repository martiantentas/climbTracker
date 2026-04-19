import { CheckCircle2 } from 'lucide-react'

interface ToastProps {
  message: string
  visible: boolean
  theme:   'light' | 'dark'
}

export default function Toast({ message, visible, theme }: ToastProps) {
  return (
    <div
      className="fixed top-8 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none transition-all duration-[330ms]"
      style={{ transform: `translateX(-50%) translateY(${visible ? '0' : '-16px'})`, opacity: visible ? 1 : 0 }}
    >
      <div className={`
        px-6 py-3 rounded border flex items-center gap-3 backdrop-blur
        ${theme === 'dark'
          ? 'bg-[#121212]/90 border-white/10 text-[#EEEEEE]'
          : 'bg-white border-[#EEEEEE] text-[#121212]'
        }
      `}>
        <CheckCircle2 size={16} className="text-[#7F8BAD] flex-shrink-0" />
        <span className="text-sm font-medium whitespace-nowrap">
          {message}
        </span>
      </div>
    </div>
  )
}
