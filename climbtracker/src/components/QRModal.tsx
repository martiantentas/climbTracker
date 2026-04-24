import { useEffect, useRef, useState } from 'react'
import { X, Download, Printer } from 'lucide-react'
import QRCode from 'qrcode'
import type { Language } from '../translations'
import { translations } from '../translations'

interface QRModalProps {
  url:             string
  competitionName: string
  theme:           'light' | 'dark'
  lang:            Language
  onClose:         () => void
}

export default function QRModal({ url, competitionName, theme, lang, onClose }: QRModalProps) {
  const dk         = theme === 'dark'
  const t          = translations[lang]
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const [ready,  setReady]  = useState(false)
  const [error,  setError]  = useState(false)

  useEffect(() => {
    if (!canvasRef.current) return
    QRCode.toCanvas(canvasRef.current, url, {
      width:  220,
      margin: 2,
      color:  { dark: '#121212', light: '#FFFFFF' },
    })
      .then(() => setReady(true))
      .catch(() => setError(true))
  }, [url])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function getDataUrl(): string {
    return canvasRef.current?.toDataURL('image/png') ?? ''
  }

  function downloadPNG() {
    const dataUrl = getDataUrl()
    if (!dataUrl) return
    const a = document.createElement('a')
    a.href     = dataUrl
    a.download = `${competitionName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-qr.png`
    a.click()
  }

  function printPDF() {
    const dataUrl = getDataUrl()
    if (!dataUrl) return
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>${competitionName} – QR Code</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; min-height: 100vh; padding: 40px;
      background: #fff; color: #121212;
    }
    img  { width: 260px; height: 260px; display: block; margin-bottom: 24px; }
    h1   { font-size: 22px; font-weight: 600; margin-bottom: 6px; text-align: center; }
    p    { font-size: 12px; color: #666; text-align: center; word-break: break-all; max-width: 320px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <img src="${dataUrl}" alt="QR Code" />
  <h1>${competitionName}</h1>
  <p>${url}</p>
</body>
</html>`)
    w.document.close()
    setTimeout(() => { w.focus(); w.print() }, 400)
  }

  const btnBase = `flex items-center justify-center gap-2 flex-1 py-3 rounded text-sm font-medium border transition-colors duration-[330ms]`

  return (
    <>
      <div className="fixed inset-0 z-[400] bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`fixed inset-x-4 top-1/2 -translate-y-1/2 z-[500] max-w-sm mx-auto rounded border ${dk ? 'bg-[#121212] border-white/10' : 'bg-white border-[#EEEEEE]'}`}>

        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${dk ? 'border-white/10' : 'border-[#EEEEEE]'}`}>
          <h2 className={`text-base font-medium ${dk ? 'text-[#EEEEEE]' : 'text-[#121212]'}`}>{t.qrTitle}</h2>
          <button onClick={onClose} className={`p-2 rounded transition-colors duration-[330ms] ${dk ? 'hover:bg-white/5 text-[#5C5E62]' : 'hover:bg-[#F4F4F4] text-[#8E8E8E]'}`}>
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          {/* Canvas — always white bg so the QR scans correctly */}
          <div className="bg-white rounded border border-[#EEEEEE] flex items-center justify-center p-4 mb-4">
            {error ? (
              <div className="w-[220px] h-[220px] flex items-center justify-center text-red-400 text-sm">
                Failed to generate QR
              </div>
            ) : (
              <div className="relative">
                {!ready && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-[#7F8BAD] border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                <canvas ref={canvasRef} style={{ display: ready ? 'block' : 'none' }} />
              </div>
            )}
          </div>

          <p className={`text-[11px] text-center mb-4 break-all ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>{url}</p>
          <p className={`text-xs text-center mb-5 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>{t.qrDesc}</p>

          <div className="flex gap-2">
            <button
              onClick={downloadPNG}
              disabled={!ready}
              className={`${btnBase} bg-[#7F8BAD] text-white border-transparent hover:bg-[#6D799B] disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <Download size={14} /> {t.qrDownloadPng}
            </button>
            <button
              onClick={printPDF}
              disabled={!ready}
              className={`${btnBase} ${dk ? 'bg-white/5 border-white/10 text-[#EEEEEE] hover:bg-white/10' : 'bg-[#F4F4F4] border-[#EEEEEE] text-[#393C41] hover:bg-[#EEEEEE]'} disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <Printer size={14} /> {t.qrDownloadPdf}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
