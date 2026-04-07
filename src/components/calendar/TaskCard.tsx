'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { TASK_TYPE_LABELS, TASK_TYPE_COLORS } from '@/types'
import type { TaskType, TaskStatus } from '@/types'
import { CheckSquare, User, AlertCircle } from 'lucide-react'
import { clsx } from 'clsx'
import { isPast, parseISO } from 'date-fns'

interface TaskCardProps {
  id: string
  title: string
  type: TaskType
  status: TaskStatus
  dueDate: string
  assigneeName: string
  checklistDone: number
  checklistTotal: number
  onClick: () => void
  draggable?: boolean
  compact?: boolean
}

const STATUS_RING: Record<TaskStatus, string> = {
  PENDING:     'ring-gray-300',
  IN_PROGRESS: 'ring-blue-400',
  DONE:        'ring-green-400 opacity-60',
  CANCELLED:   'ring-red-300 opacity-40 line-through',
}

function isOverdue(dueDate: string, status: TaskStatus) {
  if (status === 'DONE' || status === 'CANCELLED') return false
  return isPast(parseISO(dueDate))
}

export function TaskCard({
  id,
  title,
  type,
  status,
  dueDate,
  assigneeName,
  checklistDone,
  checklistTotal,
  onClick,
  draggable = true,
  compact = false,
}: TaskCardProps) {
  const overdue = isOverdue(dueDate, status)

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    disabled: !draggable || status === 'DONE' || status === 'CANCELLED',
  })

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(draggable ? { ...listeners, ...attributes } : {})}
      onClick={(e) => { e.stopPropagation(); onClick() }}
      className={clsx(
        'relative rounded-md border px-2 py-1 text-xs cursor-pointer select-none',
        'ring-1 transition-shadow hover:shadow-md',
        TASK_TYPE_COLORS[type as TaskType],
        overdue ? 'ring-red-500 ring-2' : STATUS_RING[status],
        isDragging && 'opacity-50 shadow-lg z-50 rotate-1',
        compact ? 'truncate' : ''
      )}
      title={overdue ? `⚠ Atrasada — ${title}` : title}
    >
      {/* Badge overdue */}
      {overdue && (
        <span className="absolute -top-1.5 -right-1.5 bg-red-500 rounded-full p-0.5 shadow">
          <AlertCircle size={9} className="text-white" />
        </span>
      )}

      <div className={clsx('font-medium truncate', overdue && 'text-red-700')}>
        {TASK_TYPE_LABELS[type as TaskType]}
      </div>

      {!compact && (
        <>
          <div className="truncate text-[10px] mt-0.5 opacity-80">{title}</div>
          <div className="flex items-center gap-2 mt-1 opacity-70">
            <span className="flex items-center gap-0.5">
              <User size={10} />
              {assigneeName}
            </span>
            {checklistTotal > 0 && (
              <span className="flex items-center gap-0.5">
                <CheckSquare size={10} />
                {checklistDone}/{checklistTotal}
              </span>
            )}
            {overdue && (
              <span className="ml-auto text-red-600 font-semibold text-[9px] uppercase tracking-wide">
                Atrasada
              </span>
            )}
          </div>
        </>
      )}
    </div>
  )
}
