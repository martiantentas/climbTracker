import { useState } from 'react'
import { Edit3, Save, X } from 'lucide-react'

import type { Competition } from '../types'
import type { Language } from '../translations'
import { translations } from '../translations'

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface RulesPageProps {
  competition:    Competition
  isOrganizer:    boolean
  theme:          'light' | 'dark'
  lang:           Language
  onUpdate:       (updated: Competition) => void
}

// ─── SIMPLE MARKDOWN RENDERER ─────────────────────────────────────────────────

function renderMarkdown(text: string, theme: 'light' | 'dark'): React.ReactNode[] {
  const dk    = theme === 'dark'
  const lines = text.split('\n')

  return lines.map((line, i) => {
    if (line.startsWith('### ')) {
      return (
        <h3 key={i} className={`text-lg font-medium mt-6 mb-2 first:mt-0 ${dk ? 'text-[#EEEEEE]' : 'text-[#171A20]'}`}>
          {line.replace('### ', '')}
        </h3>
      )
    }

    if (line.startsWith('## ')) {
      return (
        <h2 key={i} className={`text-xl font-medium mt-8 mb-3 first:mt-0 ${dk ? 'text-[#EEEEEE]' : 'text-[#171A20]'}`}>
          {line.replace('## ', '')}
        </h2>
      )
    }

    if (line.startsWith('- ') || line.startsWith('* ')) {
      const content = line.replace(/^[-*] /, '')
      return (
        <div key={i} className="flex items-start gap-2 my-1">
          <span className="text-[#3E6AE1] mt-1 flex-shrink-0">•</span>
          <span className={`text-sm leading-relaxed ${dk ? 'text-[#D0D1D2]' : 'text-[#393C41]'}`}>
            {renderInline(content)}
          </span>
        </div>
      )
    }

    const numberedMatch = line.match(/^(\d+)\. (.+)/)
    if (numberedMatch) {
      return (
        <div key={i} className="flex items-start gap-3 my-1">
          <span className="text-[11px] font-medium w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 bg-[#3E6AE1]/10 text-[#3E6AE1]">
            {numberedMatch[1]}
          </span>
          <span className={`text-sm leading-relaxed ${dk ? 'text-[#D0D1D2]' : 'text-[#393C41]'}`}>
            {renderInline(numberedMatch[2])}
          </span>
        </div>
      )
    }

    if (line.trim() === '') {
      return <div key={i} className="h-2" />
    }

    return (
      <p key={i} className={`text-sm leading-relaxed my-1 ${dk ? 'text-[#D0D1D2]' : 'text-[#393C41]'}`}>
        {renderInline(line)}
      </p>
    )
  })
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-medium">{part.slice(2, -2)}</strong>
    }
    return part
  })
}

// ─── RULES PAGE ───────────────────────────────────────────────────────────────

export default function RulesPage({
  competition,
  isOrganizer,
  theme,
  lang,
  onUpdate,
}: RulesPageProps) {
  const t  = translations[lang]
  const dk = theme === 'dark'

  const rulesContent = competition.rules[lang] ?? competition.rules.en

  const [isEditing, setIsEditing] = useState(false)
  const [draftText, setDraftText] = useState(rulesContent)

  function handleSave() {
    onUpdate({ ...competition, rules: { ...competition.rules, [lang]: draftText } })
    setIsEditing(false)
  }

  function handleCancel() {
    setDraftText(rulesContent)
    setIsEditing(false)
  }

  const btnSecondary = `
    flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors duration-[330ms]
    ${dk
      ? 'bg-white/5 text-[#8E8E8E] hover:bg-white/10 hover:text-[#EEEEEE] border border-white/10'
      : 'bg-[#F4F4F4] text-[#5C5E62] hover:bg-[#EEEEEE] border border-[#EEEEEE]'
    }
  `

  return (
    <div className="max-w-3xl mx-auto">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className={`text-2xl font-medium ${dk ? 'text-[#EEEEEE]' : 'text-[#171A20]'}`}>
            {t.rules}
          </h1>
          <p className={`text-sm mt-1 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
            {competition.name}
          </p>
        </div>

        {isOrganizer && !isEditing && (
          <button onClick={() => { setDraftText(rulesContent); setIsEditing(true) }} className={btnSecondary}>
            <Edit3 size={15} />
            {t.editRules}
          </button>
        )}

        {isEditing && (
          <div className="flex items-center gap-2">
            <button onClick={handleCancel} className={btnSecondary}>
              <X size={15} />
              {t.cancel}
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium bg-[#3E6AE1] text-white hover:bg-[#3056C7] transition-colors duration-[330ms]"
            >
              <Save size={15} />
              {t.save}
            </button>
          </div>
        )}
      </div>

      {/* ── Editor ── */}
      {isEditing ? (
        <div className={`rounded border overflow-hidden ${dk ? 'border-white/10' : 'border-[#EEEEEE]'}`}>

          <div className={`
            px-4 py-2 text-[10px] font-medium border-b
            ${dk ? 'bg-white/5 text-[#5C5E62] border-white/10' : 'bg-[#F4F4F4] text-[#8E8E8E] border-[#EEEEEE]'}
          `}>
            Markdown supported · ### Heading · **bold** · - bullet · 1. numbered
          </div>

          <div className={`grid grid-cols-2 divide-x ${dk ? 'divide-white/10' : 'divide-[#EEEEEE]'}`}>
            <textarea
              value={draftText}
              onChange={e => setDraftText(e.target.value)}
              className={`
                w-full h-96 p-4 text-sm font-mono leading-relaxed outline-none resize-none
                ${dk
                  ? 'bg-[#171A20] text-[#D0D1D2] placeholder:text-[#5C5E62]'
                  : 'bg-white text-[#393C41] placeholder:text-[#8E8E8E]'
                }
              `}
              placeholder="Write rules here using markdown..."
              spellCheck={false}
            />
            <div className={`h-96 p-4 overflow-y-auto ${dk ? 'bg-[#171A20]/50' : 'bg-[#F4F4F4]'}`}>
              <p className={`text-[9px] font-medium mb-3 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>Preview</p>
              {renderMarkdown(draftText, theme)}
            </div>
          </div>
        </div>

      ) : (
        <div className={`rounded border p-6 md:p-8 ${dk ? 'bg-white/[0.03] border-white/10' : 'bg-white border-[#EEEEEE]'}`}>
          {rulesContent
            ? renderMarkdown(rulesContent, theme)
            : (
              <p className={`text-sm text-center py-8 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
                No rules have been set for this competition yet.
              </p>
            )
          }
        </div>
      )}

      <p className={`text-[11px] text-center mt-6 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
        Viewing rules in: {lang.toUpperCase()} · Changes save to the active language only
      </p>
    </div>
  )
}
