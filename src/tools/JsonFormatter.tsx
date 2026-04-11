import { useState, useCallback, useRef, useEffect } from 'react'

interface Props {
  onCopy: (msg: string) => void
}

function highlightJson(raw: string): string {
  const out: string[] = []
  let i = 0
  while (i < raw.length) {
    const ch = raw[i]
    if (ch === '"') {
      const end = findStringEnd(raw, i)
      const str = escapeHtml(raw.slice(i, end))
      // Look ahead to see if this is a key (followed by ':')
      let j = end
      while (j < raw.length && raw[j] === ' ') j++
      if (raw[j] === ':') {
        out.push(`<span class="token-key">${str}</span>`)
      } else {
        out.push(`<span class="token-string">${str}</span>`)
      }
      i = end
    } else if (ch === '-' || (ch >= '0' && ch <= '9')) {
      let j = i
      if (raw[j] === '-') j++
      while (j < raw.length && ((raw[j] >= '0' && raw[j] <= '9') || raw[j] === '.' || raw[j] === 'e' || raw[j] === 'E' || raw[j] === '+' || raw[j] === '-') && !(raw[j] === '-' && j > i + 1 && raw[j-1] !== 'e' && raw[j-1] !== 'E')) j++
      out.push(`<span class="token-number">${raw.slice(i, j)}</span>`)
      i = j
    } else if (raw.startsWith('true', i)) {
      out.push(`<span class="token-bool">true</span>`)
      i += 4
    } else if (raw.startsWith('false', i)) {
      out.push(`<span class="token-bool">false</span>`)
      i += 5
    } else if (raw.startsWith('null', i)) {
      out.push(`<span class="token-null">null</span>`)
      i += 4
    } else if (ch === '{' || ch === '}' || ch === '[' || ch === ']') {
      out.push(`<span class="token-bracket">${ch}</span>`)
      i++
    } else if (ch === ',') {
      out.push(`<span class="token-comma">,</span>`)
      i++
    } else {
      out.push(ch)
      i++
    }
  }
  return out.join('')
}

function findStringEnd(s: string, start: number): number {
  let i = start + 1
  while (i < s.length) {
    if (s[i] === '\\') { i += 2; continue }
    if (s[i] === '"') return i + 1
    i++
  }
  return s.length
}

export function JsonFormatter({ onCopy }: Props) {
  const [input, setInput] = useState('')
  const [formatted, setFormatted] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [indentSize, setIndentSize] = useState(2)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const format = useCallback((raw: string, indent: number) => {
    if (!raw.trim()) {
      setFormatted('')
      setError(null)
      return
    }
    try {
      const parsed = JSON.parse(raw)
      const pretty = JSON.stringify(parsed, null, indent)
      setFormatted(pretty)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
      setFormatted('')
    }
  }, [])

  useEffect(() => {
    format(input, indentSize)
  }, [input, indentSize, format])

  const handleCopy = useCallback(() => {
    if (formatted) {
      navigator.clipboard.writeText(formatted)
      onCopy('Copied to clipboard')
    }
  }, [formatted, onCopy])

  const handlePaste = useCallback(() => {
    navigator.clipboard.readText().then(text => {
      setInput(text)
    })
  }, [])

  const handleClear = useCallback(() => {
    setInput('')
    setFormatted('')
    setError(null)
    textareaRef.current?.focus()
  }, [])

  const handleMinify = useCallback(() => {
    if (!input.trim()) return
    try {
      const parsed = JSON.parse(input)
      const minified = JSON.stringify(parsed)
      setFormatted(minified)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    }
  }, [input])

  return (
    <>
      {error && <div className="error-banner">✕ {error}</div>}
      <div className="formatter-grid">
        <div className="editor-area">
          <div className="editor-header">
            <div className="editor-title">
              <span className={`title-dot${input ? (error ? ' error' : ' active') : ''}`} />
              Input
            </div>
            <div className="editor-actions">
              <button className="btn btn-ghost" onClick={handlePaste}>
                Paste
              </button>
              <button className="btn btn-ghost" onClick={handleClear}>
                Clear
              </button>
            </div>
          </div>
          <div className="editor-body">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder='Paste your JSON here...  { "name": "value" }'
              spellCheck={false}
              autoFocus
            />
          </div>
        </div>

        <div className="editor-area">
          <div className="editor-header">
            <div className="editor-title">
              <span className={`title-dot${formatted ? ' active' : ''}`} />
              Output
            </div>
            <div className="editor-actions">
              <div className="lang-toggle">
                {[2, 4].map(n => (
                  <button
                    key={n}
                    className={indentSize === n ? 'active' : ''}
                    onClick={() => setIndentSize(n)}
                  >
                    {n}sp
                  </button>
                ))}
              </div>
              <button className="btn btn-ghost" onClick={handleMinify}>
                Minify
              </button>
              <button
                className={`btn ${formatted ? 'btn-primary' : 'btn-ghost'}`}
                onClick={handleCopy}
                disabled={!formatted}
              >
                Copy
              </button>
            </div>
          </div>
          <div className="editor-body">
            {formatted ? (
              <pre dangerouslySetInnerHTML={{ __html: highlightJson(formatted) }} />
            ) : (
              <div className="empty-state">
                <div className="empty-icon">{ }</div>
                <p>Formatted JSON will appear here</p>
                <p>Paste JSON on the left or press <kbd>Ctrl+V</kbd></p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
