'use client'

import { useState } from 'react'
import { X, HelpCircle, Clock, Calendar, CreditCard, Info } from 'lucide-react'
import { PLATFORM_RULES, COMMISSION_RATE } from '@/lib/payouts'
import { clsx } from 'clsx'

const PLATFORM_ICONS: Record<string, string> = {
  AIRBNB: '🏠',
  BOOKING: '🔵',
  MANUAL: '💰',
}

const PLATFORM_COLOR: Record<string, string> = {
  AIRBNB: 'border-rose-200 bg-rose-50',
  BOOKING: 'border-blue-200 bg-blue-50',
  MANUAL: 'border-gray-200 bg-gray-50',
}

export function PayoutHowItWorksModal() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
      >
        <HelpCircle size={13} />
        Como funciona o payout?
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Como funciona o payout?</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Estimativas automáticas por plataforma + comissão
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-400"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-6">

              {/* Fluxo geral */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Clock size={14} className="text-blue-500" />
                  Fluxo geral
                </h3>
                <div className="flex items-center gap-0 text-xs text-center overflow-x-auto">
                  {[
                    { step: '1', label: 'Reserva criada', sub: 'Airbnb / Booking / Manual' },
                    { step: '2', label: 'Payout gerado', sub: 'Data estimada automática' },
                    { step: '3', label: 'Plataforma paga', sub: 'Conforme calendário dela' },
                    { step: '4', label: 'Admin confirma', sub: 'Clica em "Confirmar recebimento"' },
                    { step: '5', label: 'Comissão debitada', sub: `${(COMMISSION_RATE * 100).toFixed(0)}% do bruto` },
                  ].map((item, i, arr) => (
                    <div key={i} className="flex items-center">
                      <div className="flex flex-col items-center min-w-[90px] px-1">
                        <div className="w-7 h-7 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center mb-1.5">
                          {item.step}
                        </div>
                        <div className="font-medium text-gray-700">{item.label}</div>
                        <div className="text-gray-400 text-[10px] mt-0.5">{item.sub}</div>
                      </div>
                      {i < arr.length - 1 && (
                        <div className="w-6 h-px bg-gray-200 flex-shrink-0 mx-1" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Regras por plataforma */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Calendar size={14} className="text-blue-500" />
                  Estimativa por plataforma
                </h3>
                <div className="space-y-3">
                  {(Object.entries(PLATFORM_RULES) as [string, typeof PLATFORM_RULES[keyof typeof PLATFORM_RULES]][]).map(([key, rule]) => (
                    <div
                      key={key}
                      className={clsx(
                        'border rounded-xl p-4',
                        PLATFORM_COLOR[key]
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{PLATFORM_ICONS[key]}</span>
                        <div>
                          <div className="font-semibold text-gray-800 text-sm">{rule.title}</div>
                          <div className="text-xs text-gray-500 font-mono">{rule.description}</div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">{rule.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comissão */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <CreditCard size={14} className="text-blue-500" />
                  Comissão automática
                </h3>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-amber-900">Taxa de comissão</span>
                    <span className="text-xl font-bold text-amber-700">
                      {(COMMISSION_RATE * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs text-amber-800">
                    <div className="flex justify-between">
                      <span>Exemplo — Reserva de</span>
                      <span className="font-mono font-medium">€ 1.000,00</span>
                    </div>
                    <div className="flex justify-between text-amber-600">
                      <span>Comissão ({(COMMISSION_RATE * 100).toFixed(0)}%)</span>
                      <span className="font-mono">– € {(1000 * COMMISSION_RATE).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t border-amber-200 pt-1.5 mt-1.5">
                      <span>Valor líquido (seu)</span>
                      <span className="font-mono">€ {(1000 * (1 - COMMISSION_RATE)).toFixed(2)}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-amber-600 mt-3">
                    A comissão é calculada automaticamente ao criar o payout. O valor líquido é
                    registrado no momento da confirmação de recebimento.
                  </p>
                </div>
              </div>

              {/* Nota sobre limitações */}
              <div className="flex gap-2 bg-gray-50 border border-gray-200 rounded-xl p-4">
                <Info size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-gray-500 leading-relaxed">
                  <strong className="text-gray-600">Importante:</strong> As datas são estimativas baseadas
                  nas políticas públicas do Airbnb e Booking.com. Airbnb e Booking não fornecem
                  webhooks de pagamento para gestores externos — por isso a confirmação é feita
                  manualmente pelo admin quando o dinheiro cai na conta. O sistema marca automaticamente
                  como <strong>Atrasado</strong> se a data estimada passar sem confirmação.
                </p>
              </div>
            </div>

            <div className="px-6 pb-6">
              <button
                onClick={() => setOpen(false)}
                className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
