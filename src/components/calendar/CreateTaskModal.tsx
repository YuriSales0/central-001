'use client'

import { useState } from 'react'
import { X, Plus, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import { TASK_TYPE_LABELS } from '@/types'
import type { TaskType } from '@/types'
import { clsx } from 'clsx'

// Tipos criáveis manualmente (não automáticos)
const MANUAL_TYPES: TaskType[] = [
  'MAINTENANCE_CORRECTIVE',
  'MAINTENANCE_PREVENTIVE',
  'CLEANING',
  'INSPECTION',
]

interface Props {
  defaultDate: Date | null          // dia clicado no calendário
  properties: { id: string; name: string }[]
  onClose: () => void
  onCreated: () => void
}

export function CreateTaskModal({ defaultDate, properties, onClose, onCreated }: Props) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState<TaskType>('MAINTENANCE_CORRECTIVE')
  const [propertyId, setPropertyId] = useState(properties[0]?.id ?? '')
  const [dueDate, setDueDate] = useState(
    defaultDate ? format(defaultDate, "yyyy-MM-dd'T'HH:mm") : ''
  )
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  if (!defaultDate) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!propertyId) { setError('Selecione uma propriedade'); return }
    setSaving(true)
    setError('')

    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title || TASK_TYPE_LABELS[type],
        type,
        dueDate: new Date(dueDate).toISOString(),
        propertyId,
        notes: notes || undefined,
      }),
    })

    const data = await res.json()
    setSaving(false)

    if (!res.ok) {
      setError(data.error ?? 'Erro ao criar task')
      return
    }

    onCreated()
    onClose()
  }

  const isCorrective = type === 'MAINTENANCE_CORRECTIVE'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center">
              <Plus size={14} className="text-slate-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Nova task</h2>
              <p className="text-xs text-gray-400">
                {format(defaultDate, "d 'de' MMMM")}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">

          {/* Tipo */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Tipo</label>
            <div className="grid grid-cols-2 gap-2">
              {MANUAL_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={clsx(
                    'text-xs px-3 py-2 rounded-lg border text-left transition-all',
                    type === t
                      ? 'border-slate-700 bg-slate-800 text-white font-medium'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  )}
                >
                  {TASK_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          {/* Alerta manutenção correctiva */}
          {isCorrective && (
            <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <AlertTriangle size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                Manutenção correctiva cobrada à parte. Owner deve aprovar acima de €50.
              </p>
            </div>
          )}

          {/* Título */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Título <span className="text-gray-400">(opcional)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={TASK_TYPE_LABELS[type]}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          {/* Propriedade */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Propriedade</label>
            <select
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <option value="">Selecionar...</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Data/hora */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Data e hora</label>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Descrição do problema <span className="text-gray-400">(opcional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Descreva o problema ou observações..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
            />
          </div>

          {error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 text-sm font-semibold bg-slate-900 text-white rounded-xl hover:bg-slate-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Criando...' : 'Criar task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
