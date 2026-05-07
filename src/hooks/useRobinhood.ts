import { useState, useEffect, useCallback } from 'react'

export interface RhPortfolio {
  equity: number        // total crypto account equity (holdings + cash)
  cash: number          // buying power / cash
  dayChange: number     // approximate day change (0 if unavailable)
  dayChangePct: number
  updatedAt: number     // ms timestamp
}

const CACHE_KEY = 'jarvis-rh-cache'
const CACHE_TTL = 5 * 60 * 1000 // 5 min
const BASE = 'https://trading.robinhood.com'

// Sign a message with Ed25519 using Web Crypto
async function ed25519Sign(privateKeyB64: string, message: string): Promise<string> {
  const raw = Uint8Array.from(atob(privateKeyB64), (c) => c.charCodeAt(0))
  const key = await crypto.subtle.importKey(
    'raw', raw,
    { name: 'Ed25519' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('Ed25519', key, new TextEncoder().encode(message))
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
}

// Build signed headers for a GET request
async function signedHeaders(apiKey: string, privateKey: string, path: string) {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const body = ''
  const msg = `${apiKey}\n${timestamp}\n${path}\n${body}`
  const signature = await ed25519Sign(privateKey, msg)
  return {
    'x-api-key': apiKey,
    'x-timestamp': timestamp,
    'x-signature': signature,
    'Content-Type': 'application/json',
  }
}

async function fetchRh(apiKey: string, privateKey: string): Promise<RhPortfolio> {
  // 1. Fetch account (buying power / cash)
  const accountPath = '/api/v1/crypto/trading/accounts/'
  const accountHeaders = await signedHeaders(apiKey, privateKey, accountPath)
  const accountRes = await fetch(BASE + accountPath, { headers: accountHeaders })
  if (!accountRes.ok) throw new Error(`Account fetch failed: ${accountRes.status}`)
  const accountJson = await accountRes.json() as { results: { buying_power: string }[] }
  const cash = parseFloat(accountJson.results[0]?.buying_power ?? '0')

  // 2. Fetch holdings
  const holdingsPath = '/api/v1/crypto/trading/holdings/'
  const holdingsHeaders = await signedHeaders(apiKey, privateKey, holdingsPath)
  const holdingsRes = await fetch(BASE + holdingsPath, { headers: holdingsHeaders })
  if (!holdingsRes.ok) throw new Error(`Holdings fetch failed: ${holdingsRes.status}`)
  const holdingsJson = await holdingsRes.json() as {
    results: { asset_code: string; total_quantity: string; quantity_available_for_trading: string }[]
  }

  // 3. Get best bid prices for each asset to calculate holdings value
  let holdingsValue = 0
  for (const h of holdingsJson.results) {
    const qty = parseFloat(h.total_quantity)
    if (qty <= 0) continue
    try {
      const pricePath = `/api/v1/crypto/marketdata/best_bid_ask/?symbol=${h.asset_code}-USD`
      const priceHeaders = await signedHeaders(apiKey, privateKey, pricePath)
      const priceRes = await fetch(BASE + pricePath, { headers: priceHeaders })
      if (priceRes.ok) {
        const priceJson = await priceRes.json() as { results: { bid_inclusive_of_sell_spread: string }[] }
        const price = parseFloat(priceJson.results[0]?.bid_inclusive_of_sell_spread ?? '0')
        holdingsValue += qty * price
      }
    } catch {
      // skip price for this asset
    }
  }

  const equity = cash + holdingsValue

  return {
    equity,
    cash,
    dayChange: 0,      // day change requires historical data — skip for now
    dayChangePct: 0,
    updatedAt: Date.now(),
  }
}

export type RhStatus = 'idle' | 'loading' | 'ok' | 'error' | 'unconfigured'

export function useRobinhood(apiKey: string, privateKey: string) {
  const [data, setData] = useState<RhPortfolio | null>(null)
  const [status, setStatus] = useState<RhStatus>('idle')
  const [error, setError] = useState('')

  const load = useCallback(async (force = false) => {
    if (!apiKey || !privateKey) { setStatus('unconfigured'); return }

    // Check cache
    if (!force) {
      try {
        const cached = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null') as RhPortfolio | null
        if (cached && Date.now() - cached.updatedAt < CACHE_TTL) {
          setData(cached)
          setStatus('ok')
          return
        }
      } catch { /* ignore */ }
    }

    setStatus('loading')
    try {
      const portfolio = await fetchRh(apiKey, privateKey)
      localStorage.setItem(CACHE_KEY, JSON.stringify(portfolio))
      setData(portfolio)
      setStatus('ok')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      setError(msg)
      // Fall back to cache even if stale
      try {
        const cached = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null') as RhPortfolio | null
        if (cached) { setData(cached); setStatus('ok'); return }
      } catch { /* ignore */ }
      setStatus('error')
    }
  }, [apiKey, privateKey])

  useEffect(() => { load() }, [load])

  return { data, status, error, refresh: () => load(true) }
}
