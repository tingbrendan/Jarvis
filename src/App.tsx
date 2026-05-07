import { useState, useEffect, useCallback } from 'react'
import { useSettingsStore } from './store'
import { BottomNav } from './components/BottomNav'
import { ToastProvider } from './components/Toast'
import { Home } from './screens/Home'
import { Tasks } from './screens/Tasks'
import { Notes } from './screens/Notes'
import { Calendar } from './screens/Calendar'
import { More } from './screens/More'

export type Tab = 'home' | 'tasks' | 'notes' | 'calendar' | 'more'

// ─── Setup flow (first-time PIN creation) ────────────────────────────────────

function Setup() {
  const { updateSettings, setSetup } = useSettingsStore()
  const [pin, setPin] = useState('')
  const [confirm, setConfirm] = useState('')
  const [step, setStep] = useState<'create' | 'confirm'>('create')
  const [err, setErr] = useState('')

  const handleDigit = (d: string) => {
    if (step === 'create') {
      const next = pin + d
      setPin(next)
      if (next.length === 4) { setStep('confirm'); }
    } else {
      const next = confirm + d
      setConfirm(next)
      if (next.length === 4) {
        if (next === pin) {
          updateSettings({ pin })
          setSetup(true)
        } else {
          setErr("PINs don't match — try again")
          setConfirm('')
        }
      }
    }
  }

  const dots = step === 'create' ? pin : confirm

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: 32,
    }}>
      <div style={{ fontSize: '2rem', marginBottom: 8 }}>🛡</div>
      <h1 style={{ marginBottom: 6 }}>JARVIS</h1>
      <p style={{ color: 'var(--t3)', marginBottom: 32, textAlign: 'center', fontSize: '0.9rem' }}>
        {step === 'create' ? 'Create a 4-digit PIN to secure your data' : 'Confirm your PIN'}
      </p>

      <PinDots count={dots.length} />

      {err && <p style={{ color: 'var(--red)', fontSize: '0.85rem', marginTop: 12 }}>{err}</p>}

      <Numpad onDigit={handleDigit} onDelete={() => {
        if (step === 'create') setPin(pin.slice(0, -1))
        else setConfirm(confirm.slice(0, -1))
        setErr('')
      }} />
    </div>
  )
}

// ─── Lock screen ─────────────────────────────────────────────────────────────

function Lock({ onUnlock }: { onUnlock: () => void }) {
  const { settings, updateSettings } = useSettingsStore()
  const [input, setInput] = useState('')
  const [err, setErr] = useState(false)
  const [shake, setShake] = useState(false)

  const tryBiometric = useCallback(async () => {
    if (!settings.biometricEnabled) return
    try {
      const cred = await navigator.credentials.get({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          allowCredentials: [],
          userVerification: 'required',
          timeout: 30000,
        },
      } as CredentialRequestOptions)
      if (cred) onUnlock()
    } catch {
      // fall through to PIN
    }
  }, [settings.biometricEnabled, onUnlock])

  useEffect(() => { tryBiometric() }, [tryBiometric])

  const handleDigit = (d: string) => {
    const next = input + d
    setInput(next)
    if (next.length === 4) {
      if (next === settings.pin) {
        onUnlock()
      } else {
        setShake(true)
        setErr(true)
        setTimeout(() => { setShake(false); setErr(false); setInput('') }, 700)
        navigator.vibrate?.([50, 50, 50])
      }
    }
  }

  const enableBiometric = async () => {
    try {
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rp: { name: 'JARVIS', id: location.hostname },
          user: { id: new Uint8Array(16), name: 'user', displayName: 'JARVIS User' },
          pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
          authenticatorSelection: { userVerification: 'required', residentKey: 'preferred' },
          timeout: 30000,
        },
      } as CredentialCreationOptions)
      if (credential) {
        updateSettings({ biometricEnabled: true })
        showToastImperative('Face ID / biometric enabled ✓')
      }
    } catch {
      showToastImperative('Biometric not available on this device')
    }
  }

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: 32,
    }}>
      <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔒</div>
      <h1 style={{ marginBottom: 32 }}>JARVIS</h1>

      <div style={{ animation: shake ? 'shake 0.5s' : 'none' }}>
        <PinDots count={input.length} error={err} />
      </div>

      {err && <p style={{ color: 'var(--red)', fontSize: '0.85rem', marginTop: 12 }}>Incorrect PIN</p>}

      <Numpad onDigit={handleDigit} onDelete={() => setInput(input.slice(0, -1))} />

      {settings.biometricEnabled ? (
        <button className="btn btn-ghost" style={{ marginTop: 16 }} onClick={tryBiometric}>
          Use Face ID / Biometric
        </button>
      ) : (
        <button className="btn btn-ghost btn-sm" style={{ marginTop: 16 }} onClick={enableBiometric}>
          Enable Face ID
        </button>
      )}

      <style>{`@keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-8px)} 40%,80%{transform:translateX(8px)} }`}</style>
    </div>
  )
}

// ─── PIN dots + numpad ────────────────────────────────────────────────────────

function PinDots({ count, error = false }: { count: number; error?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
      {[0,1,2,3].map((i) => (
        <div key={i} style={{
          width: 16, height: 16, borderRadius: '50%',
          background: i < count ? (error ? 'var(--red)' : 'var(--accent)') : 'var(--border-active)',
          transition: 'background 0.15s, transform 0.1s',
          transform: i < count ? 'scale(1.15)' : 'scale(1)',
        }} />
      ))}
    </div>
  )
}

function Numpad({ onDigit, onDelete }: { onDigit: (d: string) => void; onDelete: () => void }) {
  const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫']
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 8 }}>
      {keys.map((k, i) =>
        k === '' ? <div key={i} /> :
        <button key={k + i} onClick={() => k === '⌫' ? onDelete() : onDigit(k)} style={{
          background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 12,
          height: 64, fontSize: k === '⌫' ? '1.2rem' : '1.4rem', fontWeight: 600,
          cursor: 'pointer', color: 'var(--t1)', fontFamily: 'var(--font)',
          transition: 'transform 0.1s, background 0.1s',
        }}
          onTouchStart={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-4)' }}
          onTouchEnd={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-2)' }}
        >{k}</button>
      )}
    </div>
  )
}

// ─── App root ─────────────────────────────────────────────────────────────────

const LOCK_TIMEOUT = 5 * 60 * 1000 // 5 minutes

// Imperative toast helper used by Lock before ToastProvider mounts
function showToastImperative(msg: string) {
  const el = document.createElement('div')
  el.textContent = msg
  Object.assign(el.style, {
    position: 'fixed', bottom: '100px', left: '50%', transform: 'translateX(-50%)',
    background: 'var(--bg-4)', padding: '10px 18px', borderRadius: '100px',
    color: 'var(--t1)', fontSize: '0.875rem', zIndex: '9999', whiteSpace: 'nowrap',
    border: '1px solid var(--border-active)',
  })
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 3000)
}

export default function App() {
  const { isSetup, settings } = useSettingsStore()
  const [unlocked, setUnlocked] = useState(!isSetup)
  const [tab, setTab] = useState<Tab>('home')
  const [lastActive, setLastActive] = useState(Date.now())

  // Auto-lock on inactivity
  useEffect(() => {
    if (!isSetup) return
    const check = () => {
      if (document.hidden && Date.now() - lastActive > LOCK_TIMEOUT) {
        setUnlocked(false)
      }
    }
    const updateActivity = () => setLastActive(Date.now())
    document.addEventListener('visibilitychange', check)
    document.addEventListener('touchstart', updateActivity, { passive: true })
    return () => {
      document.removeEventListener('visibilitychange', check)
      document.removeEventListener('touchstart', updateActivity)
    }
  }, [isSetup, lastActive])

  // Request notification permission on first setup complete
  useEffect(() => {
    if (isSetup && settings.notificationsEnabled) scheduleNotifications()
  }, [isSetup, settings.notificationsEnabled])

  if (!isSetup) return <Setup />
  if (!unlocked) return <Lock onUnlock={() => setUnlocked(true)} />

  return (
    <>
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {tab === 'home'     && <Home onNavigate={setTab} />}
        {tab === 'tasks'    && <Tasks />}
        {tab === 'notes'    && <Notes />}
        {tab === 'calendar' && <Calendar />}
        {tab === 'more'     && <More />}
      </div>
      <BottomNav active={tab} onSelect={setTab} />
      <ToastProvider />
    </>
  )
}

// ─── Notifications ────────────────────────────────────────────────────────────

function scheduleNotifications() {
  if (!('Notification' in window)) return
  Notification.requestPermission().then((perm) => {
    if (perm !== 'granted') return
    // Notifications are scheduled via the service worker in production.
    // In dev, just show a welcome notification.
    new Notification('JARVIS', { body: 'Notifications enabled ✓', icon: '/Jarvis/icon-192.png' })
  })
}
