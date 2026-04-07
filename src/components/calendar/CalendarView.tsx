'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { restrictToWindowEdges } from '@dnd-kit/modifiers'
import { useDroppable } from '@dnd-kit/core'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { clsx } from 'clsx'
import { TaskCard } from './TaskCard'
import { TaskDetailModal } from './TaskDetailModal'
import { TASK_TYPE_LABELS } from '@/types'
import type { TaskType, TaskStatus } from '@/types'

export interface CalendarTask {
  id: string
  title: string
  type: TaskType
  status: TaskStatus
  dueDate: string
  assigneeName: string
  propertyName: string
  checklistDone: number
  checklistTotal: number
}

interface Props {
  tasks: CalendarTask[]
  onMonthChange: (month: string) => void  // YYYY-MM
  onTaskUpdated: () => void
  canReassign?: boolean
  crewList?: { id: string; name: string }[]
  // Filtros
  properties?: { id: string; name: string }[]
  onPropertyFilter?: (id: string | null) => void
  // Manager switcher
  allManagers?: { id: string; name: string }[]
  currentManagerId?: string
  onManagerSwitch?: (managerId: string) => void
}

function DroppableDay({
  date,
  children,
  isCurrentMonth,
}: {
  date: Date
  children: React.ReactNode
  isCurrentMonth: boolean
}) {
  const { setNodeRef, isOver } = useDroppable({ id: format(date, 'yyyy-MM-dd') })

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        'min-h-[90px] p-1 border-b border-r border-gray-100 transition-colors',
        isOver && 'bg-blue-50',
        !isCurrentMonth && 'bg-gray-50/40'
      )}
    >
      {children}
    </div>
  )
}

const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function CalendarView({
  tasks,
  onMonthChange,
  onTaskUpdated,
  canReassign,
  crewList,
  properties,
  onPropertyFilter,
  allManagers,
  currentManagerId,
  onManagerSwitch,
}: Props) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [draggingTask, setDraggingTask] = useState<CalendarTask | null>(null)
  const [filterType, setFilterType] = useState<TaskType | 'ALL'>('ALL')
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'ALL'>('ALL')
  const [filterProperty, setFilterProperty] = useState<string>('ALL')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const navigate = (dir: 'prev' | 'next') => {
    const next = dir === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1)
    setCurrentDate(next)
    onMonthChange(format(next, 'yyyy-MM'))
  }

  // Grid de dias
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd })

  // Filtra tasks
  const filteredTasks = tasks.filter((t) => {
    if (filterType !== 'ALL' && t.type !== filterType) return false
    if (filterStatus !== 'ALL' && t.status !== filterStatus) return false
    if (filterProperty !== 'ALL' && t.propertyName !== filterProperty) return false
    return true
  })

  // Agrupa por dia
  const tasksByDay = filteredTasks.reduce<Record<string, CalendarTask[]>>((acc, task) => {
    const day = task.dueDate.slice(0, 10)
    if (!acc[day]) acc[day] = []
    acc[day].push(task)
    return acc
  }, {})

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setDraggingTask(null)
    if (!over || active.id === over.id) return

    const taskId = active.id as string
    const newDate = over.id as string  // formato YYYY-MM-DD

    // Atualiza a data (dueDate)
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return

    const current = new Date(task.dueDate)
    const [year, month, day] = newDate.split('-').map(Number)
    const updated = new Date(year, month - 1, day, current.getHours(), current.getMinutes())

    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dueDate: updated.toISOString() }),
    })
    onTaskUpdated()
  }

  const typeOptions: (TaskType | 'ALL')[] = [
    'ALL', 'CHECK_IN', 'CHECK_OUT', 'CLEANING', 'INSPECTION',
    'MAINTENANCE_PREVENTIVE', 'MAINTENANCE_CORRECTIVE',
  ]
  const statusOptions: (TaskStatus | 'ALL')[] = ['ALL', 'PENDING', 'IN_PROGRESS', 'DONE', 'CANCELLED']

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Navegação mês */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('prev')}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <h2 className="text-base font-semibold w-36 text-center">
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </h2>
          <button
            onClick={() => navigate('next')}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
          <button
            onClick={() => {
              setCurrentDate(new Date())
              onMonthChange(format(new Date(), 'yyyy-MM'))
            }}
            className="text-xs px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Hoje
          </button>
        </div>

        {/* Filtro por tipo */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as TaskType | 'ALL')}
          className="text-xs border rounded-lg px-2 py-1.5"
        >
          <option value="ALL">Todos os tipos</option>
          {typeOptions.slice(1).map((t) => (
            <option key={t} value={t}>{TASK_TYPE_LABELS[t as TaskType] ?? t}</option>
          ))}
        </select>

        {/* Filtro por status */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as TaskStatus | 'ALL')}
          className="text-xs border rounded-lg px-2 py-1.5"
        >
          <option value="ALL">Todos os status</option>
          <option value="PENDING">Pendente</option>
          <option value="IN_PROGRESS">Em andamento</option>
          <option value="DONE">Concluída</option>
          <option value="CANCELLED">Cancelada</option>
        </select>

        {/* Filtro por propriedade */}
        {properties && onPropertyFilter && (
          <select
            value={filterProperty}
            onChange={(e) => {
              setFilterProperty(e.target.value)
              onPropertyFilter(e.target.value === 'ALL' ? null : e.target.value)
            }}
            className="text-xs border rounded-lg px-2 py-1.5"
          >
            <option value="ALL">Todas as propriedades</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}

        {/* Manager switcher */}
        {allManagers && allManagers.length > 1 && onManagerSwitch && (
          <select
            value={currentManagerId}
            onChange={(e) => onManagerSwitch(e.target.value)}
            className="text-xs border rounded-lg px-2 py-1.5 bg-amber-50 border-amber-200"
          >
            {allManagers.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        )}

        <span className="ml-auto text-xs text-gray-400">
          {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Calendar grid */}
      <DndContext
        sensors={sensors}
        modifiers={[restrictToWindowEdges]}
        onDragStart={(e) => {
          setDraggingTask(tasks.find((t) => t.id === e.active.id) ?? null)
        }}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 border border-gray-200 rounded-xl overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
            {WEEK_DAYS.map((d) => (
              <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {calDays.map((day) => {
              const dayKey = format(day, 'yyyy-MM-dd')
              const dayTasks = tasksByDay[dayKey] ?? []
              const inMonth = isSameMonth(day, currentDate)
              const today = isToday(day)

              return (
                <DroppableDay key={dayKey} date={day} isCurrentMonth={inMonth}>
                  {/* Day number */}
                  <div className="flex justify-end mb-1">
                    <span
                      className={clsx(
                        'text-xs w-5 h-5 flex items-center justify-center rounded-full',
                        today && 'bg-blue-500 text-white font-bold',
                        !today && inMonth && 'text-gray-700',
                        !today && !inMonth && 'text-gray-300'
                      )}
                    >
                      {format(day, 'd')}
                    </span>
                  </div>

                  {/* Tasks (max 3 visible) */}
                  <div className="space-y-0.5">
                    {dayTasks.slice(0, 3).map((task) => (
                      <TaskCard
                        key={task.id}
                        id={task.id}
                        title={task.title}
                        type={task.type}
                        status={task.status}
                        assigneeName={task.assigneeName}
                        checklistDone={task.checklistDone}
                        checklistTotal={task.checklistTotal}
                        onClick={() => setSelectedTaskId(task.id)}
                        compact
                      />
                    ))}
                    {dayTasks.length > 3 && (
                      <div className="text-[10px] text-gray-400 pl-1">
                        +{dayTasks.length - 3} mais
                      </div>
                    )}
                  </div>
                </DroppableDay>
              )
            })}
          </div>
        </div>

        {/* Drag overlay */}
        <DragOverlay>
          {draggingTask && (
            <div className="shadow-2xl rotate-2 opacity-90 w-28">
              <TaskCard
                id={draggingTask.id}
                title={draggingTask.title}
                type={draggingTask.type}
                status={draggingTask.status}
                assigneeName={draggingTask.assigneeName}
                checklistDone={draggingTask.checklistDone}
                checklistTotal={draggingTask.checklistTotal}
                onClick={() => {}}
                draggable={false}
                compact
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Task detail modal */}
      <TaskDetailModal
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onUpdated={onTaskUpdated}
        canReassign={canReassign}
        crewList={crewList}
      />
    </div>
  )
}
