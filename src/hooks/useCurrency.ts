'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  type Currency,
  type SUPPORTED_CURRENCIES,
  CURRENCY_SYMBOLS,
  convertAmount,
  formatAmount,
} from '@/lib/exchange'

const STORAGE_KEY = 'preferred_currency'

export function useCurrency() {
  const [currency, setCurrencyState] = useState<Currency>('EUR')
  const [rates, setRates] = useState<Record<string, number>>({ EUR: 1 })
  const [loading, setLoading] = useState(true)

  // Carrega moeda salva + taxas ao montar
  useEffect(() => {
    const saved = (localStorage.getItem(STORAGE_KEY) as Currency) || 'EUR'
    setCurrencyState(saved)

    fetch('/api/exchange-rates')
      .then((r) => r.json())
      .then((data) => setRates(data.rates ?? { EUR: 1 }))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c)
    localStorage.setItem(STORAGE_KEY, c)
  }, [])

  /** Converte valor em EUR para a moeda selecionada e formata */
  const fmt = useCallback(
    (amountInEur: number) => formatAmount(convertAmount(amountInEur, currency, rates), currency),
    [currency, rates]
  )

  /** Converte sem formatar (número puro) */
  const convert = useCallback(
    (amountInEur: number) => convertAmount(amountInEur, currency, rates),
    [currency, rates]
  )

  const symbol = CURRENCY_SYMBOLS[currency]

  return { currency, setCurrency, rates, loading, fmt, convert, symbol }
}
