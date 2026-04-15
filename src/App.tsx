import { useState, useEffect, useCallback } from 'react'
import './App.css'
import { JsonFormatter } from './tools/JsonFormatter'
import { DiffTool } from './tools/DiffTool'
import { JsonToClass } from './tools/JsonToClass'
import { JwtDecoder } from './tools/JwtDecoder'
import { Base64Tool } from './tools/Base64Tool'
import { RegexTester } from './tools/RegexTester'
import { SqlFormatter } from './tools/SqlFormatter'
import { UuidGenerator } from './tools/UuidGenerator'
import { AdUnit } from './components/AdUnit'

type Tool = 'formatter' | 'diff' | 'converter' | 'jwt' | 'base64' | 'regex' | 'sql' | 'uuid'

const tools: { id: Tool; label: string; icon: string; key: string; description: string }[] = [
  { id: 'formatter', label: 'JSON Format', icon: '{ }', key: '1', description: 'Parse, pretty-print with 2 or 4 space indentation, and minify JSON. Includes syntax highlighting for keys, strings, numbers, and booleans.' },
  { id: 'diff', label: 'Diff', icon: '< >', key: '2', description: 'Compare two texts side by side. See additions, deletions, and unchanged lines with a clear color-coded diff output.' },
  { id: 'converter', label: 'JSON → Class', icon: '⬡', key: '3', description: 'Convert JSON objects into TypeScript interfaces or Python dataclasses. Automatically infers types including nested objects and arrays.' },
  { id: 'jwt', label: 'JWT Decode', icon: '⚿', key: '4', description: 'Decode JSON Web Tokens to inspect the header, payload, and signature. Check expiration status at a glance.' },
  { id: 'base64', label: 'Base64', icon: '⇌', key: '5', description: 'Encode text to Base64 or decode Base64 strings back to plain text. Supports automatic image preview for Base64-encoded images.' },
  { id: 'regex', label: 'Regex', icon: '.*', key: '6', description: 'Write and test regular expressions with real-time highlighting of matches. View capture groups and toggle flags like global, case-insensitive, and multiline.' },
  { id: 'sql', label: 'SQL Format', icon: '⊞', key: '7', description: 'Format and beautify raw SQL queries. Adds proper indentation and keyword highlighting for better readability.' },
  { id: 'uuid', label: 'UUID', icon: '#', key: '8', description: 'Generate random v4 UUIDs in bulk. Click any UUID to copy it to your clipboard instantly.' },
]

function App() {
  const [activeTool, setActiveTool] = useState<Tool>('formatter')
  const [toast, setToast] = useState<string | null>(null)

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 1500)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return
      if (e.altKey || e.metaKey || e.ctrlKey) return
      const tool = tools.find(t => t.key === e.key)
      if (tool) {
        e.preventDefault()
        setActiveTool(tool.id)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const activeToolData = tools.find(t => t.id === activeTool)!

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <div className="logo-icon">⚒</div>
            <div className="logo-text">
              Dev<span>Forge</span>
            </div>
          </div>

          <nav className="tool-rack">
            {tools.map(tool => (
              <button
                key={tool.id}
                className={`tool-tab${activeTool === tool.id ? ' active' : ''}`}
                onClick={() => setActiveTool(tool.id)}
              >
                <span className="tab-icon">{tool.icon}</span>
                {tool.label}
                <span className="tab-key">{tool.key}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      <section className="hero">
        <div className="hero-inner">
          <h1>Free Online Developer Tools</h1>
          <p>
            DevForge is a free, open collection of browser-based tools for developers.
            Format JSON, compare text diffs, decode JWTs, encode Base64, test regex patterns,
            format SQL queries, and generate UUIDs — all without sending data to any server.
            Your data stays in your browser, always.
          </p>
        </div>
      </section>

      <main className="main">
        <div className="tool-description">
          <h2>{activeToolData.icon} {activeToolData.label}</h2>
          <p>{activeToolData.description}</p>
        </div>

        <div className="tool-panel" key={activeTool}>
          {activeTool === 'formatter' && <JsonFormatter onCopy={showToast} />}
          {activeTool === 'diff' && <DiffTool onCopy={showToast} />}
          {activeTool === 'converter' && <JsonToClass onCopy={showToast} />}
          {activeTool === 'jwt' && <JwtDecoder onCopy={showToast} />}
          {activeTool === 'base64' && <Base64Tool onCopy={showToast} />}
          {activeTool === 'regex' && <RegexTester onCopy={showToast} />}
          {activeTool === 'sql' && <SqlFormatter onCopy={showToast} />}
          {activeTool === 'uuid' && <UuidGenerator onCopy={showToast} />}
        </div>

        <div className="ad-bottom">
          <AdUnit slot="bottomDesktop" format="horizontal" />
        </div>
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-about">
            <h3>About DevForge</h3>
            <p>
              DevForge provides essential developer utilities that run entirely in your browser.
              No sign-up required, no data collection, no server-side processing. Built for developers
              who value speed, privacy, and simplicity in their daily workflow.
            </p>
          </div>
          <div className="footer-tools">
            <h3>Tools</h3>
            <ul>
              {tools.map(tool => (
                <li key={tool.id}>
                  <button onClick={() => setActiveTool(tool.id)}>
                    {tool.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} DevForge. All tools run client-side — your data never leaves your browser.</p>
          </div>
        </div>
      </footer>

      {toast && <div className="copied-toast">{toast}</div>}
    </div>
  )
}

export default App
