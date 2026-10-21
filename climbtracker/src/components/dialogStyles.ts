// Shared look for modal dialogs: blurred backdrop + rounded panel with a thin ring.
export const DIALOG_OVERLAY = 'bg-black/30 backdrop-blur-md'

export function dialogPanel(dk: boolean): string {
  return `rounded-xl ring-1 shadow-2xl ${dk ? 'bg-[#1C1F24] ring-white/10' : 'bg-white ring-black/10'}`
}

// Muted band for the action area at the bottom of a dialog.
export function dialogFooter(dk: boolean): string {
  return `rounded-b-xl border-t ${dk ? 'border-white/10 bg-white/[0.03]' : 'border-[#EEEEEE] bg-[#F9F9F9]'}`
}
