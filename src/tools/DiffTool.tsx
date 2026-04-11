import { useState, useCallback, useMemo } from 'react'
import { diffLines } from 'diff'

interface Props {
  onCopy: (msg: string) => void
}

export function DiffTool({ onCopy }: Props) {
  const [left, setLeft] = useState('')
  const [right, setRight] = useState('')

  const changes = useMemo(() => {
    if (!left && !right) return null
    return diffLines(left, right)
  }, [left, right])

  const stats = useMemo(() => {
    if (!changes) return { added: 0, removed: 0 }
    let added = 0
    let removed = 0
    for (const part of changes) {
      const lines = part.value.split('\n').filter(l => l !== '' || part.value === '\n').length
      if (part.value.endsWith('\n')) {
        const count = part.value.split('\n').length - 1
        if (part.added) added += count
        else if (part.removed) removed += count
      } else {
        if (part.added) added += lines
        else if (part.removed) removed += lines
      }
    }
    return { added, removed }
  }, [changes])

  const diffLines2 = useMemo(() => {
    if (!changes) return []
    const lines: { type: 'added' | 'removed' | 'unchanged'; content: string; num: number }[] = []
    let lineNum = 0

    for (const part of changes) {
      const partLines = part.value.split('\n')
      if (partLines[partLines.length - 1] === '') partLines.pop()

      for (const line of partLines) {
        lineNum++
        lines.push({
          type: part.added ? 'added' : part.removed ? 'removed' : 'unchanged',
          content: line,
          num: lineNum,
        })
      }
    }
    return lines
  }, [changes])

  const handleSwap = useCallback(() => {
    setLeft(right)
    setRight(left)
  }, [left, right])

  const handleClear = useCallback(() => {
    setLeft('')
    setRight('')
  }, [])

  const handleCopyDiff = useCallback(() => {
    if (!diffLines2.length) return
    const text = diffLines2
      .map(l => {
        const prefix = l.type === 'added' ? '+ ' : l.type === 'removed' ? '- ' : '  '
        return prefix + l.content
      })
      .join('\n')
    navigator.clipboard.writeText(text)
    onCopy('Diff copied')
  }, [diffLines2, onCopy])

  return (
    <>
      <div className="diff-inputs">
        <div className="editor-area">
          <div className="editor-header">
            <div className="editor-title">
              <span className={`title-dot${left ? ' active' : ''}`} />
              Original
            </div>
            <div className="editor-actions">
              <button className="btn btn-ghost" onClick={handleSwap}>
                ⇄ Swap
              </button>
            </div>
          </div>
          <div className="editor-body">
            <textarea
              value={left}
              onChange={e => setLeft(e.target.value)}
              placeholder="Paste original text or code..."
              spellCheck={false}
              autoFocus
            />
          </div>
        </div>

        <div className="editor-area">
          <div className="editor-header">
            <div className="editor-title">
              <span className={`title-dot${right ? ' active' : ''}`} />
              Modified
            </div>
            <div className="editor-actions">
              <button className="btn btn-ghost" onClick={handleClear}>
                Clear all
              </button>
            </div>
          </div>
          <div className="editor-body">
            <textarea
              value={right}
              onChange={e => setRight(e.target.value)}
              placeholder="Paste modified text or code..."
              spellCheck={false}
            />
          </div>
        </div>
      </div>

      <div className="diff-output editor-area">
        <div className="editor-header">
          <div className="editor-title">
            <span className={`title-dot${diffLines2.length ? ' active' : ''}`} />
            Differences
          </div>
          <div className="editor-actions">
            {diffLines2.length > 0 && (
              <div className="diff-stats">
                <span className="stat-add">+{stats.added}</span>
                <span className="stat-del">-{stats.removed}</span>
              </div>
            )}
            <button
              className={`btn ${diffLines2.length ? 'btn-primary' : 'btn-ghost'}`}
              onClick={handleCopyDiff}
              disabled={!diffLines2.length}
            >
              Copy diff
            </button>
          </div>
        </div>
        <div className="editor-body">
          {diffLines2.length > 0 ? (
            <div className="diff-result">
              {diffLines2.map((line, i) => (
                <div key={i} className={`diff-line ${line.type}`}>
                  <span className="line-num">{line.num}</span>
                  <span className="line-content">
                    {line.type === 'added' ? '+ ' : line.type === 'removed' ? '- ' : '  '}
                    {line.content}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state diff-empty">
              <div className="empty-icon">⇋</div>
              <p>Differences will appear here</p>
              <p>Paste text on both sides to compare</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
