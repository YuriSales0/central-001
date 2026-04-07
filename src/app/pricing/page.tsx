'use client'

import { useState } from 'react'
import { Check, X, Star, Zap } from 'lucide-react'
import { clsx } from 'clsx'
import {
  ALL_PLANS,
  PLAN_LABELS,
  PLAN_COLORS,
  PLAN_FEATURES,
  MONTHLY_PRICES,
  ANNUAL_PRICES,
  COMMISSION_RATES,
  annualDiscount,
  type PlanType,
  type BillingType,
} from '@/lib/plans'

const PLAN_SUBTITLES: Record<PlanType, string> = {
  STARTER: 'Só gestão. Sem manutenção incluída.',
  BASIC:   'Gestão completa + manutenção preventiva.',
  MID:     'Tudo do Basic + IA e resposta prioritária.',
  PREMIUM: 'Experiência total. Sem compromissos.',
}

const PLAN_CTA: Record<PlanType, string> = {
  STARTER: 'Começar grátis',
  BASIC:   '1.º mês grátis',
  MID:     '1.º mês grátis',
  PREMIUM: 'Contactar',
}

const EMERGENCY_RESPONSE: Record<PlanType, string | null> = {
  STARTER: null,
  BASIC:   null,
  MID:     'Emergências < 24h',
  PREMIUM: 'Emergências < 4h',
}

export default function PricingPage() {
  const [billing, setBilling] = useState<BillingType>('MONTHLY')

  function getPrice(plan: PlanType) {
    if (MONTHLY_PRICES[plan] === 0) return null
    return billing === 'MONTHLY' ? MONTHLY_PRICES[plan] : Math.round(ANNUAL_PRICES[plan] / 12)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white">
      {/* Header */}
      <header className="max-w-6xl mx-auto px-6 pt-12 pb-6 text-center">
        <p className="text-sm font-semibold text-amber-400 tracking-widest uppercase mb-3">
          HostMasters
        </p>
        <h1 className="text-4xl font-bold tracking-tight mb-3">
          Your Property in Coastal Spain,<br className="hidden sm:block" /> Managed with Care
        </h1>
        <p className="text-slate-400 max-w-xl mx-auto text-sm">
          Escolha o plano certo para a sua propriedade. Manutenção correctiva cobrada à parte,
          com aprovação do owner acima de €50.
        </p>

        {/* Billing toggle */}
        <div className="inline-flex items-center gap-1 bg-slate-800 rounded-full p-1 mt-8">
          {(['MONTHLY', 'ANNUAL'] as BillingType[]).map((b) => (
            <button
              key={b}
              onClick={() => setBilling(b)}
              className={clsx(
                'px-4 py-1.5 rounded-full text-sm font-medium transition-all',
                billing === b
                  ? 'bg-white text-slate-900 shadow'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              {b === 'MONTHLY' ? 'Mensal' : (
                <span className="flex items-center gap-1.5">
                  Anual
                  <span className="bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    2 meses grátis
                  </span>
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Plan cards */}
      <main className="max-w-6xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-4">
          {ALL_PLANS.map((plan) => {
            const price = getPrice(plan)
            const colors = PLAN_COLORS[plan]
            const isMid = plan === 'MID'
            const discount = annualDiscount(plan)

            return (
              <div
                key={plan}
                className={clsx(
                  'relative flex flex-col rounded-2xl border bg-slate-900 p-6 transition-transform hover:-translate-y-1',
                  colors.card,
                  isMid && 'bg-slate-800'
                )}
              >
                {/* Badge mais popular */}
                {isMid && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="flex items-center gap-1 bg-violet-500 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                      <Star size={10} fill="white" /> Mais popular
                    </span>
                  </div>
                )}

                {/* Plan label */}
                <div className="mb-4">
                  <span className={clsx('text-xs font-bold uppercase tracking-widest', colors.accent)}>
                    {PLAN_LABELS[plan]}
                  </span>
                  <p className="text-xs text-slate-400 mt-1">{PLAN_SUBTITLES[plan]}</p>
                </div>

                {/* Preço */}
                <div className="mb-2">
                  {price !== null ? (
                    <div className="flex items-end gap-1">
                      <span className="text-3xl font-bold">€{price}</span>
                      <span className="text-slate-400 text-sm mb-1">/mês</span>
                    </div>
                  ) : (
                    <div className="text-2xl font-bold text-slate-300">Sem mensalidade</div>
                  )}
                  {billing === 'ANNUAL' && discount > 0 && (
                    <p className="text-xs text-green-400 mt-0.5">
                      €{ANNUAL_PRICES[plan]}/ano · poupa {discount}%
                    </p>
                  )}
                </div>

                {/* Comissão */}
                <div className={clsx('text-sm font-semibold mb-5', colors.accent)}>
                  + {Math.round(COMMISSION_RATES[plan] * 100)}% comissão sobre reservas
                </div>

                {/* CTA */}
                <button
                  className={clsx(
                    'w-full py-2.5 rounded-xl text-sm font-semibold mb-6 transition-colors',
                    isMid
                      ? 'bg-violet-500 hover:bg-violet-400 text-white'
                      : 'bg-slate-700 hover:bg-slate-600 text-white'
                  )}
                >
                  {PLAN_CTA[plan]}
                </button>

                {/* Emergency badge */}
                {EMERGENCY_RESPONSE[plan] && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-400 mb-4">
                    <Zap size={11} fill="currentColor" />
                    {EMERGENCY_RESPONSE[plan]}
                  </div>
                )}

                {/* Features */}
                <ul className="space-y-2.5 flex-1">
                  {PLAN_FEATURES[plan].map((feat) => (
                    <li key={feat.label} className="flex items-start gap-2 text-xs">
                      {feat.included ? (
                        <Check
                          size={13}
                          className={clsx(
                            'flex-shrink-0 mt-0.5',
                            feat.highlight ? colors.accent : 'text-slate-400'
                          )}
                        />
                      ) : (
                        <X size={13} className="flex-shrink-0 mt-0.5 text-slate-700" />
                      )}
                      <span className={clsx(
                        feat.included
                          ? feat.highlight ? 'text-slate-100 font-medium' : 'text-slate-300'
                          : 'text-slate-600'
                      )}>
                        {feat.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        {/* Nota rodapé */}
        <p className="text-center text-xs text-slate-500 mt-10 max-w-xl mx-auto">
          A comissão é calculada sobre o valor líquido recebido das plataformas (Airbnb, Booking, VRBO).
          Manutenção correctiva (reparações, substituições) cobrada à parte em todos os planos,
          com nota fiscal e aprovação do owner acima de €50.
        </p>
      </main>
    </div>
  )
}
