import { useState, useRef, useCallback, useEffect } from 'react'
import { useTasksStore, useNotesStore, useIdeasStore, useEventsStore, useSettingsStore, todayISO, type Event as JarvisEvent } from '../store'
import { showToast } from './Toast'

const ROUTE_PROMPT = `You are a routing parser for a personal OS. Given user input, return JSON only.
Determine which category this belongs to and extract fields:
- task: { title, module (one of the user's workModules or "Personal"), priority ("low"|"medium"|"high"), dueDate (YYYY-MM-DD or null) }
- note: { text, type ("work"|"life") }
- idea: { text, excitement (1-5) }
- event: { title, date (YYYY-MM-DD), time (HH:MM or null), recurring (null|"daily"|"weekdays"|"weekly"|"monthly") }

Return ONLY valid JSON like: {"type":"task","data":{...}}
Defaults: task priority=medium, note type=life, idea excitement=3, event date=today.`

const hasSpeech = typeof window !== 'undefined' &&
  ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

export function QuickCapture() {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const { settings } = useSettingsStore()

  // Handle Web Share Target: when app is opened via share sheet, pre-fill + auto-submit
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sharedText = [params.get('share_title'), params.get('share_text'), params.get('share_url')]
      .filter(Boolean).join(' — ')
    if (sharedText) {
      // Clear URL params so refreshing doesn't re-trigger
      window.history.replaceState({}, '', window.location.pathname)
      setText(sharedText)
      inputRef.current?.focus()
    }
  }, [])
  const addTask = useTasksStore((s) => s.addTask)
  const addNote = useNotesStore((s) => s.addNote)
  const addIdea = useIdeasStore((s) => s.addIdea)
  const addEvent = useEventsStore((s) => s.addEvent)

  // Voice: transcript goes directly to the routing pipeline (bypasses React state timing)
  const handleVoiceTranscript = useCallback(async (val: string) => {
    if (!val.trim()) return
    setText(val)
    navigator.vibrate?.(30)
    showToast('🎙 ' + val.slice(0, 40) + (val.length > 40 ? '…' : ''))
    if (!settings.claudeApiKey) { routeLocally(val); return }
    setLoading(true)
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': settings.claudeApiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 256,
          system: ROUTE_PROMPT + `\nToday is ${todayISO()}. workModules: ${settings.workModules.join(', ')}`,
          messages: [{ role: 'user', content: val }],
        }),
      })
      if (!res.ok) throw new Error(`API ${res.status}`)
      const json = await res.json() as { content?: { text: string }[] }
      const raw = json.content?.[0]?.text ?? ''
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON')
      const parsed = JSON.parse(jsonMatch[0]) as { type: string; data: Record<string, unknown> }
      dispatch(parsed.type, parsed.data, val)
    } catch {
      routeLocally(val)
    } finally {
      setLoading(false)
      setText('')
    }
  }, [settings]) // eslint-disable-line react-hooks/exhaustive-deps

  const startListening = useCallback(() => {
    if (listening) { recognitionRef.current?.stop(); return }
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!SR) { showToast('Voice not supported on this browser'); return }
    const rec = new SR()
    rec.lang = 'en-US'
    rec.continuous = false
    rec.interimResults = false
    rec.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = e.results[0]?.[0]?.transcript ?? ''
      handleVoiceTranscript(transcript)
    }
    rec.onerror = () => { setListening(false); showToast('Microphone error — check permissions') }
    rec.onend = () => setListening(false)
    recognitionRef.current = rec
    rec.start()
    setListening(true)
  }, [listening, handleVoiceTranscript])

  const handleSubmit = async () => {
    const val = text.trim()
    if (!val) return
    setText('')
    inputRef.current?.blur()

    if (!settings.claudeApiKey) {
      // Fallback: simple keyword routing without AI
      routeLocally(val)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': settings.claudeApiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 256,
          system: ROUTE_PROMPT + `\nToday is ${todayISO()}. workModules: ${settings.workModules.join(', ')}`,
          messages: [{ role: 'user', content: val }],
        }),
      })
      if (!res.ok) throw new Error(`API ${res.status}`)
      const json = await res.json() as { content?: { text: string }[] }
      const raw = json.content?.[0]?.text ?? ''
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON in response')
      const parsed = JSON.parse(jsonMatch[0]) as { type: string; data: Record<string, unknown> }
      dispatch(parsed.type, parsed.data, val)
    } catch {
      routeLocally(val)
    } finally {
      setLoading(false)
    }
  }

  const routeLocally = (val: string) => {
    const lower = val.toLowerCase()
    if (lower.startsWith('idea:') || lower.includes('idea ')) {
      addIdea({ text: val.replace(/^idea[:\s]*/i, ''), excitement: 3 })
      showToast('💡 Idea captured')
    } else if (lower.startsWith('note:') || lower.startsWith('note ')) {
      addNote({ text: val.replace(/^note[:\s]*/i, ''), type: 'life', category: 'General' })
      showToast('✎ Note saved')
    } else if (lower.startsWith('event:') || lower.startsWith('event ')) {
      addEvent({ title: val.replace(/^event[:\s]*/i, ''), date: todayISO(), time: undefined, recurring: null })
      showToast('▦ Event added')
    } else {
      addTask({ title: val, module: 'Personal', priority: 'medium', status: 'todo' })
      showToast('✓ Task added')
    }
  }

  const dispatch = (type: string, data: Record<string, unknown>, raw: string) => {
    if (type === 'task') {
      addTask({
        title: (data.title as string) || raw,
        module: (data.module as string) || 'Personal',
        priority: (data.priority as 'low' | 'medium' | 'high') || 'medium',
        status: 'todo',
        dueDate: (data.dueDate as string | undefined) ?? undefined,
      })
      showToast('✓ Task added')
    } else if (type === 'note') {
      addNote({
        text: (data.text as string) || raw,
        type: (data.type as 'work' | 'life') || 'life',
        category: 'General',
      })
      showToast('✎ Note saved')
    } else if (type === 'idea') {
      addIdea({
        text: (data.text as string) || raw,
        excitement: (data.excitement as 1 | 2 | 3 | 4 | 5) || 3,
      })
      showToast('💡 Idea captured')
    } else if (type === 'event') {
      addEvent({
        title: (data.title as string) || raw,
        date: (data.date as string) || todayISO(),
        time: (data.time as string | undefined) ?? undefined,
        recurring: (data.recurring as JarvisEvent['recurring']) ?? null,
      })
      showToast('▦ Event added')
    } else {
      routeLocally(raw)
    }
  }

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 50,
      padding: '12px 16px 8px',
      background: 'linear-gradient(to bottom, var(--bg-1) 80%, transparent)',
      paddingTop: 'calc(var(--safe-top) + 12px)',
    }}>
      <div style={{
        display: 'flex', gap: 8, alignItems: 'center',
        background: 'var(--bg-3)', borderRadius: 100,
        padding: '10px 16px', border: '1px solid var(--border)',
        transition: 'border-color 0.15s',
      }}>
        <span style={{ color: 'var(--accent)', fontSize: '1rem', flexShrink: 0 }}>+</span>
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="Add task, note, idea, or event…"
          style={{
            background: 'none', border: 'none', outline: 'none',
            color: 'var(--t1)', fontSize: '16px', flex: 1, padding: 0,
          }}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="sentences"
          spellCheck={false}
        />
        {loading && <div className="spinner" style={{ width: 16, height: 16, flexShrink: 0 }} />}
        {!loading && text && (
          <button onClick={handleSubmit} style={{
            background: 'var(--accent)', border: 'none', borderRadius: '50%',
            width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#fff', flexShrink: 0, fontSize: '0.85rem',
          }}>↑</button>
        )}
        {!loading && !text && hasSpeech && (
          <button onClick={startListening} style={{
            background: listening ? 'var(--red)' : 'transparent',
            border: `1px solid ${listening ? 'var(--red)' : 'var(--border-active)'}`,
            borderRadius: '50%', width: 28, height: 28,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0, fontSize: '0.8rem',
            animation: listening ? 'pulse 1s ease-in-out infinite' : 'none',
          }}>🎙</button>
        )}
      </div>
    </div>
  )
}
