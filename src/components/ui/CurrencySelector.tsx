'use client'

import { SUPPORTED_CURRENCIES, CURRENCY_LABELS, type Currency } from '@/lib/exchange'
import { clsx } from 'clsx'

interface Props {
  value: Currency
  onChange: (c: Currency) => void
  className?: string
}

export function CurrencySelector({ value, onChange, className }: Props) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Currency)}
      className={clsx(
        'text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white',
        'focus:outline-none focus:ring-2 focus:ring-blue-300',
        className
      )}
      title="Selecionar moeda de exibição"
    >
      {SUPPORTED_CURRENCIES.map((c) => (
        <option key={c} value={c}>
          {CURRENCY_LABELS[c]}
        </option>
      ))}
    </select>
  )
}
