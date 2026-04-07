import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { generatePreventiveTasks } from '@/lib/tasks'

const Schema = z.object({
  propertyId: z.string().min(1),
  months: z.number().int().min(1).max(12).default(3),
})

/**
 * POST /api/maintenance/generate
 * Gera tasks preventivas (CLEANING + INSPECTION) para uma propriedade.
 * Propriedades FREE ou INACTIVE são bloqueadas.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { propertyId, months } = Schema.parse(body)

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, name: true, planType: true, status: true },
    })

    if (!property) {
      return NextResponse.json({ error: 'Propriedade não encontrada' }, { status: 404 })
    }

    if (property.status === 'INACTIVE') {
      return NextResponse.json(
        { error: 'Propriedade inativa — tasks preventivas não são geradas.' },
        { status: 422 }
      )
    }

    if (property.planType === 'FREE') {
      return NextResponse.json(
        { error: 'Plano FREE não suporta tasks preventivas. Faça upgrade para MID ou PREMIUM.' },
        { status: 422 }
      )
    }

    const tasks = await generatePreventiveTasks(
      propertyId,
      property.planType as import('@/types').PlanType,
      months
    )

    return NextResponse.json(
      {
        generated: tasks.length,
        tasks: tasks.map((t) => ({ id: t.id, type: t.type, dueDate: t.dueDate, title: t.title })),
      },
      { status: 201 }
    )
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: err.errors }, { status: 400 })
    }
    console.error('[POST /api/maintenance/generate]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
