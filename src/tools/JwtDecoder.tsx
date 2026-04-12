import { useState, useCallback, useMemo, useRef } from 'react'

interface Props {
  onCopy: (msg: string) => void
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const pad = base64.length % 4
  if (pad) base64 += '='.repeat(4 - pad)
  const binary = atob(base64)
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

interface DecodedJwt {
  header: Record<string, unknown>
  payload: Record<string, unknown>
  signature: string
}

function decodeJwt(token: string): DecodedJwt | null {
  const parts = token.trim().split('.')
  if (parts.length !== 3) return null
  try {
    const header = JSON.parse(base64UrlDecode(parts[0]))
    const payload = JSON.parse(base64UrlDecode(parts[1]))
    return { header, payload, signature: parts[2] }
  } catch {
    return null
  }
}

function getExpiry(payload: Record<string, unknown>): { label: string; status: 'valid' | 'expired' | 'none' } {
  if (typeof payload.exp !== 'number') return { label: 'No expiration claim', status: 'none' }
  const expDate = new Date(payload.exp * 1000)
  const now = new Date()
  if (expDate < now) {
    return { label: `Expired: ${expDate.toLocaleString()}`, status: 'expired' }
  }
  return { label: `Expires: ${expDate.toLocaleString()}`, status: 'valid' }
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
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

function highlightJson(raw: string): string {
  const out: string[] = []
  let i = 0
  while (i < raw.length) {
    const ch = raw[i]
    if (ch === '"') {
      const end = findStringEnd(raw, i)
      const str = escapeHtml(raw.slice(i, end))
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
      while (j < raw.length && ((raw[j] >= '0' && raw[j] <= '9') || raw[j] === '.' || raw[j] === 'e' || raw[j] === 'E' || raw[j] === '+' || raw[j] === '-') && !(raw[j] === '-' && j > i + 1 && raw[j - 1] !== 'e' && raw[j - 1] !== 'E')) j++
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

export function JwtDecoder({ onCopy }: Props) {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { decoded, error } = useMemo(() => {
    const trimmed = input.trim()
    if (!trimmed) return { decoded: null, error: null }
    const result = decodeJwt(trimmed)
    if (!result) return { decoded: null, error: 'Invalid JWT token' }
    return { decoded: result, error: null }
  }, [input])

  const expiry = useMemo(() => {
    if (!decoded) return null
    return getExpiry(decoded.payload)
  }, [decoded])

  const handleCopy = useCallback((section: 'header' | 'payload') => {
    if (!decoded) return
    const json = JSON.stringify(decoded[section], null, 2)
    navigator.clipboard.writeText(json)
    onCopy(`${section.charAt(0).toUpperCase() + section.slice(1)} copied`)
  }, [decoded, onCopy])

  const handlePaste = useCallback(() => {
    navigator.clipboard.readText().then(text => setInput(text))
  }, [])

  const handleClear = useCallback(() => {
    setInput('')
    textareaRef.current?.focus()
  }, [])

  return (
    <>
      {error && <div className="error-banner">✕ {error}</div>}
      <div className="jwt-grid">
        <div className="editor-area">
          <div className="editor-header">
            <div className="editor-title">
              <span className={`title-dot${input ? (error ? ' error' : decoded ? ' active' : '') : ''}`} />
              JWT Token
            </div>
            <div className="editor-actions">
              <button className="btn btn-ghost" onClick={handlePaste}>Paste</button>
              <button className="btn btn-ghost" onClick={handleClear}>Clear</button>
            </div>
          </div>
          <div className="editor-body">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Paste your JWT token here...  eyJhbGci..."
              spellCheck={false}
              autoFocus
            />
          </div>
        </div>

        <div className="editor-area">
          <div className="editor-header">
            <div className="editor-title">
              <span className={`title-dot${decoded ? ' active' : ''}`} />
              Decoded
            </div>
          </div>
          <div className="editor-body">
            {decoded ? (
              <div className="jwt-sections">
                {expiry && (
                  <div className={`jwt-expiry jwt-expiry--${expiry.status}`}>
                    {expiry.status === 'expired' ? '✕' : expiry.status === 'valid' ? '✓' : '○'} {expiry.label}
                  </div>
                )}
                <div className="jwt-section">
                  <div className="jwt-section-header">
                    <span className="jwt-section-label">HEADER</span>
                    <button className="btn btn-ghost" onClick={() => handleCopy('header')}>Copy</button>
                  </div>
                  <pre dangerouslySetInnerHTML={{ __html: highlightJson(JSON.stringify(decoded.header, null, 2)) }} />
                </div>
                <div className="jwt-section">
                  <div className="jwt-section-header">
                    <span className="jwt-section-label">PAYLOAD</span>
                    <button className="btn btn-ghost" onClick={() => handleCopy('payload')}>Copy</button>
                  </div>
                  <pre dangerouslySetInnerHTML={{ __html: highlightJson(JSON.stringify(decoded.payload, null, 2)) }} />
                </div>
                <div className="jwt-section">
                  <div className="jwt-section-header">
                    <span className="jwt-section-label">SIGNATURE</span>
                  </div>
                  <pre className="jwt-signature">{decoded.signature}</pre>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">⚿</div>
                <p>Decoded JWT will appear here</p>
                <p>Paste a token on the left to decode</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
