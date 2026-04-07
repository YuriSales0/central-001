import { prisma } from './prisma'
import { CHECKLISTS, DEFAULT_NOTES } from './checklists'
import { assignToLeastBusyCrew, NoCrewAvailableError } from './crew'
import { sendNoCrewAlert } from './email'
import type { TaskType, PlanType } from '@/types'
import { addDays } from 'date-fns'

interface CreateTaskOptions {
  title: string
  type: TaskType
  dueDate: Date
  propertyId: string
  reservationId?: string
  assigneeId?: string
  notes?: string
}

/**
 * Cria uma task com checklist padrão e assignee automático (load balance).
 */
export async function createTask(opts: CreateTaskOptions) {
  let assigneeId = opts.assigneeId

  if (!assigneeId) {
    try {
      assigneeId = await assignToLeastBusyCrew()
    } catch (err) {
      if (err instanceof NoCrewAvailableError) {
        const property = await prisma.property.findUnique({
          where: { id: opts.propertyId },
          select: { name: true },
        })
        await sendNoCrewAlert(property?.name ?? opts.propertyId, opts.reservationId ?? 'N/A')
        throw err
      }
      throw err
    }
  }

  const checklistItems = CHECKLISTS[opts.type].map((text, i) => ({
    text,
    order: i,
  }))

  const task = await prisma.task.create({
    data: {
      title: opts.title,
      type: opts.type,
      dueDate: opts.dueDate,
      propertyId: opts.propertyId,
      reservationId: opts.reservationId,
      assigneeId,
      notes: opts.notes ?? DEFAULT_NOTES[opts.type],
      checklistItems: {
        create: checklistItems,
      },
    },
    include: {
      checklistItems: { orderBy: { order: 'asc' } },
      assignee: { select: { id: true, name: true, email: true } },
      property: { select: { id: true, name: true } },
    },
  })

  return task
}

/**
 * Cria tasks de CHECK_IN e CHECK_OUT a partir de uma reserva.
 */
export async function createReservationTasks(
  reservationId: string,
  propertyId: string,
  checkInDate: Date,
  checkOutDate: Date,
  guestName: string,
) {
  const results = await Promise.allSettled([
    createTask({
      title: `Check-in — ${guestName}`,
      type: 'CHECK_IN',
      dueDate: checkInDate,
      propertyId,
      reservationId,
    }),
    createTask({
      title: `Check-out — ${guestName}`,
      type: 'CHECK_OUT',
      dueDate: checkOutDate,
      propertyId,
      reservationId,
    }),
  ])

  const errors = results.filter((r) => r.status === 'rejected')
  if (errors.length > 0) {
    const msgs = errors.map((e) => (e as PromiseRejectedResult).reason?.message).join('; ')
    throw new Error(`Falha ao criar tasks da reserva: ${msgs}`)
  }

  return results
    .filter((r) => r.status === 'fulfilled')
    .map((r) => (r as PromiseFulfilledResult<Awaited<ReturnType<typeof createTask>>>).value)
}

/**
 * Gera tasks de manutenção preventiva para uma propriedade.
 * CLEANING: cada 30 dias | INSPECTION: cada 90 dias
 * Apenas para planos MID e PREMIUM.
 */
export async function generatePreventiveTasks(
  propertyId: string,
  planType: PlanType,
  months = 3,
) {
  if (planType === 'FREE') return []

  const today = new Date()
  today.setHours(8, 0, 0, 0)
  const taskPromises = []

  const totalDays = months * 30

  for (let day = 30; day <= totalDays; day += 30) {
    const dueDate = addDays(today, day)
    taskPromises.push(
      createTask({
        title: `Limpeza profunda — ${dueDate.toLocaleDateString('pt-BR')}`,
        type: 'CLEANING',
        dueDate,
        propertyId,
      })
    )
  }

  for (let day = 90; day <= totalDays; day += 90) {
    const dueDate = addDays(today, day)
    taskPromises.push(
      createTask({
        title: `Inspeção geral — ${dueDate.toLocaleDateString('pt-BR')}`,
        type: 'INSPECTION',
        dueDate,
        propertyId,
      })
    )
  }

  const results = await Promise.allSettled(taskPromises)
  return results
    .filter((r) => r.status === 'fulfilled')
    .map((r) => (r as PromiseFulfilledResult<Awaited<ReturnType<typeof createTask>>>).value)
}

/**
 * Cria task de limpeza pós-checkout.
 * Apenas para planos MID e PREMIUM.
 */
export async function createPostCheckoutCleaning(
  propertyId: string,
  planType: PlanType,
  checkOutDate: Date,
  guestName: string,
) {
  if (planType === 'FREE') return null

  const cleaningDate = new Date(checkOutDate)
  cleaningDate.setHours(cleaningDate.getHours() + 2)

  return createTask({
    title: `Limpeza pós-checkout — ${guestName}`,
    type: 'CLEANING',
    dueDate: cleaningDate,
    propertyId,
  })
}
