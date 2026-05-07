import type { Tab } from '../App'

interface Props { active: Tab; onSelect: (t: Tab) => void }

const tabs: { id: Tab; icon: string; label: string }[] = [
  { id: 'home',     icon: '⌂',  label: 'Home' },
  { id: 'tasks',    icon: '✓',  label: 'Tasks' },
  { id: 'notes',    icon: '✎',  label: 'Notes' },
  { id: 'calendar', icon: '▦',  label: 'Cal' },
  { id: 'more',     icon: '⋯',  label: 'More' },
]

export function BottomNav({ active, onSelect }: Props) {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      height: 'calc(var(--nav-h) + env(safe-area-inset-bottom))',
      paddingBottom: 'env(safe-area-inset-bottom)',
      background: 'rgba(20,20,24,0.92)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      borderTop: '1px solid var(--border)',
      display: 'flex', alignItems: 'flex-start',
      zIndex: 100,
    } as React.CSSProperties}>
      {tabs.map((tab) => {
        const isActive = active === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 3, padding: '10px 0 0',
              background: 'none', border: 'none', cursor: 'pointer',
              color: isActive ? 'var(--accent2)' : 'var(--t3)',
              transition: 'color 0.15s',
            }}
          >
            <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>{tab.icon}</span>
            <span style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.02em' }}>
              {tab.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
