import { useState, useCallback, useRef } from 'react'

interface Props {
  onCopy: (msg: string) => void
}

type Mode = 'encode' | 'decode'

function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary)
}

function base64ToUtf8(str: string): string {
  const binary = atob(str)
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

function detectMimeFromDataUrl(dataUrl: string): string {
  const match = dataUrl.match(/^data:([^;,]+)/)
  return match ? match[1] : 'unknown'
}

function formatLabel(mime: string): string {
  if (mime.startsWith('image/')) return `Image (${mime.split('/')[1].toUpperCase()})`
  if (mime.startsWith('video/')) return `Video (${mime.split('/')[1].toUpperCase()})`
  if (mime.startsWith('audio/')) return `Audio (${mime.split('/')[1].toUpperCase()})`
  if (mime === 'application/pdf') return 'PDF'
  if (mime === 'application/json') return 'JSON'
  if (mime.startsWith('text/')) return `Text (${mime.split('/')[1]})`
  return mime
}

export function Base64Tool({ onCopy }: Props) {
  const [mode, setMode] = useState<Mode>('encode')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [format, setFormat] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const processInput = useCallback((text: string, m: Mode) => {
    setImagePreview(null)
    setFormat(null)
    if (!text.trim()) {
      setOutput('')
      setError(null)
      return
    }
    try {
      if (m === 'encode') {
        setOutput(utf8ToBase64(text))
        setFormat('UTF-8 Text')
      } else {
        const trimmed = text.trim()
        if (trimmed.startsWith('data:')) {
          const mime = detectMimeFromDataUrl(trimmed)
          setFormat(formatLabel(mime))
          if (mime.startsWith('image/')) {
            setImagePreview(trimmed)
          }
          setOutput(trimmed)
        } else {
          setOutput(base64ToUtf8(trimmed))
          setFormat('UTF-8 Text')
        }
      }
      setError(null)
    } catch {
      setError(m === 'encode' ? 'Failed to encode' : 'Invalid Base64 string')
      setOutput('')
      setFormat(null)
    }
  }, [])

  const handleInputChange = useCallback((text: string) => {
    setInput(text)
    processInput(text, mode)
  }, [mode, processInput])

  const handleModeChange = useCallback((m: Mode) => {
    setMode(m)
    setInput('')
    setOutput('')
    setError(null)
    setImagePreview(null)
    setFormat(null)
    textareaRef.current?.focus()
  }, [])

  const handleCopy = useCallback(() => {
    if (output) {
      navigator.clipboard.writeText(output)
      onCopy('Copied to clipboard')
    }
  }, [output, onCopy])

  const handlePaste = useCallback(() => {
    navigator.clipboard.readText().then(text => {
      setInput(text)
      processInput(text, mode)
    })
  }, [mode, processInput])

  const handleClear = useCallback(() => {
    setInput('')
    setOutput('')
    setError(null)
    setImagePreview(null)
    setFormat(null)
    textareaRef.current?.focus()
  }, [])

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setInput('')
      setOutput(result)
      setError(null)
      setImagePreview(file.type.startsWith('image/') ? result : null)
      setFormat(file.type ? formatLabel(file.type) : 'File')
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }, [])

  return (
    <>
      {error && <div className="error-banner">✕ {error}</div>}
      <div className="base64-grid">
        <div className="editor-area">
          <div className="editor-header">
            <div className="editor-title">
              <span className={`title-dot${input ? (error ? ' error' : ' active') : ''}`} />
              Input
            </div>
            <div className="editor-actions">
              <div className="lang-toggle">
                <button className={mode === 'encode' ? 'active' : ''} onClick={() => handleModeChange('encode')}>Encode</button>
                <button className={mode === 'decode' ? 'active' : ''} onClick={() => handleModeChange('decode')}>Decode</button>
              </div>
              <button className="btn btn-ghost" onClick={handlePaste}>Paste</button>
              {mode === 'encode' && (
                <>
                  <button className="btn btn-ghost" onClick={() => fileRef.current?.click()}>File</button>
                  <input ref={fileRef} type="file" onChange={handleFile} style={{ display: 'none' }} />
                </>
              )}
              <button className="btn btn-ghost" onClick={handleClear}>Clear</button>
            </div>
          </div>
          <div className="editor-body">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => handleInputChange(e.target.value)}
              placeholder={mode === 'encode' ? 'Type or paste text to encode...' : 'Paste Base64 string to decode...'}
              spellCheck={false}
              autoFocus
            />
          </div>
        </div>

        <div className="editor-area">
          <div className="editor-header">
            <div className="editor-title">
              <span className={`title-dot${output ? ' active' : ''}`} />
              {mode === 'encode' ? 'Base64 Output' : 'Decoded Output'}
              {format && <span className="base64-format-badge">{format}</span>}
            </div>
            <div className="editor-actions">
              <button
                className={`btn ${output ? 'btn-primary' : 'btn-ghost'}`}
                onClick={handleCopy}
                disabled={!output}
              >
                Copy
              </button>
            </div>
          </div>
          <div className="editor-body">
            {imagePreview ? (
              <div className="base64-image-preview">
                <img src={imagePreview} alt="Preview" />
              </div>
            ) : output ? (
              <pre className="base64-output">{output}</pre>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">⇌</div>
                <p>{mode === 'encode' ? 'Base64 output' : 'Decoded text'} will appear here</p>
                <p>{mode === 'encode' ? 'Type text or upload a file' : 'Paste a Base64 string'} on the left</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
