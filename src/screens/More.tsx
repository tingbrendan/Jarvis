import { useState } from 'react'
import { useIdeasStore, useHabitsStore, useChatStore, useSettingsStore, useTasksStore, todayISO } from '../store'
import { Sheet } from '../components/Sheet'
import { showToast } from '../components/Toast'

type SubView = 'ideas' | 'track' | 'review' | 'ai' | 'settings' | null

export function More() {
  const [sub, setSub] = useState<SubView>(null)

  return (
    <div className="screen">
      <div className="screen-inner fade-up" style={{ paddingTop: 'calc(var(--safe-top) + 16px)' }}>
        <h1 style={{ marginBottom: 20 }}>More</h1>

        {[
          { id: 'ideas' as SubView, icon: '💡', label: 'Ideas', desc: 'Side project ideas' },
          { id: 'track' as SubView, icon: '📊', label: 'Track', desc: 'Fitness & time log' },
          { id: 'review' as SubView, icon: '📈', label: 'Review', desc: 'Weekly analytics' },
          { id: 'ai' as SubView, icon: '🤖', label: 'AI Chat', desc: 'Chat with Claude' },
          { id: 'settings' as SubView, icon: '⚙️', label: 'Settings', desc: 'API key, PIN, modules' },
        ].map((item) => (
          <button key={item.id} onClick={() => setSub(item.id)} className="card" style={{
            width: '100%', textAlign: 'left', cursor: 'pointer', marginBottom: 8,
            display: 'flex', alignItems: 'center', gap: 14, border: '1px solid var(--border)',
          }}>
            <span style={{ fontSize: '1.6rem', flexShrink: 0 }}>{item.icon}</span>
            <div>
              <div style={{ fontWeight: 600 }}>{item.label}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--t3)', marginTop: 2 }}>{item.desc}</div>
            </div>
            <span style={{ marginLeft: 'auto', color: 'var(--t3)' }}>›</span>
          </button>
        ))}
      </div>

      <Sheet open={sub === 'ideas'} onClose={() => setSub(null)} title="Ideas" height="90vh">
        <IdeasView />
      </Sheet>
      <Sheet open={sub === 'track'} onClose={() => setSub(null)} title="Track" height="90vh">
        <TrackView />
      </Sheet>
      <Sheet open={sub === 'review'} onClose={() => setSub(null)} title="Weekly Review" height="90vh">
        <ReviewView />
      </Sheet>
      <Sheet open={sub === 'ai'} onClose={() => setSub(null)} title="AI Chat" height="95vh">
        <AiView />
      </Sheet>
      <Sheet open={sub === 'settings'} onClose={() => setSub(null)} title="Settings" height="90vh">
        <SettingsView />
      </Sheet>
    </div>
  )
}

// ─── Ideas ────────────────────────────────────────────────────────────────────

function IdeasView() {
  const { ideas, addIdea, deleteIdea } = useIdeasStore()
  const [text, setText] = useState('')
  const [exc, setExc] = useState(3)

  return (
    <div className="col">
      <textarea value={text} onChange={(e) => setText(e.target.value)}
        placeholder="Describe your idea…" style={{ minHeight: 80 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ color: 'var(--t3)', fontSize: '0.8rem' }}>Excitement:</span>
        {[1,2,3,4,5].map((n) => (
          <button key={n} onClick={() => setExc(n)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '1.2rem', opacity: n <= exc ? 1 : 0.25, padding: 2,
          }}>⚡</button>
        ))}
      </div>
      <button className="btn btn-primary" onClick={() => {
        if (!text.trim()) return
        addIdea({ text, excitement: exc as 1|2|3|4|5 })
        setText(''); setExc(3); showToast('💡 Idea captured')
      }}>Save Idea</button>

      <div className="divider" />

      {ideas.length === 0 ? (
        <div className="empty"><p>No ideas yet — drop one above.</p></div>
      ) : (
        ideas.map((idea) => (
          <div key={idea.id} className="card" style={{ marginBottom: 8 }}>
            <div className="row-between">
              <p style={{ flex: 1, fontSize: '0.9rem', lineHeight: 1.5 }}>{idea.text}</p>
              <button onClick={() => deleteIdea(idea.id)}
                style={{ background: 'none', border: 'none', color: 'var(--t3)', cursor: 'pointer', fontSize: '1.1rem', marginLeft: 8 }}>×</button>
            </div>
            <div style={{ marginTop: 8, display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--amber)' }}>{'⚡'.repeat(idea.excitement)}</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--t3)' }}>
                {new Date(idea.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

// ─── Track ────────────────────────────────────────────────────────────────────

function TrackView() {
  const { logHabit, getDay, timeLog, addTimeEntry } = useHabitsStore()
  const { settings } = useSettingsStore()
  const today = todayISO()
  const day = getDay(today)
  const [timeForm, setTimeForm] = useState({ module: settings.workModules[0] ?? 'Personal', hours: '' })
  const [sleepOpen, setSleepOpen] = useState(false)
  const [sleepInput, setSleepInput] = useState('')

  const todayTime = timeLog.filter((e) => e.date === today)
  const totalHours = todayTime.reduce((a, e) => a + e.hours, 0)

  return (
    <div className="col" style={{ gap: 16 }}>
      {/* Habits */}
      <div>
        <div className="section-title" style={{ marginBottom: 10 }}>Today's Habits</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.8rem' }}>💧</div>
            <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>{day.water}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--t3)', marginBottom: 10 }}>/ 8 glasses</div>
            <button className="btn btn-primary btn-sm" style={{ width: '100%' }}
              onClick={() => { logHabit(today, { water: day.water + 1 }); navigator.vibrate?.(20) }}>+ Glass</button>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.8rem' }}>😴</div>
            <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>{day.sleep > 0 ? `${day.sleep}h` : '—'}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--t3)', marginBottom: 10 }}>sleep</div>
            <button className="btn btn-ghost btn-sm" style={{ width: '100%' }}
              onClick={() => { setSleepInput(day.sleep > 0 ? String(day.sleep) : ''); setSleepOpen(true) }}>Log</button>
          </div>
        </div>
        <div className="card" style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="row">
            <span style={{ fontSize: '1.4rem' }}>💪</span>
            <div>
              <div style={{ fontWeight: 600 }}>Workout</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--t3)' }}>{day.workout ? 'Done today ✓' : 'Not logged'}</div>
            </div>
          </div>
          <button className={`btn btn-sm ${day.workout ? 'btn-ghost' : 'btn-primary'}`}
            onClick={() => { logHabit(today, { workout: !day.workout }); navigator.vibrate?.(20) }}>
            {day.workout ? 'Remove' : 'Log it'}
          </button>
        </div>
      </div>

      <div className="divider" />

      {/* Time log */}
      <div>
        <div className="row-between" style={{ marginBottom: 10 }}>
          <div className="section-title">Time Log</div>
          <span style={{ fontSize: '0.85rem', color: 'var(--accent2)', fontWeight: 700 }}>{totalHours}h today</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 8, alignItems: 'center', marginBottom: 12 }}>
          <select value={timeForm.module} onChange={(e) => setTimeForm({ ...timeForm, module: e.target.value })}>
            {settings.workModules.map((m) => <option key={m}>{m}</option>)}
          </select>
          <input type="number" value={timeForm.hours} onChange={(e) => setTimeForm({ ...timeForm, hours: e.target.value })}
            placeholder="hrs" style={{ width: 60, textAlign: 'center' }} min="0" max="12" step="0.5" />
          <button className="btn btn-primary btn-sm" onClick={() => {
            const h = parseFloat(timeForm.hours)
            if (!h || h <= 0) return
            addTimeEntry({ date: today, module: timeForm.module, hours: h })
            setTimeForm({ ...timeForm, hours: '' })
            showToast(`${h}h logged for ${timeForm.module}`)
          }}>Log</button>
        </div>
        {todayTime.map((e) => (
          <div key={e.id} className="card row-between" style={{ marginBottom: 6 }}>
            <span style={{ fontSize: '0.875rem' }}>{e.module}</span>
            <span style={{ fontWeight: 700, color: 'var(--accent2)' }}>{e.hours}h</span>
          </div>
        ))}
      </div>

      <Sheet open={sleepOpen} onClose={() => setSleepOpen(false)} title="Log Sleep" height="40vh">
        <div className="col" style={{ gap: 14, alignItems: 'center' }}>
          <p style={{ color: 'var(--t3)', fontSize: '0.875rem' }}>How many hours did you sleep?</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <button className="btn btn-ghost" style={{ width: 52, height: 52, fontSize: '1.5rem', borderRadius: '50%' }}
              onClick={() => setSleepInput(String(Math.max(0, parseFloat(sleepInput || '0') - 0.5)))}>−</button>
            <span style={{ fontSize: '2.5rem', fontWeight: 700, minWidth: 80, textAlign: 'center' }}>
              {sleepInput || '0'}h
            </span>
            <button className="btn btn-ghost" style={{ width: 52, height: 52, fontSize: '1.5rem', borderRadius: '50%' }}
              onClick={() => setSleepInput(String(Math.min(14, parseFloat(sleepInput || '0') + 0.5)))}>+</button>
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => {
            const h = parseFloat(sleepInput)
            if (h > 0) { logHabit(today, { sleep: h }); showToast(`😴 ${h}h logged`) }
            setSleepOpen(false)
          }}>Save</button>
        </div>
      </Sheet>
    </div>
  )
}

// ─── Review ───────────────────────────────────────────────────────────────────

function ReviewView() {
  const tasks = useTasksStore((s) => s.tasks)
  const { days, timeLog } = useHabitsStore()

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - i)
    return d.toISOString().slice(0, 10)
  }).reverse()

  const completedThisWeek = tasks.filter((t) => t.status === 'done' && last7.includes(t.createdAt.slice(0, 10))).length
  const avgWater = last7.reduce((a, date) => {
    const d = days.find((x) => x.date === date)
    return a + (d?.water ?? 0)
  }, 0) / 7
  const workoutDays = last7.filter((date) => days.find((d) => d.date === date)?.workout).length
  const weekHours = timeLog.filter((e) => last7.includes(e.date)).reduce((a, e) => a + e.hours, 0)

  return (
    <div className="col" style={{ gap: 12 }}>
      <div className="section-title">Last 7 Days</div>

      {[
        { label: 'Tasks Completed', value: completedThisWeek, unit: 'tasks', icon: '✓', color: 'var(--green)' },
        { label: 'Avg Water', value: avgWater.toFixed(1), unit: 'glasses/day', icon: '💧', color: 'var(--blue)' },
        { label: 'Workout Days', value: workoutDays, unit: '/ 7 days', icon: '💪', color: 'var(--accent2)' },
        { label: 'Time Logged', value: weekHours.toFixed(1), unit: 'hours', icon: '⏱', color: 'var(--amber)' },
      ].map((stat) => (
        <div key={stat.label} className="card row-between">
          <div className="row">
            <span style={{ fontSize: '1.4rem' }}>{stat.icon}</span>
            <div>
              <div style={{ fontWeight: 600 }}>{stat.label}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--t3)' }}>{stat.unit}</div>
            </div>
          </div>
          <span style={{ fontSize: '1.4rem', fontWeight: 700, color: stat.color }}>{stat.value}</span>
        </div>
      ))}

      <div className="divider" />
      <div className="section-title">Habit Streak</div>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'space-between' }}>
        {last7.map((date) => {
          const d = days.find((x) => x.date === date)
          const score = [(d?.water ?? 0) >= 6, d?.workout, (d?.sleep ?? 0) >= 7].filter(Boolean).length
          return (
            <div key={date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: '100%', aspectRatio: '1', borderRadius: 6, background:
                  score === 3 ? 'var(--accent)' : score === 2 ? 'var(--accent-soft)' : score === 1 ? 'var(--bg-3)' : 'var(--bg-2)',
              }} />
              <span style={{ fontSize: '0.6rem', color: 'var(--t3)' }}>
                {new Date(date + 'T00:00').toLocaleDateString('en-US', { weekday: 'narrow' })}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── AI Chat ─────────────────────────────────────────────────────────────────

function AiView() {
  const { messages, addMessage, clearHistory } = useChatStore()
  const { settings } = useSettingsStore()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const send = async () => {
    if (loading) return
    const text = input.trim()
    if (!text || !settings.claudeApiKey) {
      if (!settings.claudeApiKey) showToast('Add API key in Settings first')
      return
    }
    setInput('')
    addMessage({ role: 'user', content: text })
    setLoading(true)
    try {
      const history = messages.slice(-20).map((m) => ({ role: m.role, content: m.content }))
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': settings.claudeApiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          system: 'You are Jarvis, a helpful personal assistant. Be concise and direct. Today is ' + todayISO(),
          messages: [...history, { role: 'user', content: text }],
        }),
      })
      const json = await res.json() as { content?: { text: string }[] }
      const reply = json.content?.[0]?.text ?? 'No response.'
      addMessage({ role: 'assistant', content: reply })
    } catch {
      showToast('Error — check API key in Settings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 8 }}>
        {messages.length === 0 && (
          <div className="empty" style={{ marginTop: 40 }}>
            <div className="empty-icon">🤖</div>
            <p>Ask me anything. I'm your personal AI assistant.</p>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} style={{
            maxWidth: '88%', alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            background: m.role === 'user' ? 'var(--accent)' : 'var(--bg-3)',
            borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            padding: '10px 14px', fontSize: '0.9rem', lineHeight: 1.6,
            color: m.role === 'user' ? '#fff' : 'var(--t1)',
          }}>
            {m.content}
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: 'flex-start', background: 'var(--bg-3)', borderRadius: '18px 18px 18px 4px', padding: '12px 16px' }}>
            <div className="spinner" />
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
        <input value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Ask Jarvis…" style={{ flex: 1 }} />
        <button className="btn btn-primary" onClick={send} disabled={!input.trim()}>↑</button>
      </div>
      {messages.length > 0 && (
        <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }}
          onClick={() => { clearHistory(); showToast('History cleared') }}>Clear history</button>
      )}
    </div>
  )
}

// ─── Settings ─────────────────────────────────────────────────────────────────

function SettingsView() {
  const { settings, updateSettings } = useSettingsStore()
  const [apiKey, setApiKey] = useState(settings.claudeApiKey)
  const [modules, setModules] = useState(settings.workModules.join(', '))

  return (
    <div className="col" style={{ gap: 16 }}>
      <div>
        <label style={{ fontSize: '0.8rem', color: 'var(--t3)', fontWeight: 600, display: 'block', marginBottom: 6 }}>
          ANTHROPIC API KEY
        </label>
        <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-ant-…" />
        <button className="btn btn-primary" style={{ marginTop: 8, width: '100%' }}
          onClick={() => { updateSettings({ claudeApiKey: apiKey }); showToast('API key saved') }}>
          Save Key
        </button>
      </div>

      <div>
        <label style={{ fontSize: '0.8rem', color: 'var(--t3)', fontWeight: 600, display: 'block', marginBottom: 6 }}>
          WORK MODULES (comma-separated)
        </label>
        <input value={modules} onChange={(e) => setModules(e.target.value)} />
        <button className="btn btn-ghost" style={{ marginTop: 8, width: '100%' }}
          onClick={() => {
            updateSettings({ workModules: modules.split(',').map((m) => m.trim()).filter(Boolean) })
            showToast('Modules updated')
          }}>
          Save Modules
        </button>
      </div>

      <div className="divider" />

      <div style={{ fontSize: '0.75rem', color: 'var(--t3)', textAlign: 'center' }}>
        JARVIS 2.0 · Personal Operating System
      </div>
    </div>
  )
}
