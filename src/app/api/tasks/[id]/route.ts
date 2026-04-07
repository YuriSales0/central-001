import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const UpdateTaskSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'DONE', 'CANCELLED']).optional(),
  dueDate: z.string().datetime().optional(),      // drag & drop → só muda dueDate
  assigneeId: z.string().optional(),              // reassign manual pelo admin
  notes: z.string().optional(),
  description: z.string().optional(),             // relatório de vistoria (check-out)
  checklistItems: z
    .array(z.object({ id: z.string(), completed: z.boolean() }))
    .optional(),
})

/**
 * GET /api/tasks/:id
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const task = await prisma.task.findUnique({
    where: { id: params.id },
    include: {
      checklistItems: { orderBy: { order: 'asc' } },
      assignee: { select: { id: true, name: true, email: true } },
      property: { select: { id: true, name: true } },
      reservation: {
        select: { id: true, guestName: true, checkInDate: true, checkOutDate: true },
      },
    },
  })

  if (!task) {
    return NextResponse.json({ error: 'Task não encontrada' }, { status: 404 })
  }

  return NextResponse.json(task)
}

/**
 * PATCH /api/tasks/:id
 * - Atualiza status, dueDate (drag & drop), assignee, notas e checklist
 * - Quando status = DONE, seta completedAt automaticamente
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const data = UpdateTaskSchema.parse(body)

    const task = await prisma.task.findUnique({ where: { id: params.id } })
    if (!task) {
      return NextResponse.json({ error: 'Task não encontrada' }, { status: 404 })
    }

    // Atualiza checklist items separadamente
    if (data.checklistItems && data.checklistItems.length > 0) {
      await Promise.all(
        data.checklistItems.map((item) =>
          prisma.checklistItem.update({
            where: { id: item.id },
            data: { completed: item.completed },
          })
        )
      )
    }

    // Atualiza a task
    const updated = await prisma.task.update({
      where: { id: params.id },
      data: {
        ...(data.status && { status: data.status }),
        ...(data.dueDate && { dueDate: new Date(data.dueDate) }),
        ...(data.assigneeId && { assigneeId: data.assigneeId }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.status === 'DONE' && { completedAt: new Date() }),
        // Se reabriu → limpa completedAt
        ...(data.status && data.status !== 'DONE' && task.completedAt && {
          completedAt: null,
        }),
      },
      include: {
        checklistItems: { orderBy: { order: 'asc' } },
        assignee: { select: { id: true, name: true, email: true } },
        property: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(updated)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: err.errors }, { status: 400 })
    }
    console.error('[PATCH /api/tasks/:id]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
