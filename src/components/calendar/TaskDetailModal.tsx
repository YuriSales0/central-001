'use client'

import { useState, useEffect } from 'react'
import { X, CheckSquare, Square, User, Calendar, MapPin, StickyNote, RefreshCw, ClipboardList, AlertTriangle } from 'lucide-react'
import {
  TASK_TYPE_LABELS,
  TASK_TYPE_COLORS,
  TASK_STATUS_LABELS,
} from '@/types'
import type { TaskWithRelations, TaskStatus, TaskType } from '@/types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { clsx } from 'clsx'

interface Props {
  taskId: string | null
  onClose: () => void
  onUpdated: () => void
  canReassign?: boolean  // admin pode reatribuir
  crewList?: { id: string; name: string }[]
}

const STATUS_OPTIONS: { value: TaskStatus; label: string; color: string }[] = [
  { value: 'PENDING', label: 'Pendente', color: 'bg-gray-100 text-gray-700' },
  { value: 'IN_PROGRESS', label: 'Em andamento', color: 'bg-blue-100 text-blue-700' },
  { value: 'DONE', label: 'Concluída', color: 'bg-green-100 text-green-700' },
  { value: 'CANCELLED', label: 'Cancelada', color: 'bg-red-100 text-red-700' },
]

export function TaskDetailModal({ taskId, onClose, onUpdated, canReassign, crewList }: Props) {
  const [task, setTask] = useState<TaskWithRelations | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notes, setNotes] = useState('')
  const [editingNotes, setEditingNotes] = useState(false)

  // Report de checkout obrigatório
  const [showReport, setShowReport] = useState(false)
  const [reportCondition, setReportCondition] = useState<number>(5)     // 1-5 estrelas
  const [reportIssues, setReportIssues] = useState('')
  const [reportDamages, setReportDamages] = useState('')
  const [reportNotes, setReportNotes] = useState('')

  useEffect(() => {
    if (!taskId) { setTask(null); return }
    setLoading(true)
    fetch(`/api/tasks/${taskId}`)
      .then((r) => r.json())
      .then((data) => {
        setTask(data)
        setNotes(data.notes ?? '')
      })
      .finally(() => setLoading(false))
  }, [taskId])

  if (!taskId) return null

  async function toggleChecklist(itemId: string, completed: boolean) {
    if (!task) return
    setSaving(true)
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checklistItems: [{ id: itemId, completed }] }),
    })
    // Atualiza local
    setTask((prev) =>
      prev
        ? {
            ...prev,
            checklistItems: prev.checklistItems.map((ci) =>
              ci.id === itemId ? { ...ci, completed } : ci
            ),
          }
        : prev
    )
    setSaving(false)
    onUpdated()
  }

  async function changeStatus(status: TaskStatus) {
    if (!task) return

    // CHECK_OUT → DONE exige report de vistoria
    if (status === 'DONE' && task.type === 'CHECK_OUT') {
      setShowReport(true)
      return
    }

    setSaving(true)
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setTask((prev) => prev ? { ...prev, status } : prev)
    setSaving(false)
    onUpdated()
  }

  async function submitCheckoutReport() {
    if (!task) return
    setSaving(true)

    const reportText = [
      `📋 RELATÓRIO DE VISTORIA`,
      `Estado geral: ${'★'.repeat(reportCondition)}${'☆'.repeat(5 - reportCondition)} (${reportCondition}/5)`,
      reportIssues  ? `Problemas encontrados:\n${reportIssues}` : null,
      reportDamages ? `Danos / avarias:\n${reportDamages}` : null,
      reportNotes   ? `Observações:\n${reportNotes}` : null,
    ].filter(Boolean).join('\n\n')

    await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'DONE', description: reportText }),
    })

    setTask((prev) => prev ? { ...prev, status: 'DONE', description: reportText } : prev)
    setShowReport(false)
    setSaving(false)
    onUpdated()
  }

  async function changeAssignee(assigneeId: string) {
    if (!task) return
    setSaving(true)
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assigneeId }),
    })
    const updated = await res.json()
    setTask((prev) => prev ? { ...prev, assignee: updated.assignee } : prev)
    setSaving(false)
    onUpdated()
  }

  async function saveNotes() {
    if (!task) return
    setSaving(true)
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    })
    setTask((prev) => prev ? { ...prev, notes } : prev)
    setEditingNotes(false)
    setSaving(false)
    onUpdated()
  }

  const checklistDone = task?.checklistItems.filter((ci) => ci.completed).length ?? 0
  const checklistTotal = task?.checklistItems.length ?? 0
  const progress = checklistTotal > 0 ? Math.round((checklistDone / checklistTotal) * 100) : 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <RefreshCw className="animate-spin text-gray-400" />
          </div>
        ) : task ? (
          <>
            {/* Header */}
            <div className={clsx('rounded-t-xl px-5 py-4', TASK_TYPE_COLORS[task.type as TaskType])}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wide opacity-70">
                    {TASK_TYPE_LABELS[task.type as TaskType]}
                  </span>
                  <h2 className="font-bold text-base mt-0.5">{task.title}</h2>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-full p-1 hover:bg-black/10 transition-colors flex-shrink-0"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Status selector */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => changeStatus(opt.value)}
                    className={clsx(
                      'px-2.5 py-0.5 rounded-full text-xs font-medium transition-all border',
                      task.status === opt.value
                        ? `${opt.color} border-current font-bold ring-2 ring-offset-1 ring-current`
                        : 'bg-white/50 text-gray-600 border-gray-300 hover:bg-white'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-4">
              {/* Meta */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar size={14} className="flex-shrink-0" />
                  <span>
                    {format(new Date(task.dueDate), "d 'de' MMMM, yyyy", { locale: ptBR })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin size={14} className="flex-shrink-0" />
                  <span className="truncate">{task.property.name}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 col-span-2">
                  <User size={14} className="flex-shrink-0" />
                  {canReassign && crewList && crewList.length > 0 ? (
                    <select
                      value={task.assignee.id}
                      onChange={(e) => changeAssignee(e.target.value)}
                      className="text-sm border rounded px-1 py-0.5 w-full max-w-[200px]"
                    >
                      {crewList.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  ) : (
                    <span>{task.assignee.name}</span>
                  )}
                </div>
              </div>

              {/* Reserva */}
              {task.reservation && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm">
                  <div className="font-medium text-amber-800">
                    Hóspede: {task.reservation.guestName}
                  </div>
                  <div className="text-amber-600 text-xs mt-0.5">
                    {format(new Date(task.reservation.checkInDate), 'dd/MM')} →{' '}
                    {format(new Date(task.reservation.checkOutDate), 'dd/MM/yyyy')}
                  </div>
                </div>
              )}

              {/* Progress bar */}
              {checklistTotal > 0 && (
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Checklist</span>
                    <span>{checklistDone}/{checklistTotal} — {progress}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Checklist */}
              {task.checklistItems.length > 0 && (
                <div className="space-y-1.5">
                  {task.checklistItems.map((item) => (
                    <label
                      key={item.id}
                      className="flex items-start gap-2 cursor-pointer group"
                    >
                      <button
                        onClick={() => toggleChecklist(item.id, !item.completed)}
                        className="mt-0.5 flex-shrink-0 text-gray-400 group-hover:text-blue-500 transition-colors"
                      >
                        {item.completed ? (
                          <CheckSquare size={16} className="text-green-500" />
                        ) : (
                          <Square size={16} />
                        )}
                      </button>
                      <span
                        className={clsx(
                          'text-sm',
                          item.completed ? 'line-through text-gray-400' : 'text-gray-700'
                        )}
                      >
                        {item.text}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              {/* Notas */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1 text-xs font-medium text-gray-500">
                    <StickyNote size={12} /> Observações
                  </span>
                  {!editingNotes && (
                    <button
                      onClick={() => setEditingNotes(true)}
                      className="text-xs text-blue-500 hover:underline"
                    >
                      Editar
                    </button>
                  )}
                </div>
                {editingNotes ? (
                  <div className="space-y-2">
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={saveNotes}
                        disabled={saving}
                        className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 disabled:opacity-50"
                      >
                        Salvar
                      </button>
                      <button
                        onClick={() => { setNotes(task.notes ?? ''); setEditingNotes(false) }}
                        className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded hover:bg-gray-200"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 whitespace-pre-line bg-gray-50 rounded-lg px-3 py-2 min-h-[48px]">
                    {task.notes || <span className="italic text-gray-400">Sem observações</span>}
                  </p>
                )}
              </div>

              {task.completedAt && (
                <div className="text-xs text-green-600 text-right">
                  Concluída em{' '}
                  {format(new Date(task.completedAt), "d MMM yyyy 'às' HH:mm", { locale: ptBR })}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="p-8 text-center text-gray-400">Task não encontrada.</div>
        )}
      </div>

      {/* ── Modal de relatório de vistoria (CHECK_OUT → DONE) ── */}
      {showReport && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowReport(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                <ClipboardList size={16} className="text-orange-600" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-900">Relatório de vistoria</h3>
                <p className="text-xs text-gray-400">Obrigatório para concluir o check-out</p>
              </div>
              <button onClick={() => setShowReport(false)} className="ml-auto p-1.5 rounded-full hover:bg-gray-100 text-gray-400">
                <X size={15} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Aviso */}
              <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <AlertTriangle size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  Preencha a vistoria antes de fechar o check-out. Este relatório ficará registado na task.
                </p>
              </div>

              {/* Estado geral */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Estado geral da propriedade
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setReportCondition(n)}
                      className={clsx(
                        'flex-1 py-2 rounded-lg text-sm font-bold border transition-all',
                        reportCondition >= n
                          ? 'bg-amber-400 border-amber-400 text-white'
                          : 'border-gray-200 text-gray-300 hover:border-amber-200'
                      )}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-1 text-center">
                  {['', 'Muito mau', 'Mau', 'Razoável', 'Bom', 'Excelente'][reportCondition]}
                </p>
              </div>

              {/* Problemas */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Problemas encontrados <span className="text-gray-400">(opcional)</span>
                </label>
                <textarea
                  value={reportIssues}
                  onChange={(e) => setReportIssues(e.target.value)}
                  rows={2}
                  placeholder="Ex: Lâmpada fundida no quarto, torneira pingando..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
                />
              </div>

              {/* Danos */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Danos ou avarias <span className="text-gray-400">(opcional)</span>
                </label>
                <textarea
                  value={reportDamages}
                  onChange={(e) => setReportDamages(e.target.value)}
                  rows={2}
                  placeholder="Ex: Arranhão no sofá, taça partida..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
                />
              </div>

              {/* Observações */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Observações gerais <span className="text-gray-400">(opcional)</span>
                </label>
                <textarea
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                  rows={2}
                  placeholder="Qualquer outra informação relevante..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2 px-5 pb-5">
              <button
                onClick={() => setShowReport(false)}
                className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={submitCheckoutReport}
                disabled={saving}
                className="flex-1 py-2.5 text-sm font-semibold bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Guardando...' : 'Concluir check-out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
