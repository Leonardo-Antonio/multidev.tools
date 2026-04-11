import { useState, useCallback, useMemo, useRef } from 'react'

interface Props {
  onCopy: (msg: string) => void
}

type Lang = 'typescript' | 'python' | 'csharp' | 'java' | 'kotlin' | 'go' | 'rust' | 'cpp' | 'swift' | 'dart' | 'php' | 'c'

const languages: { id: Lang; label: string; desc: string }[] = [
  { id: 'typescript', label: 'TypeScript', desc: 'TypeScript interfaces' },
  { id: 'python', label: 'Python', desc: 'Python dataclasses' },
  { id: 'csharp', label: 'C#', desc: 'C# classes' },
  { id: 'java', label: 'Java', desc: 'Java classes' },
  { id: 'kotlin', label: 'Kotlin', desc: 'Kotlin data classes' },
  { id: 'go', label: 'Go', desc: 'Go structs' },
  { id: 'rust', label: 'Rust', desc: 'Rust structs' },
  { id: 'cpp', label: 'C++', desc: 'C++ structs' },
  { id: 'swift', label: 'Swift', desc: 'Swift structs' },
  { id: 'dart', label: 'Dart', desc: 'Dart classes' },
  { id: 'php', label: 'PHP', desc: 'PHP classes' },
  { id: 'c', label: 'C', desc: 'C structs' },
]

// ── Generator infrastructure ──

interface Field { key: string; type: string }

interface LangConfig {
  types: { string: string; int: string; float: string; bool: string; null: string; unknown: string }
  emptyArray: string
  array: (itemType: string) => string
  wrapClass: (name: string, fields: Field[]) => string
  header?: string
}

const configs: Record<Lang, LangConfig> = {
  typescript: {
    types: { string: 'string', int: 'number', float: 'number', bool: 'boolean', null: 'null', unknown: 'unknown' },
    emptyArray: 'unknown[]',
    array: t => `${t}[]`,
    wrapClass: (name, fields) => {
      const l = [`interface ${name} {`]
      for (const f of fields) l.push(`  ${f.key}: ${f.type};`)
      l.push('}')
      return l.join('\n')
    },
  },

  python: {
    types: { string: 'str', int: 'int', float: 'float', bool: 'bool', null: 'None', unknown: 'Any' },
    emptyArray: 'list',
    array: t => `list[${t}]`,
    header: 'from dataclasses import dataclass',
    wrapClass: (name, fields) => {
      const l = ['@dataclass', `class ${name}:`]
      if (fields.length === 0) l.push('    pass')
      else for (const f of fields) l.push(`    ${f.key}: ${f.type}`)
      return l.join('\n')
    },
  },

  csharp: {
    types: { string: 'string', int: 'int', float: 'double', bool: 'bool', null: 'object?', unknown: 'object' },
    emptyArray: 'List<object>',
    array: t => `List<${t}>`,
    wrapClass: (name, fields) => {
      const l = [`public class ${name}`, '{']
      for (const f of fields) l.push(`    public ${f.type} ${capitalize(f.key)} { get; set; }`)
      l.push('}')
      return l.join('\n')
    },
  },

  java: {
    types: { string: 'String', int: 'int', float: 'double', bool: 'boolean', null: 'Object', unknown: 'Object' },
    emptyArray: 'List<Object>',
    array: t => `List<${t}>`,
    wrapClass: (name, fields) => {
      const l = [`public class ${name} {`]
      for (const f of fields) l.push(`    public ${f.type} ${f.key};`)
      l.push('}')
      return l.join('\n')
    },
  },

  kotlin: {
    types: { string: 'String', int: 'Int', float: 'Double', bool: 'Boolean', null: 'Any?', unknown: 'Any' },
    emptyArray: 'List<Any>',
    array: t => `List<${t}>`,
    wrapClass: (name, fields) => {
      if (fields.length === 0) return `class ${name}`
      const l = [`data class ${name}(`]
      for (const f of fields) l.push(`    val ${f.key}: ${f.type},`)
      l.push(')')
      return l.join('\n')
    },
  },

  go: {
    types: { string: 'string', int: 'int', float: 'float64', bool: 'bool', null: 'any', unknown: 'any' },
    emptyArray: '[]any',
    array: t => `[]${t}`,
    wrapClass: (name, fields) => {
      const l = [`type ${name} struct {`]
      for (const f of fields) l.push(`\t${capitalize(f.key)} ${f.type} \`json:"${f.key}"\``)
      l.push('}')
      return l.join('\n')
    },
  },

  rust: {
    types: { string: 'String', int: 'i64', float: 'f64', bool: 'bool', null: 'Option<serde_json::Value>', unknown: 'serde_json::Value' },
    emptyArray: 'Vec<serde_json::Value>',
    array: t => `Vec<${t}>`,
    header: 'use serde::{Deserialize, Serialize};',
    wrapClass: (name, fields) => {
      const l = ['#[derive(Debug, Serialize, Deserialize)]', `pub struct ${name} {`]
      for (const f of fields) l.push(`    pub ${f.key}: ${f.type},`)
      l.push('}')
      return l.join('\n')
    },
  },

  cpp: {
    types: { string: 'std::string', int: 'int', float: 'double', bool: 'bool', null: 'std::nullptr_t', unknown: 'std::any' },
    emptyArray: 'std::vector<std::any>',
    array: t => `std::vector<${t}>`,
    wrapClass: (name, fields) => {
      const l = [`struct ${name} {`]
      for (const f of fields) l.push(`    ${f.type} ${f.key};`)
      l.push('};')
      return l.join('\n')
    },
  },

  swift: {
    types: { string: 'String', int: 'Int', float: 'Double', bool: 'Bool', null: 'Any?', unknown: 'Any' },
    emptyArray: '[Any]',
    array: t => `[${t}]`,
    wrapClass: (name, fields) => {
      const l = [`struct ${name}: Codable {`]
      for (const f of fields) l.push(`    let ${f.key}: ${f.type}`)
      l.push('}')
      return l.join('\n')
    },
  },

  dart: {
    types: { string: 'String', int: 'int', float: 'double', bool: 'bool', null: 'dynamic', unknown: 'dynamic' },
    emptyArray: 'List<dynamic>',
    array: t => `List<${t}>`,
    wrapClass: (name, fields) => {
      const l = [`class ${name} {`]
      for (const f of fields) l.push(`  final ${f.type} ${f.key};`)
      if (fields.length > 0) {
        l.push('')
        l.push(`  ${name}({`)
        for (const f of fields) l.push(`    required this.${f.key},`)
        l.push('  });')
      }
      l.push('}')
      return l.join('\n')
    },
  },

  php: {
    types: { string: 'string', int: 'int', float: 'float', bool: 'bool', null: 'mixed', unknown: 'mixed' },
    emptyArray: 'array',
    array: () => 'array',
    wrapClass: (name, fields) => {
      const l = [`class ${name}`, '{']
      for (const f of fields) l.push(`    public ${f.type} $${f.key};`)
      l.push('}')
      return l.join('\n')
    },
  },

  c: {
    types: { string: 'char*', int: 'int', float: 'double', bool: 'bool', null: 'void*', unknown: 'void*' },
    emptyArray: 'void*',
    array: t => `${t}*`,
    wrapClass: (name, fields) => {
      const l = ['typedef struct {']
      for (const f of fields) l.push(`    ${f.type} ${f.key};`)
      l.push(`} ${name};`)
      return l.join('\n')
    },
  },
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function singularize(s: string): string {
  if (s.endsWith('ies')) return s.slice(0, -3) + 'y'
  if (s.endsWith('ses')) return s.slice(0, -2)
  if (s.endsWith('s') && !s.endsWith('ss')) return s.slice(0, -1)
  return s
}

function inferType(value: unknown, key: string, config: LangConfig, classes: Map<string, string>): string {
  if (value === null) return config.types.null
  if (Array.isArray(value)) {
    if (value.length === 0) return config.emptyArray
    return config.array(inferType(value[0], singularize(key), config, classes))
  }
  if (typeof value === 'object') {
    const name = capitalize(key)
    buildClass(value as Record<string, unknown>, name, config, classes)
    return name
  }
  if (typeof value === 'number') return Number.isInteger(value) ? config.types.int : config.types.float
  if (typeof value === 'boolean') return config.types.bool
  if (typeof value === 'string') return config.types.string
  return config.types.unknown
}

function buildClass(obj: Record<string, unknown>, name: string, config: LangConfig, classes: Map<string, string>): void {
  const fields: Field[] = []
  for (const [key, value] of Object.entries(obj)) {
    fields.push({ key, type: inferType(value, key, config, classes) })
  }
  classes.set(name, config.wrapClass(name, fields))
}

function generate(data: unknown, rootName: string, lang: Lang): string {
  const config = configs[lang]
  const classes = new Map<string, string>()

  if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
    buildClass(data as Record<string, unknown>, rootName, config, classes)
  } else if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
    buildClass(data[0] as Record<string, unknown>, rootName, config, classes)
  } else {
    if (lang === 'python') return `# Type: ${typeof data}`
    return `// Type: ${typeof data}`
  }

  const parts: string[] = []
  if (config.header) parts.push(config.header)
  for (const [, code] of classes) parts.push(code)
  return parts.join('\n\n').trimEnd()
}

// ── Syntax highlighting ──

const hlKeywords: Record<Lang, string[]> = {
  typescript: ['interface', 'type', 'extends', 'export', 'import', 'from', 'const', 'let'],
  python: ['from', 'import', 'class', 'def', 'return', 'pass', 'True', 'False'],
  csharp: ['public', 'private', 'class', 'struct', 'get', 'set', 'using', 'namespace', 'new', 'return'],
  java: ['public', 'private', 'class', 'static', 'new', 'import', 'return', 'final'],
  kotlin: ['data', 'class', 'val', 'var', 'fun', 'return', 'import'],
  go: ['type', 'struct', 'func', 'package', 'import', 'var', 'const', 'return'],
  rust: ['pub', 'struct', 'enum', 'fn', 'let', 'mut', 'use', 'impl', 'mod', 'return'],
  cpp: ['struct', 'class', 'public', 'private', 'void', 'return', 'namespace', 'using', 'const'],
  swift: ['struct', 'class', 'let', 'var', 'func', 'import', 'return', 'protocol'],
  dart: ['class', 'final', 'void', 'return', 'import', 'required', 'this', 'factory'],
  php: ['class', 'public', 'private', 'function', 'return', 'use', 'namespace'],
  c: ['typedef', 'struct', 'void', 'return', 'const', 'extern', 'sizeof'],
}

const hlTypes: Record<Lang, string[]> = {
  typescript: ['string', 'number', 'boolean', 'null', 'unknown', 'any', 'void', 'never', 'undefined'],
  python: ['str', 'int', 'float', 'bool', 'list', 'dict', 'Any', 'Optional', 'None'],
  csharp: ['string', 'int', 'double', 'bool', 'float', 'long', 'object', 'List'],
  java: ['String', 'int', 'double', 'boolean', 'float', 'long', 'Object', 'List'],
  kotlin: ['String', 'Int', 'Double', 'Boolean', 'Float', 'Long', 'Any', 'List'],
  go: ['string', 'int', 'float64', 'bool', 'byte', 'error', 'any'],
  rust: ['String', 'i64', 'f64', 'bool', 'Vec', 'Option', 'Result'],
  cpp: ['int', 'double', 'float', 'bool'],
  swift: ['String', 'Int', 'Double', 'Bool', 'Float', 'Array', 'Any', 'Codable'],
  dart: ['String', 'int', 'double', 'bool', 'List', 'Map', 'dynamic'],
  php: ['string', 'int', 'float', 'bool', 'array', 'mixed', 'null'],
  c: ['int', 'double', 'float', 'char', 'long', 'short', 'bool', 'size_t'],
}

function highlightCode(code: string, lang: Lang): string {
  let r = code

  // Keywords first (before decorators to avoid matching `class` inside HTML attributes)
  const kw = hlKeywords[lang]
  if (kw.length) r = r.replace(new RegExp(`\\b(${kw.join('|')})\\b`, 'g'), '<span class="code-keyword">$1</span>')

  // Types
  const tp = hlTypes[lang]
  if (tp.length) r = r.replace(new RegExp(`\\b(${tp.join('|')})\\b`, 'g'), '<span class="code-type">$1</span>')

  // Decorators / attributes (after keywords so `class` in `@dataclass` isn't affected)
  if (lang === 'python') r = r.replace(/(@\w+)/g, '<span class="code-decorator">$1</span>')
  if (lang === 'rust') r = r.replace(/(#\[.*?\])/g, '<span class="code-decorator">$1</span>')

  // Go struct tags
  if (lang === 'go') r = r.replace(/(`[^`]*`)/g, '<span class="code-decorator">$1</span>')

  // PHP variables
  if (lang === 'php') r = r.replace(/(\$\w+)/g, '<span class="code-name">$1</span>')

  return r
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// ── Component ──

export function JsonToClass({ onCopy }: Props) {
  const [input, setInput] = useState('')
  const [lang, setLang] = useState<Lang>('typescript')
  const [rootName, setRootName] = useState('Root')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const currentLang = languages.find(l => l.id === lang)!

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: '', error: null }
    try {
      const parsed = JSON.parse(input)
      return { output: generate(parsed, rootName, lang), error: null }
    } catch (e) {
      return { output: '', error: (e as Error).message }
    }
  }, [input, lang, rootName])

  const handleCopy = useCallback(() => {
    if (output) {
      navigator.clipboard.writeText(output)
      onCopy('Copied to clipboard')
    }
  }, [output, onCopy])

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
      <div className="converter-grid">
        <div className="editor-area">
          <div className="editor-header">
            <div className="editor-title">
              <span className={`title-dot${input ? (error ? ' error' : ' active') : ''}`} />
              JSON Input
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
              placeholder='{ "user": { "name": "Leo", "age": 25 } }'
              spellCheck={false}
              autoFocus
            />
          </div>
        </div>

        <div className="editor-area">
          <div className="editor-header">
            <div className="editor-title">
              <span className={`title-dot${output ? ' active' : ''}`} />
              {currentLang.label} Output
            </div>
            <div className="editor-actions">
              <input
                type="text"
                value={rootName}
                onChange={e => setRootName(e.target.value || 'Root')}
                style={{
                  width: 80,
                  background: 'var(--surface-100)',
                  border: '1px solid var(--edge)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '2px 8px',
                  color: 'var(--ink-primary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-xs)',
                  height: 28,
                }}
                placeholder="ClassName"
              />
              <select
                className="lang-select"
                value={lang}
                onChange={e => setLang(e.target.value as Lang)}
                aria-label="Target language"
              >
                {languages.map(l => (
                  <option key={l.id} value={l.id}>{l.label}</option>
                ))}
              </select>
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
            {output ? (
              <pre dangerouslySetInnerHTML={{ __html: highlightCode(escapeHtml(output), lang) }} />
            ) : (
              <div className="empty-state">
                <div className="empty-icon">⬡</div>
                <p>{currentLang.desc} will appear here</p>
                <p>Paste a JSON object on the left</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
