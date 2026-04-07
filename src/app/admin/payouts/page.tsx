'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  ChevronDown,
  Euro,
  Filter,
} from 'lucide-react'
import { clsx } from 'clsx'
import { PayoutHowItWorksModal } from '@/components/payouts/PayoutHowItWorksModal'
import { PLATFORM_LABELS } from '@/lib/payouts'

type PayoutStatus = 'PENDING' | 'RECEIVED' | 'OVERDUE'
type Platform = 'AIRBNB' | 'BOOKING' | 'MANUAL'

interface Payout {
  id: string
  platform: Platform
  status: PayoutStatus
  grossAmount: number
  commissionAmount: number
  netAmount: number
  currency: string
  expectedDate: string
  receivedAt: string | null
  notes: string | null
  reservation: {
    id: string
    guestName: string
    checkInDate: string
    checkOutDate: string
    property: { id: string; name: string }
  }
}

interface Totals {
  gross: number
  commission: number
  net: number
  received: number
  receivedNet: number
  pending: number
}

const STATUS_CONFIG: Record<PayoutStatus, { label: string; icon: React.ReactNode; classes: string }> = {
  PENDING: {
    label: 'Aguardando',
    icon: <Clock size={13} />,
    classes: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  },
  RECEIVED: {
    label: 'Recebido',
    icon: <CheckCircle size={13} />,
    classes: 'bg-green-50 text-green-700 border-green-200',
  },
  OVERDUE: {
    label: 'Atrasado',
    icon: <AlertTriangle size={13} />,
    classes: 'bg-red-50 text-red-700 border-red-200',
  },
}

const PLATFORM_BADGE: Record<Platform, string> = {
  AIRBNB: 'bg-rose-100 text-rose-700',
  BOOKING: 'bg-blue-100 text-blue-700',
  MANUAL: 'bg-gray-100 text-gray-700',
}

function fmt(amount: number, currency = 'EUR') {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [totals, setTotals] = useState<Totals | null>(null)
  const [loading, setLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState<PayoutStatus | 'ALL'>('ALL')
  const [filterPlatform, setFilterPlatform] = useState<Platform | 'ALL'>('ALL')
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  const fetchPayouts = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterStatus !== 'ALL') params.set('status', filterStatus)
    if (filterPlatform !== 'ALL') params.set('platform', filterPlatform)
    const res = await fetch(`/api/admin/payouts?${params}`)
    const data = await res.json()
    setPayouts(data.payouts ?? [])
    setTotals(data.totals ?? null)
    setLoading(false)
  }, [filterStatus, filterPlatform])

  useEffect(() => { fetchPayouts() }, [fetchPayouts])

  async function confirmReceived(id: string) {
    setConfirmingId(id)
    await fetch(`/api/admin/payouts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'RECEIVED', receivedAt: new Date().toISOString() }),
    })
    setConfirmingId(null)
    fetchPayouts()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Payouts</h1>
            <p className="text-sm text-gray-500">Recebimentos das plataformas</p>
          </div>
          <div className="flex items-center gap-3">
            {/* ← BOTÃO DE EXPLICAÇÃO */}
            <PayoutHowItWorksModal />
            <a href="/" className="text-sm text-gray-500 hover:text-gray-700">← Início</a>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6 space-y-6">

        {/* KPI cards */}
        {totals && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total bruto', value: fmt(totals.gross), sub: 'todos os status', color: 'text-gray-900' },
              { label: 'Comissões', value: fmt(totals.commission), sub: '18% do bruto', color: 'text-amber-600' },
              { label: 'Recebido (líquido)', value: fmt(totals.receivedNet), sub: 'confirmados', color: 'text-green-600' },
              { label: 'A receber', value: fmt(totals.pending), sub: 'pendente + atrasado', color: 'text-blue-600' },
            ].map((kpi) => (
              <div key={kpi.label} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="text-xs text-gray-500 mb-1">{kpi.label}</div>
                <div className={clsx('text-xl font-bold', kpi.color)}>{kpi.value}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">{kpi.sub}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-3">
          <Filter size={14} className="text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as PayoutStatus | 'ALL')}
            className="text-xs border rounded-lg px-2 py-1.5"
          >
            <option value="ALL">Todos os status</option>
            <option value="PENDING">Aguardando</option>
            <option value="RECEIVED">Recebido</option>
            <option value="OVERDUE">Atrasado</option>
          </select>
          <select
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value as Platform | 'ALL')}
            className="text-xs border rounded-lg px-2 py-1.5"
          >
            <option value="ALL">Todas as plataformas</option>
            <option value="AIRBNB">Airbnb</option>
            <option value="BOOKING">Booking.com</option>
            <option value="MANUAL">Manual</option>
          </select>
          {loading && <span className="text-xs text-gray-400">Carregando...</span>}
          <span className="ml-auto text-xs text-gray-400">{payouts.length} registro{payouts.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Tabela */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {payouts.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <Euro size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhum payout encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Reserva / Propriedade', 'Plataforma', 'Data esperada', 'Bruto', 'Comissão', 'Líquido', 'Status', ''].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {payouts.map((payout) => {
                    const cfg = STATUS_CONFIG[payout.status]
                    const isOverdue = payout.status === 'OVERDUE'
                    return (
                      <tr
                        key={payout.id}
                        className={clsx('hover:bg-gray-50/50 transition-colors', isOverdue && 'bg-red-50/30')}
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{payout.reservation.guestName}</div>
                          <div className="text-xs text-gray-400">{payout.reservation.property.name}</div>
                          <div className="text-[10px] text-gray-300 mt-0.5">
                            {format(new Date(payout.reservation.checkInDate), 'dd/MM')} →{' '}
                            {format(new Date(payout.reservation.checkOutDate), 'dd/MM/yy')}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full', PLATFORM_BADGE[payout.platform])}>
                            {PLATFORM_LABELS[payout.platform]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                          {format(new Date(payout.expectedDate), "d 'de' MMM, yyyy", { locale: ptBR })}
                          {payout.receivedAt && (
                            <div className="text-[10px] text-green-500 mt-0.5">
                              Recebido em {format(new Date(payout.receivedAt), 'dd/MM/yy')}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-sm text-gray-900 whitespace-nowrap">
                          {fmt(payout.grossAmount)}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-amber-600 whitespace-nowrap">
                          – {fmt(payout.commissionAmount)}
                        </td>
                        <td className="px-4 py-3 font-mono text-sm font-semibold text-green-700 whitespace-nowrap">
                          {fmt(payout.netAmount)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={clsx('inline-flex items-center gap-1 text-xs border rounded-full px-2 py-0.5', cfg.classes)}>
                            {cfg.icon}
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {(payout.status === 'PENDING' || payout.status === 'OVERDUE') && (
                            <button
                              onClick={() => confirmReceived(payout.id)}
                              disabled={confirmingId === payout.id}
                              className="text-xs px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors whitespace-nowrap"
                            >
                              {confirmingId === payout.id ? 'Confirmando...' : 'Confirmar recebimento'}
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
