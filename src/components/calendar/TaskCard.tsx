'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { TASK_TYPE_LABELS, TASK_TYPE_COLORS } from '@/types'
import type { TaskType, TaskStatus } from '@/types'
import { CheckSquare, Clock, User } from 'lucide-react'
import { clsx } from 'clsx'

interface TaskCardProps {
  id: string
  title: string
  type: TaskType
  status: TaskStatus
  assigneeName: string
  checklistDone: number
  checklistTotal: number
  onClick: () => void
  draggable?: boolean
  compact?: boolean
}

const STATUS_RING: Record<TaskStatus, string> = {
  PENDING: 'ring-gray-300',
  IN_PROGRESS: 'ring-blue-400',
  DONE: 'ring-green-400 opacity-60',
  CANCELLED: 'ring-red-300 opacity-40 line-through',
}

export function TaskCard({
  id,
  title,
  type,
  status,
  assigneeName,
  checklistDone,
  checklistTotal,
  onClick,
  draggable = true,
  compact = false,
}: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    disabled: !draggable || status === 'DONE' || status === 'CANCELLED',
  })

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(draggable ? { ...listeners, ...attributes } : {})}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={clsx(
        'rounded-md border px-2 py-1 text-xs cursor-pointer select-none',
        'ring-1 transition-shadow hover:shadow-md',
        TASK_TYPE_COLORS[type],
        STATUS_RING[status],
        isDragging && 'opacity-50 shadow-lg z-50 rotate-1',
        compact ? 'truncate' : ''
      )}
      title={title}
    >
      <div className="font-medium truncate">{TASK_TYPE_LABELS[type]}</div>
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
          </div>
        </>
      )}
    </div>
  )
}
