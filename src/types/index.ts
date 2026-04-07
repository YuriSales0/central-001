import type { Task, ChecklistItem, Property, User, Reservation } from '@prisma/client'

export type { Task, ChecklistItem, Property, User, Reservation }

// ─── String enums (SQLite doesn't support native enums) ──────────────────────
export type Role = 'ADMIN' | 'MANAGER' | 'CREW' | 'CLIENT'
export type PlanType = 'FREE' | 'MID' | 'PREMIUM'
export type PropertyStatus = 'ACTIVE' | 'INACTIVE'
export type ReservationStatus = 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
export type TaskType =
  | 'CHECK_IN'
  | 'CHECK_OUT'
  | 'CLEANING'
  | 'INSPECTION'
  | 'MAINTENANCE_PREVENTIVE'
  | 'MAINTENANCE_CORRECTIVE'
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED'

// ─── Composed types ──────────────────────────────────────────────────────────
export type TaskWithRelations = Task & {
  checklistItems: ChecklistItem[]
  assignee: Pick<User, 'id' | 'name' | 'email'>
  property: Pick<Property, 'id' | 'name'>
  reservation?: Pick<Reservation, 'id' | 'guestName' | 'checkInDate' | 'checkOutDate'> | null
}

export type CalendarEvent = {
  id: string
  title: string
  date: string
  type: TaskType
  status: TaskStatus
  assigneeName: string
  propertyName: string
  checklistTotal: number
  checklistDone: number
}

// ─── Labels & Colors ─────────────────────────────────────────────────────────
export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  CHECK_IN: 'Check-in',
  CHECK_OUT: 'Check-out',
  CLEANING: 'Limpeza',
  INSPECTION: 'Inspeção',
  MAINTENANCE_PREVENTIVE: 'Manutenção Prev.',
  MAINTENANCE_CORRECTIVE: 'Manutenção Corr.',
}

export const TASK_TYPE_COLORS: Record<TaskType, string> = {
  CHECK_IN: 'bg-green-100 text-green-800 border-green-300',
  CHECK_OUT: 'bg-orange-100 text-orange-800 border-orange-300',
  CLEANING: 'bg-blue-100 text-blue-800 border-blue-300',
  INSPECTION: 'bg-purple-100 text-purple-800 border-purple-300',
  MAINTENANCE_PREVENTIVE: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  MAINTENANCE_CORRECTIVE: 'bg-red-100 text-red-800 border-red-300',
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  PENDING: 'Pendente',
  IN_PROGRESS: 'Em andamento',
  DONE: 'Concluída',
  CANCELLED: 'Cancelada',
}

export const PLAN_TYPE_LABELS: Record<PlanType, string> = {
  FREE: 'Grátis',
  MID: 'Mid',
  PREMIUM: 'Premium',
}
