import { useRobinhood } from '../hooks/useRobinhood'

interface Props {
  apiKey: string
  onOpenSettings: () => void
}

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtAge(ms: number) {
  const mins = Math.floor((Date.now() - ms) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  return `${Math.floor(mins / 60)}h ago`
}

export function RobinhoodTile({ apiKey, onOpenSettings }: Props) {
  const { data, status, error, refresh } = useRobinhood(apiKey)

  // ── Unconfigured state ──────────────────────────────────────────────────────
  if (status === 'unconfigured') {
    return (
      <button
        onClick={onOpenSettings}
        style={{
          width: '100%', textAlign: 'left',
          background: 'var(--bg-2)', border: '1px dashed var(--border)',
          borderRadius: 'var(--radius)', padding: '14px 16px',
          cursor: 'pointer', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 12,
        }}
      >
        <span style={{ fontSize: '1.4rem' }}>📈</span>
        <div>
          <div style={{ fontWeight: 600, color: 'var(--t1)', fontSize: '0.9rem' }}>Connect Robinhood</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--t3)', marginTop: 2 }}>
            Add API key in Settings to see your portfolio
          </div>
        </div>
        <span style={{ marginLeft: 'auto', color: 'var(--t3)' }}>›</span>
      </button>
    )
  }

  // ── Loading state ───────────────────────────────────────────────────────────
  if (status === 'loading' && !data) {
    return (
      <div style={{
        background: 'var(--bg-2)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div className="spinner" style={{ width: 16, height: 16 }} />
        <span style={{ color: 'var(--t3)', fontSize: '0.85rem' }}>Fetching portfolio…</span>
      </div>
    )
  }

  // ── Error (no cache) ────────────────────────────────────────────────────────
  if (status === 'error' && !data) {
    return (
      <div style={{
        background: 'var(--bg-2)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.1rem' }}>📈</span>
            <span style={{ color: 'var(--red)', fontSize: '0.85rem' }}>
              {error.includes('CORS') || error.includes('Failed to fetch')
                ? 'CORS blocked — API needs a proxy'
                : error.slice(0, 50)}
            </span>
          </div>
          <button onClick={refresh} style={{
            background: 'none', border: '1px solid var(--border)',
            borderRadius: 8, padding: '4px 10px', cursor: 'pointer',
            color: 'var(--t2)', fontSize: '0.75rem',
          }}>Retry</button>
        </div>
      </div>
    )
  }

  // ── Data state (ok or loading refresh) ─────────────────────────────────────
  if (!data) return null
  const isPositive = data.dayChange >= 0

  return (
    <div style={{
      background: 'linear-gradient(135deg, var(--bg-2) 0%, var(--bg-3) 100%)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '16px', marginBottom: 20,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Robinhood accent stripe */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: 'linear-gradient(90deg, #00c805, #00a004)',
        borderRadius: 'var(--radius) var(--radius) 0 0',
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--t3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
            Crypto Portfolio
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--t1)', lineHeight: 1.1 }}>
            {fmt(data.equity)}
          </div>
          {data.dayChange !== 0 && (
            <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                fontSize: '0.8rem', fontWeight: 600,
                color: isPositive ? 'var(--green)' : 'var(--red)',
              }}>
                {isPositive ? '+' : ''}{fmt(data.dayChange)}
              </span>
              <span style={{
                fontSize: '0.75rem', padding: '1px 6px', borderRadius: 4,
                background: isPositive ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)',
                color: isPositive ? 'var(--green)' : 'var(--red)',
              }}>
                {isPositive ? '+' : ''}{data.dayChangePct.toFixed(2)}%
              </span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <div style={{
            background: 'rgba(0,200,5,0.12)', borderRadius: 20,
            padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <span style={{ fontSize: '0.95rem' }}>📈</span>
            <span style={{ fontSize: '0.7rem', color: '#00c805', fontWeight: 700 }}>RH</span>
          </div>
          <button
            onClick={refresh}
            disabled={status === 'loading'}
            style={{
              background: 'none', border: '1px solid var(--border)', borderRadius: 8,
              padding: '3px 8px', cursor: 'pointer', color: 'var(--t3)', fontSize: '0.7rem',
            }}
          >
            {status === 'loading' ? '…' : '↻'}
          </button>
        </div>
      </div>

      <div style={{ marginTop: 12, display: 'flex', gap: 16 }}>
        <div>
          <div style={{ fontSize: '0.65rem', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cash</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--t2)' }}>{fmt(data.cash)}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.65rem', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Holdings</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--t2)' }}>{fmt(data.equity - data.cash)}</div>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--t3)' }}>Updated</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--t3)' }}>{fmtAge(data.updatedAt)}</div>
        </div>
      </div>
    </div>
  )
}
