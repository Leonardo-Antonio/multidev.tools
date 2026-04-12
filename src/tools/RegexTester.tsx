import { useState, useMemo, useCallback } from 'react'

interface Props {
  onCopy: (msg: string) => void
}

interface MatchInfo {
  full: string
  index: number
  groups: string[]
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function buildHighlightedHtml(text: string, matches: MatchInfo[]): string {
  if (matches.length === 0) return escapeHtml(text)

  const result: string[] = []
  let lastIndex = 0

  for (const match of matches) {
    if (match.index > lastIndex) {
      result.push(escapeHtml(text.slice(lastIndex, match.index)))
    }
    result.push(`<mark class="regex-match">${escapeHtml(match.full)}</mark>`)
    lastIndex = match.index + match.full.length
  }

  if (lastIndex < text.length) {
    result.push(escapeHtml(text.slice(lastIndex)))
  }

  return result.join('')
}

export function RegexTester({ onCopy }: Props) {
  const [pattern, setPattern] = useState('')
  const [flags, setFlags] = useState('g')
  const [testString, setTestString] = useState('')

  const toggleFlag = useCallback((flag: string) => {
    setFlags(prev => prev.includes(flag) ? prev.replace(flag, '') : prev + flag)
  }, [])

  const { matches, error, highlightedHtml } = useMemo(() => {
    if (!pattern || !testString) {
      return { matches: [], error: null, highlightedHtml: escapeHtml(testString) }
    }

    try {
      const regex = new RegExp(pattern, flags)
      const results: MatchInfo[] = []

      if (flags.includes('g')) {
        let match: RegExpExecArray | null
        let safety = 0
        while ((match = regex.exec(testString)) !== null && safety < 10000) {
          results.push({
            full: match[0],
            index: match.index,
            groups: match.slice(1),
          })
          if (match[0].length === 0) regex.lastIndex++
          safety++
        }
      } else {
        const match = regex.exec(testString)
        if (match) {
          results.push({
            full: match[0],
            index: match.index,
            groups: match.slice(1),
          })
        }
      }

      return {
        matches: results,
        error: null,
        highlightedHtml: buildHighlightedHtml(testString, results),
      }
    } catch (e) {
      return {
        matches: [],
        error: (e as Error).message,
        highlightedHtml: escapeHtml(testString),
      }
    }
  }, [pattern, flags, testString])

  const handleCopyMatches = useCallback(() => {
    if (matches.length === 0) return
    const text = matches.map(m => m.full).join('\n')
    navigator.clipboard.writeText(text)
    onCopy(`${matches.length} match${matches.length === 1 ? '' : 'es'} copied`)
  }, [matches, onCopy])

  const hasResult = pattern && testString && !error
  const isSuccess = hasResult && matches.length > 0
  const isNoMatch = hasResult && matches.length === 0
  const statusClass = error ? 'error' : isSuccess ? 'success' : isNoMatch ? 'no-match' : ''

  return (
    <>
      {error && <div className="error-banner">✕ {error}</div>}
      <div className="regex-bar">
        <div className={`regex-input-wrap${statusClass ? ` regex-input-wrap--${statusClass}` : ''}`}>
          <span className="regex-slash">/</span>
          <input
            type="text"
            className="regex-input"
            value={pattern}
            onChange={e => setPattern(e.target.value)}
            placeholder="Enter regex pattern..."
            spellCheck={false}
            autoFocus
          />
          <span className="regex-slash">/</span>
        </div>
        <div className="regex-flags">
          {['g', 'i', 'm', 's'].map(f => (
            <button
              key={f}
              className={`regex-flag${flags.includes(f) ? ' active' : ''}`}
              onClick={() => toggleFlag(f)}
            >
              {f}
            </button>
          ))}
        </div>
        {pattern && testString && (
          <div className={`regex-status-badge${isSuccess ? ' regex-status-badge--success' : ' regex-status-badge--fail'}`}>
            {isSuccess ? `✓ ${matches.length} match${matches.length !== 1 ? 'es' : ''}` : '✕ No matches'}
          </div>
        )}
      </div>

      <div className="regex-grid">
        <div className="editor-area">
          <div className="editor-header">
            <div className="editor-title">
              <span className={`title-dot${testString ? ' active' : ''}`} />
              Test String
            </div>
          </div>
          <div className="editor-body">
            <textarea
              value={testString}
              onChange={e => setTestString(e.target.value)}
              placeholder="Type or paste your test string here..."
              spellCheck={false}
            />
          </div>
        </div>

        <div className="editor-area">
          <div className="editor-header">
            <div className="editor-title">
              <span className={`title-dot${isSuccess ? ' active' : isNoMatch ? ' error' : ''}`} />
              Matches
            </div>
            <div className="editor-actions">
              <button
                className={`btn ${matches.length > 0 ? 'btn-primary' : 'btn-ghost'}`}
                onClick={handleCopyMatches}
                disabled={matches.length === 0}
              >
                Copy matches
              </button>
            </div>
          </div>
          <div className="editor-body">
            {isNoMatch ? (
              <div className="empty-state regex-no-match">
                <div className="empty-icon">✕</div>
                <p>No matches found</p>
                <p>Pattern <code>/{pattern}/{flags}</code> did not match</p>
              </div>
            ) : testString ? (
              <div className="regex-output">
                <pre className="regex-highlighted" dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
                {matches.length > 0 && matches.some(m => m.groups.length > 0) && (
                  <div className="regex-groups">
                    <div className="regex-groups-title">Capture Groups</div>
                    {matches.map((m, i) => (
                      <div key={i} className="regex-group-item">
                        <span className="regex-group-index">Match {i + 1}:</span>
                        <span className="regex-group-value">{m.full}</span>
                        {m.groups.map((g, gi) => (
                          <span key={gi} className="regex-group-capture">
                            Group {gi + 1}: {g ?? 'undefined'}
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">.*</div>
                <p>Match results will appear here</p>
                <p>Enter a pattern and test string</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
