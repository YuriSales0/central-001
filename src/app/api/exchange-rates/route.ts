import { NextResponse } from 'next/server'
import { getExchangeRates, SUPPORTED_CURRENCIES } from '@/lib/exchange'

/**
 * GET /api/exchange-rates
 * Retorna taxas de câmbio com base EUR, filtradas para as moedas suportadas.
 * Cache de 1h server-side.
 */
export async function GET() {
  const allRates = await getExchangeRates()

  const rates = Object.fromEntries(
    SUPPORTED_CURRENCIES.map((c) => [c, allRates[c] ?? 1])
  )

  return NextResponse.json(
    { base: 'EUR', rates, updatedAt: new Date().toISOString() },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300',
      },
    }
  )
}
