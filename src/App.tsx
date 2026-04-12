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

const tools: { id: Tool; label: string; icon: string; key: string }[] = [
  { id: 'formatter', label: 'JSON Format', icon: '{ }', key: '1' },
  { id: 'diff', label: 'Diff', icon: '< >', key: '2' },
  { id: 'converter', label: 'JSON → Class', icon: '⬡', key: '3' },
  { id: 'jwt', label: 'JWT Decode', icon: '⚿', key: '4' },
  { id: 'base64', label: 'Base64', icon: '⇌', key: '5' },
  { id: 'regex', label: 'Regex', icon: '.*', key: '6' },
  { id: 'sql', label: 'SQL Format', icon: '⊞', key: '7' },
  { id: 'uuid', label: 'UUID', icon: '#', key: '8' },
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

      <div className="app-body">
        <aside className="ad-sidebar ad-sidebar--left">
          <AdUnit slot="sidebarLeft" format="vertical" />
        </aside>

        <main className="main">
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

          <div className="ad-bottom-desktop">
            <AdUnit slot="bottomDesktop" format="horizontal" />
          </div>
        </main>

        <aside className="ad-sidebar ad-sidebar--right">
          <AdUnit slot="sidebarRight" format="vertical" />
        </aside>
      </div>

      <div className="ad-bottom-mobile">
        <AdUnit slot="bottomMobile" format="horizontal" />
      </div>

      {toast && <div className="copied-toast">{toast}</div>}
    </div>
  )
}

export default App
