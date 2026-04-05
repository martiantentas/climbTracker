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
// Converts the basic markdown in rules text to HTML
// Handles: ### headings, **bold**, bullet lists, numbered lists

function renderMarkdown(text: string, theme: 'light' | 'dark'): React.ReactNode[] {
  const lines = text.split('\n')

  return lines.map((line, i) => {
    // H3 heading
    if (line.startsWith('### ')) {
      return (
        <h3
          key={i}
          className={`text-lg font-black tracking-tight mt-6 mb-2 first:mt-0 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}
        >
          {line.replace('### ', '')}
        </h3>
      )
    }

    // H2 heading
    if (line.startsWith('## ')) {
      return (
        <h2
          key={i}
          className={`text-xl font-black tracking-tight mt-8 mb-3 first:mt-0 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}
        >
          {line.replace('## ', '')}
        </h2>
      )
    }

    // Bullet list item
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const content = line.replace(/^[-*] /, '')
      return (
        <div key={i} className="flex items-start gap-2 my-1">
          <span className="text-sky-400 mt-1 flex-shrink-0">•</span>
          <span className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
            {renderInline(content)}
          </span>
        </div>
      )
    }

    // Numbered list item
    const numberedMatch = line.match(/^(\d+)\. (.+)/)
    if (numberedMatch) {
      return (
        <div key={i} className="flex items-start gap-3 my-1">
          <span className={`
            text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center
            flex-shrink-0 mt-0.5
            bg-sky-400/20 text-sky-400
          `}>
            {numberedMatch[1]}
          </span>
          <span className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
            {renderInline(numberedMatch[2])}
          </span>
        </div>
      )
    }

    // Empty line → spacer
    if (line.trim() === '') {
      return <div key={i} className="h-2" />
    }

    // Regular paragraph
    return (
      <p
        key={i}
        className={`text-sm leading-relaxed my-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}
      >
        {renderInline(line)}
      </p>
    )
  })
}

// Handles **bold** inline formatting
function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-black">{part.slice(2, -2)}</strong>
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
  const t = translations[lang]

  // The rules content for the active language
  const rulesContent = competition.rules[lang] ?? competition.rules.en

  // ── Edit state ───────────────────────────────────────────────────────────
  const [isEditing,  setIsEditing]  = useState(false)
  const [draftText,  setDraftText]  = useState(rulesContent)

  function handleSave() {
    onUpdate({
      ...competition,
      rules: {
        ...competition.rules,
        [lang]: draftText,
      },
    })
    setIsEditing(false)
  }

  function handleCancel() {
    setDraftText(rulesContent)
    setIsEditing(false)
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            {t.rules}
          </h1>
          <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            {competition.name}
          </p>
        </div>

        {/* Edit button — organizer only */}
        {isOrganizer && !isEditing && (
          <button
            onClick={() => { setDraftText(rulesContent); setIsEditing(true) }}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-xl
              text-sm font-black transition-all
              ${theme === 'dark'
                ? 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/10'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
              }
            `}
          >
            <Edit3 size={15} />
            {t.editRules}
          </button>
        )}

        {/* Save / Cancel buttons — shown while editing */}
        {isEditing && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black transition-all
                ${theme === 'dark'
                  ? 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/10'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                }
              `}
            >
              <X size={15} />
              {t.cancel}
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black bg-sky-400 text-sky-950 hover:bg-sky-300 transition-all"
            >
              <Save size={15} />
              {t.save}
            </button>
          </div>
        )}
      </div>

      {/* ── Editor — organizer editing mode ── */}
      {isEditing ? (
        <div className={`
          rounded-2xl border overflow-hidden
          ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'}
        `}>

          {/* Toolbar hint */}
          <div className={`
            px-4 py-2 text-[10px] font-black uppercase tracking-widest border-b
            ${theme === 'dark'
              ? 'bg-white/5 text-slate-500 border-white/10'
              : 'bg-slate-50 text-slate-400 border-slate-200'
            }
          `}>
            Markdown supported · ### Heading · **bold** · - bullet · 1. numbered
          </div>

          {/* Two-pane: editor + preview */}
          <div className="grid grid-cols-2 divide-x divide-white/10">

            {/* Editor pane */}
            <textarea
              value={draftText}
              onChange={e => setDraftText(e.target.value)}
              className={`
                w-full h-96 p-4 text-sm font-mono leading-relaxed
                outline-none resize-none
                ${theme === 'dark'
                  ? 'bg-slate-900 text-slate-300 placeholder:text-slate-600'
                  : 'bg-white text-slate-700 placeholder:text-slate-400'
                }
              `}
              placeholder="Write rules here using markdown..."
              spellCheck={false}
            />

            {/* Preview pane */}
            <div className={`
              h-96 p-4 overflow-y-auto
              ${theme === 'dark' ? 'bg-slate-900/50' : 'bg-slate-50'}
            `}>
              <p className={`text-[9px] font-black uppercase tracking-widest mb-3 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
                Preview
              </p>
              {renderMarkdown(draftText, theme)}
            </div>

          </div>
        </div>

      ) : (

        // ── Read-only view ────────────────────────────────────────────────
        <div className={`
          rounded-2xl border p-6 md:p-8
          ${theme === 'dark'
            ? 'bg-white/[0.03] border-white/10'
            : 'bg-white border-slate-200 shadow-sm'
          }
        `}>
          {rulesContent
            ? renderMarkdown(rulesContent, theme)
            : (
              <p className={`text-sm text-center py-8 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
                No rules have been set for this competition yet.
              </p>
            )
          }
        </div>
      )}

      {/* ── Language note ── */}
      <p className={`text-[11px] text-center mt-6 ${theme === 'dark' ? 'text-slate-700' : 'text-slate-400'}`}>
        Viewing rules in: {lang.toUpperCase()} · Changes save to the active language only
      </p>

    </div>
  )
}