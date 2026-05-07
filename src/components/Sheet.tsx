import { useEffect, useRef, type ReactNode } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  height?: string
}

export function Sheet({ open, onClose, title, children, height = '85vh' }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  // Close on backdrop tap
  useEffect(() => {
    if (!open) return
    const el = ref.current
    if (!el) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Drag-to-close
  const startY = useRef(0)
  const onTouchStart = (e: React.TouchEvent) => { startY.current = e.touches[0]!.clientY }
  const onTouchEnd = (e: React.TouchEvent) => {
    const delta = e.changedTouches[0]!.clientY - startY.current
    if (delta > 80) onClose()
  }

  if (!open) return null

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
        zIndex: 200, backdropFilter: 'blur(4px)',
      }} />
      <div ref={ref} className="fade-up" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        height, background: 'var(--bg-2)',
        borderRadius: '20px 20px 0 0', zIndex: 201,
        display: 'flex', flexDirection: 'column',
        paddingBottom: 'env(safe-area-inset-bottom)',
        overscrollBehavior: 'contain',
      }}>
        {/* Drag handle */}
        <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
          style={{ padding: '12px 0 4px', display: 'flex', justifyContent: 'center', cursor: 'grab' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-active)' }} />
        </div>

        {title && (
          <div style={{ padding: '8px 20px 12px', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>{title}</h2>
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
          {children}
        </div>
      </div>
    </>
  )
}
