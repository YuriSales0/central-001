/**
 * Conversão de moeda com cache de 1h.
 * Base: EUR (todas as quantias são armazenadas em EUR).
 * API gratuita sem chave: open.er-api.com
 */

export const SUPPORTED_CURRENCIES = ['EUR', 'USD', 'GBP', 'BRL'] as const
export type Currency = (typeof SUPPORTED_CURRENCIES)[number]

export const CURRENCY_LABELS: Record<Currency, string> = {
  EUR: '€ Euro',
  USD: '$ Dólar (USD)',
  GBP: '£ Libra (GBP)',
  BRL: 'R$ Real (BRL)',
}

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  BRL: 'R$',
}

interface RateCache {
  rates: Record<string, number>
  fetchedAt: number
}

let cache: RateCache | null = null
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hora

export async function getExchangeRates(): Promise<Record<string, number>> {
  const now = Date.now()
  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.rates
  }

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/EUR', {
      next: { revalidate: 3600 }, // Next.js cache
    })
    const json = await res.json()

    if (json.result !== 'success') throw new Error('API indisponível')

    cache = { rates: json.rates as Record<string, number>, fetchedAt: now }
    return cache.rates
  } catch {
    // Fallback com taxas aproximadas se a API falhar
    const fallback: Record<string, number> = {
      EUR: 1,
      USD: 1.08,
      GBP: 0.86,
      BRL: 5.45,
    }
    cache = { rates: fallback, fetchedAt: now }
    return fallback
  }
}

export function convertAmount(
  amountInEur: number,
  toCurrency: Currency,
  rates: Record<string, number>,
): number {
  if (toCurrency === 'EUR') return amountInEur
  const rate = rates[toCurrency] ?? 1
  return parseFloat((amountInEur * rate).toFixed(2))
}

export function formatAmount(amount: number, currency: Currency): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}
