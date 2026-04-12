import { useState, useCallback, useMemo } from 'react'

interface Props {
  onCopy: (msg: string) => void
}

type Version = 'v1' | 'v4' | 'v7'

function generateV4(): string {
  return crypto.randomUUID()
}

function generateV1(): string {
  const EPOCH_OFFSET = 122192928000000000n
  const now = BigInt(Date.now()) * 10000n + EPOCH_OFFSET
  const rand = crypto.getRandomValues(new Uint16Array(1))[0]

  const timeLow = Number(now & 0xFFFFFFFFn)
  const timeMid = Number((now >> 32n) & 0xFFFFn)
  const timeHi = Number((now >> 48n) & 0x0FFFn) | 0x1000
  const clockSeq = (rand & 0x3FFF) | 0x8000
  const node = crypto.getRandomValues(new Uint8Array(6))

  const hex = (n: number, len: number) => n.toString(16).padStart(len, '0')

  return [
    hex(timeLow, 8),
    hex(timeMid, 4),
    hex(timeHi, 4),
    hex(clockSeq, 4),
    Array.from(node).map(b => hex(b, 2)).join(''),
  ].join('-')
}

function generateV7(): string {
  const ts = BigInt(Date.now())
  const bytes = new Uint8Array(16)

  bytes[0] = Number((ts >> 40n) & 0xFFn)
  bytes[1] = Number((ts >> 32n) & 0xFFn)
  bytes[2] = Number((ts >> 24n) & 0xFFn)
  bytes[3] = Number((ts >> 16n) & 0xFFn)
  bytes[4] = Number((ts >> 8n) & 0xFFn)
  bytes[5] = Number(ts & 0xFFn)

  crypto.getRandomValues(bytes.subarray(6))
  bytes[6] = (bytes[6] & 0x0F) | 0x70
  bytes[8] = (bytes[8] & 0x3F) | 0x80

  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

const generators: Record<Version, () => string> = {
  v1: generateV1,
  v4: generateV4,
  v7: generateV7,
}

export function UuidGenerator({ onCopy }: Props) {
  const [version, setVersion] = useState<Version>('v4')
  const [count, setCount] = useState(5)
  const [uppercase, setUppercase] = useState(false)
  const [uuids, setUuids] = useState<string[]>(() =>
    Array.from({ length: 5 }, () => crypto.randomUUID())
  )

  const displayUuids = useMemo(() =>
    uppercase ? uuids.map(u => u.toUpperCase()) : uuids
  , [uuids, uppercase])

  const generate = useCallback(() => {
    const gen = generators[version]
    setUuids(Array.from({ length: count }, () => gen()))
  }, [version, count])

  const handleCopyOne = useCallback((uuid: string) => {
    navigator.clipboard.writeText(uuid)
    onCopy('UUID copied')
  }, [onCopy])

  const handleCopyAll = useCallback(() => {
    if (displayUuids.length === 0) return
    navigator.clipboard.writeText(displayUuids.join('\n'))
    onCopy(`${displayUuids.length} UUIDs copied`)
  }, [displayUuids, onCopy])

  const handleCountChange = useCallback((value: string) => {
    const n = parseInt(value, 10)
    if (!isNaN(n) && n >= 1 && n <= 500) setCount(n)
  }, [])

  return (
    <>
      <div className="uuid-controls">
        <div className="lang-toggle">
          {(['v1', 'v4', 'v7'] as Version[]).map(v => (
            <button key={v} className={version === v ? 'active' : ''} onClick={() => setVersion(v)}>
              {v.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="uuid-count-wrap">
          <label className="uuid-count-label">Qty</label>
          <input
            type="number"
            className="uuid-count-input"
            value={count}
            onChange={e => handleCountChange(e.target.value)}
            min={1}
            max={500}
          />
        </div>
        <div className="lang-toggle">
          <button className={!uppercase ? 'active' : ''} onClick={() => setUppercase(false)}>a-f</button>
          <button className={uppercase ? 'active' : ''} onClick={() => setUppercase(true)}>A-F</button>
        </div>
        <button className="btn btn-primary" onClick={generate}>Generate</button>
      </div>

      <div className="editor-area uuid-output">
        <div className="editor-header">
          <div className="editor-title">
            <span className={`title-dot${displayUuids.length > 0 ? ' active' : ''}`} />
            Generated UUIDs
            {displayUuids.length > 0 && <span className="uuid-version-badge">{version.toUpperCase()}</span>}
          </div>
          <div className="editor-actions">
            <button
              className={`btn ${displayUuids.length > 0 ? 'btn-primary' : 'btn-ghost'}`}
              onClick={handleCopyAll}
              disabled={displayUuids.length === 0}
            >
              Copy all
            </button>
          </div>
        </div>
        <div className="editor-body">
          {displayUuids.length > 0 ? (
            <div className="uuid-list">
              {displayUuids.map((uuid, i) => (
                <div key={i} className="uuid-row" onClick={() => handleCopyOne(uuid)}>
                  <span className="uuid-index">{i + 1}</span>
                  <span className="uuid-value">{uuid}</span>
                  <span className="uuid-copy-hint">Click to copy</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">#</div>
              <p>Generated UUIDs will appear here</p>
              <p>Select a version and click Generate</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
