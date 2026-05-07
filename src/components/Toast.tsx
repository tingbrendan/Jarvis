import { useState, useCallback, useEffect, useRef } from 'react'

interface ToastItem { id: string; message: string; action?: { label: string; fn: () => void } }

let _show: ((msg: string, action?: ToastItem['action']) => void) | null = null

export const showToast = (msg: string, action?: ToastItem['action']) => _show?.(msg, action)

export function ToastProvider() {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: string) => {
    timers.current.get(id) && clearTimeout(timers.current.get(id))
    timers.current.delete(id)
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  const show = useCallback((message: string, action?: ToastItem['action']) => {
    const id = crypto.randomUUID()
    setToasts((t) => [...t, { id, message, action }])
    const timer = setTimeout(() => dismiss(id), 3200)
    timers.current.set(id, timer)
  }, [dismiss])

  useEffect(() => { _show = show }, [show])

  if (!toasts.length) return null

  return (
    <div style={{
      position: 'fixed', bottom: 'calc(80px + env(safe-area-inset-bottom))',
      left: '50%', transform: 'translateX(-50%)',
      display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center',
      zIndex: 9999, pointerEvents: 'none',
    }}>
      {toasts.map((t) => (
        <div key={t.id} className="fade-up" style={{
          background: 'var(--bg-4)', border: '1px solid var(--border-active)',
          borderRadius: 100, padding: '10px 18px',
          display: 'flex', alignItems: 'center', gap: 12,
          fontSize: '0.875rem', fontWeight: 500, color: 'var(--t1)',
          pointerEvents: 'all', boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          whiteSpace: 'nowrap',
        }}>
          {t.message}
          {t.action && (
            <button onClick={() => { t.action!.fn(); dismiss(t.id) }} style={{
              background: 'none', border: 'none', color: 'var(--accent2)',
              fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem', padding: 0,
            }}>{t.action.label}</button>
          )}
        </div>
      ))}
    </div>
  )
}
