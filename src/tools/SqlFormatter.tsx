import { useState, useCallback, useMemo, useRef } from 'react'
import { format } from 'sql-formatter'

interface Props {
  onCopy: (msg: string) => void
}

type Dialect = 'sql' | 'mysql' | 'postgresql' | 'mariadb' | 'sqlite' | 'bigquery' | 'transactsql'

const dialects: { id: Dialect; label: string }[] = [
  { id: 'sql', label: 'Standard' },
  { id: 'mysql', label: 'MySQL' },
  { id: 'postgresql', label: 'PostgreSQL' },
  { id: 'mariadb', label: 'MariaDB' },
  { id: 'sqlite', label: 'SQLite' },
  { id: 'bigquery', label: 'BigQuery' },
  { id: 'transactsql', label: 'T-SQL' },
]

const SQL_KEYWORDS = new Set([
  'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'ON', 'AS', 'JOIN',
  'LEFT', 'RIGHT', 'INNER', 'OUTER', 'FULL', 'CROSS', 'INSERT', 'INTO', 'VALUES',
  'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE', 'ALTER', 'DROP', 'INDEX', 'VIEW',
  'GROUP', 'BY', 'ORDER', 'HAVING', 'LIMIT', 'OFFSET', 'UNION', 'ALL', 'DISTINCT',
  'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'EXISTS', 'BETWEEN', 'LIKE', 'IS', 'NULL',
  'TRUE', 'FALSE', 'ASC', 'DESC', 'WITH', 'RECURSIVE', 'IF', 'BEGIN', 'COMMIT',
  'ROLLBACK', 'GRANT', 'REVOKE', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES',
  'CONSTRAINT', 'DEFAULT', 'CHECK', 'UNIQUE', 'CASCADE', 'RESTRICT',
  'RETURNING', 'OVER', 'PARTITION', 'ROWS', 'RANGE', 'UNBOUNDED', 'PRECEDING',
  'FOLLOWING', 'CURRENT', 'ROW', 'FETCH', 'NEXT', 'ONLY', 'FIRST', 'LAST',
  'WINDOW', 'USING', 'NATURAL', 'EXCEPT', 'INTERSECT', 'LATERAL',
  'MATERIALIZED', 'TEMP', 'TEMPORARY', 'REPLACE', 'TRUNCATE', 'EXPLAIN',
  'ANALYZE', 'COPY', 'TO', 'DELIMITER', 'CSV', 'HEADER', 'ILIKE', 'SIMILAR',
  'ANY', 'SOME', 'FOR', 'LOCK', 'SHARE', 'NOWAIT', 'OF', 'FORCE', 'USE',
  'INT', 'INTEGER', 'BIGINT', 'SMALLINT', 'TINYINT', 'FLOAT', 'DOUBLE',
  'DECIMAL', 'NUMERIC', 'VARCHAR', 'CHAR', 'TEXT', 'BOOLEAN', 'BOOL',
  'DATE', 'TIME', 'TIMESTAMP', 'INTERVAL', 'SERIAL', 'BIGSERIAL',
  'JSON', 'JSONB', 'UUID', 'BYTEA', 'BLOB', 'CLOB', 'ENUM', 'ARRAY',
  'ADD', 'COLUMN', 'RENAME', 'TYPE', 'AFTER', 'BEFORE', 'TRIGGER',
  'FUNCTION', 'PROCEDURE', 'RETURNS', 'RETURN', 'DECLARE', 'VARIABLE',
  'WHILE', 'LOOP', 'REPEAT', 'UNTIL', 'DO', 'ELSEIF', 'LEAVE', 'CALL',
])

const SQL_FUNCTIONS = new Set([
  'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'COALESCE', 'NULLIF', 'CAST',
  'CONVERT', 'CONCAT', 'SUBSTRING', 'TRIM', 'UPPER', 'LOWER', 'NOW',
  'LENGTH', 'REPLACE', 'ROUND', 'FLOOR', 'CEIL', 'ABS', 'MOD',
  'EXTRACT', 'POSITION', 'OVERLAY', 'GREATEST', 'LEAST', 'ARRAY_AGG',
  'STRING_AGG', 'JSON_AGG', 'JSONB_AGG', 'ROW_NUMBER', 'RANK',
  'DENSE_RANK', 'LAG', 'LEAD', 'FIRST_VALUE', 'LAST_VALUE', 'NTH_VALUE',
  'NTILE', 'CUME_DIST', 'PERCENT_RANK', 'GENERATE_SERIES',
  'ARRAY_LENGTH', 'UNNEST', 'RANDOM', 'SETSEED',
  'TO_CHAR', 'TO_DATE', 'TO_TIMESTAMP', 'TO_NUMBER', 'DATE_TRUNC',
  'AGE', 'CURRENT_DATE', 'CURRENT_TIME', 'CURRENT_TIMESTAMP',
  'LOCALTIME', 'LOCALTIMESTAMP', 'YEAR', 'MONTH', 'DAY', 'HOUR',
  'MINUTE', 'SECOND', 'LEFT', 'RIGHT', 'LPAD', 'RPAD', 'REVERSE',
  'SPLIT_PART', 'REGEXP_REPLACE', 'REGEXP_MATCHES', 'FORMAT',
  'POWER', 'SQRT', 'LOG', 'LN', 'EXP', 'SIGN', 'TRUNC',
  'DATE_PART', 'DATE_ADD', 'DATE_SUB', 'DATEDIFF', 'TIMEDIFF',
  'IF', 'IIF', 'IFNULL', 'NVL', 'NVL2', 'DECODE',
  'GROUP_CONCAT', 'LISTAGG', 'PERCENTILE_CONT', 'PERCENTILE_DISC',
])

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function highlightSql(sql: string): string {
  const tokens: string[] = []
  let i = 0

  while (i < sql.length) {
    // Single-line comment
    if (sql[i] === '-' && sql[i + 1] === '-') {
      const end = sql.indexOf('\n', i)
      const slice = end === -1 ? sql.slice(i) : sql.slice(i, end)
      tokens.push(`<span class="sql-comment">${escapeHtml(slice)}</span>`)
      i += slice.length
      continue
    }

    // Multi-line comment
    if (sql[i] === '/' && sql[i + 1] === '*') {
      const end = sql.indexOf('*/', i + 2)
      const slice = end === -1 ? sql.slice(i) : sql.slice(i, end + 2)
      tokens.push(`<span class="sql-comment">${escapeHtml(slice)}</span>`)
      i += slice.length
      continue
    }

    // String literal
    if (sql[i] === "'") {
      let j = i + 1
      while (j < sql.length) {
        if (sql[j] === "'" && sql[j + 1] === "'") { j += 2; continue }
        if (sql[j] === "'") { j++; break }
        j++
      }
      tokens.push(`<span class="sql-string">${escapeHtml(sql.slice(i, j))}</span>`)
      i = j
      continue
    }

    // Number
    if (/\d/.test(sql[i]) && (i === 0 || /[\s,()=<>+\-*/\n]/.test(sql[i - 1]))) {
      let j = i
      while (j < sql.length && /[\d.]/.test(sql[j])) j++
      tokens.push(`<span class="sql-number">${sql.slice(i, j)}</span>`)
      i = j
      continue
    }

    // Word (keyword, function, or identifier)
    if (/[a-zA-Z_]/.test(sql[i])) {
      let j = i
      while (j < sql.length && /[a-zA-Z0-9_]/.test(sql[j])) j++
      const word = sql.slice(i, j)
      const upper = word.toUpperCase()

      if (SQL_KEYWORDS.has(upper)) {
        tokens.push(`<span class="sql-keyword">${escapeHtml(word)}</span>`)
      } else if (SQL_FUNCTIONS.has(upper)) {
        tokens.push(`<span class="sql-function">${escapeHtml(word)}</span>`)
      } else {
        tokens.push(escapeHtml(word))
      }
      i = j
      continue
    }

    tokens.push(escapeHtml(sql[i]))
    i++
  }

  return tokens.join('')
}

export function SqlFormatter({ onCopy }: Props) {
  const [input, setInput] = useState('')
  const [dialect, setDialect] = useState<Dialect>('sql')
  const [indentSize, setIndentSize] = useState(2)
  const [keywordCase, setKeywordCase] = useState<'upper' | 'lower' | 'capitalize'>('upper')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { formatted, error } = useMemo(() => {
    if (!input.trim()) return { formatted: '', error: null }
    try {
      let result = format(input, {
        language: dialect,
        tabWidth: indentSize,
        keywordCase: keywordCase === 'capitalize' ? 'upper' : keywordCase,
      })
      if (keywordCase === 'capitalize') {
        result = result.replace(/\b[A-Z][A-Z_]{1,}\b/g, word =>
          SQL_KEYWORDS.has(word) || SQL_FUNCTIONS.has(word)
            ? word.charAt(0) + word.slice(1).toLowerCase()
            : word
        )
      }
      return { formatted: result, error: null }
    } catch (e) {
      return { formatted: '', error: (e as Error).message }
    }
  }, [input, dialect, indentSize, keywordCase])

  const handleCopy = useCallback(() => {
    if (formatted) {
      navigator.clipboard.writeText(formatted)
      onCopy('Copied to clipboard')
    }
  }, [formatted, onCopy])

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
      <div className="sql-grid">
        <div className="editor-area">
          <div className="editor-header">
            <div className="editor-title">
              <span className={`title-dot${input ? (error ? ' error' : ' active') : ''}`} />
              SQL Input
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
              placeholder="Paste your SQL query here...  SELECT * FROM users WHERE id = 1"
              spellCheck={false}
              autoFocus
            />
          </div>
        </div>

        <div className="editor-area">
          <div className="editor-header">
            <div className="editor-title">
              <span className={`title-dot${formatted ? ' active' : ''}`} />
              Formatted
            </div>
            <div className="editor-actions">
              <select
                className="lang-select"
                value={dialect}
                onChange={e => setDialect(e.target.value as Dialect)}
                aria-label="SQL dialect"
              >
                {dialects.map(d => (
                  <option key={d.id} value={d.id}>{d.label}</option>
                ))}
              </select>
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
              <div className="lang-toggle">
                <button className={keywordCase === 'upper' ? 'active' : ''} onClick={() => setKeywordCase('upper')}>ABC</button>
                <button className={keywordCase === 'capitalize' ? 'active' : ''} onClick={() => setKeywordCase('capitalize')}>Abc</button>
                <button className={keywordCase === 'lower' ? 'active' : ''} onClick={() => setKeywordCase('lower')}>abc</button>
              </div>
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
              <pre dangerouslySetInnerHTML={{ __html: highlightSql(formatted) }} />
            ) : (
              <div className="empty-state">
                <div className="empty-icon">⊞</div>
                <p>Formatted SQL will appear here</p>
                <p>Paste a query on the left</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
