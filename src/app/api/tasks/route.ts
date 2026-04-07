import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createTask } from '@/lib/tasks'
import { NoCrewAvailableError } from '@/lib/crew'
import { prisma } from '@/lib/prisma'

const CreateTaskSchema = z.object({
  title: z.string().min(1),
  type: z.enum([
    'CHECK_IN', 'CHECK_OUT', 'CLEANING', 'INSPECTION',
    'MAINTENANCE_PREVENTIVE', 'MAINTENANCE_CORRECTIVE',
  ]),
  dueDate: z.string().datetime(),
  propertyId: z.string().min(1),
  assigneeId: z.string().optional(),
  notes: z.string().optional(),
})

/**
 * POST /api/tasks
 * Criação manual de task (ex: manutenção correctiva pelo calendário).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = CreateTaskSchema.parse(body)

    const property = await prisma.property.findUnique({
      where: { id: data.propertyId },
      select: { id: true, status: true },
    })

    if (!property) {
      return NextResponse.json({ error: 'Propriedade não encontrada' }, { status: 404 })
    }

    if (property.status === 'INACTIVE') {
      return NextResponse.json(
        { error: 'Propriedade inativa' },
        { status: 422 }
      )
    }

    const task = await createTask({
      title: data.title,
      type: data.type,
      dueDate: new Date(data.dueDate),
      propertyId: data.propertyId,
      assigneeId: data.assigneeId,
      notes: data.notes,
    })

    return NextResponse.json(task, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: err.errors }, { status: 400 })
    }
    if (err instanceof NoCrewAvailableError) {
      return NextResponse.json({ error: err.message }, { status: 422 })
    }
    console.error('[POST /api/tasks]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
