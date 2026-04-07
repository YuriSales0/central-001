import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createReservationTasks, createPostCheckoutCleaning } from '@/lib/tasks'
import { NoCrewAvailableError } from '@/lib/crew'

const ReservationSchema = z.object({
  propertyId: z.string().min(1),
  guestName: z.string().min(1),
  guestEmail: z.string().email().optional().nullable(),
  guestPhone: z.string().optional().nullable(),
  checkInDate: z.string().datetime(),
  checkOutDate: z.string().datetime(),
  externalId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

/**
 * POST /api/reservations
 * Cria reserva + tasks automáticas (check-in, check-out, limpeza pós-checkout)
 * Se não houver crew → envia alerta e retorna 422 com instrução
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = ReservationSchema.parse(body)

    // Valida datas
    const checkIn = new Date(data.checkInDate)
    const checkOut = new Date(data.checkOutDate)
    if (checkOut <= checkIn) {
      return NextResponse.json(
        { error: 'checkOutDate deve ser posterior ao checkInDate' },
        { status: 400 }
      )
    }

    // Verifica se a propriedade existe e está ativa com plano pago
    const property = await prisma.property.findUnique({
      where: { id: data.propertyId },
      select: { id: true, name: true, planType: true, status: true },
    })

    if (!property) {
      return NextResponse.json({ error: 'Propriedade não encontrada' }, { status: 404 })
    }

    if (property.status === 'INACTIVE') {
      return NextResponse.json(
        { error: 'Propriedade inativa. Ative a propriedade antes de criar reservas.' },
        { status: 422 }
      )
    }

    // Cria a reserva
    const reservation = await prisma.reservation.create({
      data: {
        propertyId: data.propertyId,
        guestName: data.guestName,
        guestEmail: data.guestEmail ?? null,
        guestPhone: data.guestPhone ?? null,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        externalId: data.externalId ?? null,
        notes: data.notes ?? null,
      },
    })

    // Cria tasks automaticamente
    let tasksCreated: { type: string; id: string }[] = []
    let crewWarning: string | null = null

    try {
      const reservationTasks = await createReservationTasks(
        reservation.id,
        data.propertyId,
        checkIn,
        checkOut,
        data.guestName
      )
      tasksCreated = reservationTasks.map((t) => ({ type: t.type, id: t.id }))

      // Limpeza pós-checkout para planos MID/PREMIUM
      if (property.planType !== 'FREE') {
        const cleaningTask = await createPostCheckoutCleaning(
          data.propertyId,
          property.planType as import('@/types').PlanType,
          checkOut,
          data.guestName
        )
        if (cleaningTask) {
          tasksCreated.push({ type: cleaningTask.type, id: cleaningTask.id })
        }
      }
    } catch (err) {
      if (err instanceof NoCrewAvailableError) {
        crewWarning = err.message
      } else {
        throw err
      }
    }

    return NextResponse.json(
      {
        reservation,
        tasksCreated,
        warning: crewWarning,
      },
      { status: 201 }
    )
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: err.errors }, { status: 400 })
    }
    console.error('[POST /api/reservations]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

/**
 * GET /api/reservations?propertyId=...
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const propertyId = searchParams.get('propertyId')

  const reservations = await prisma.reservation.findMany({
    where: propertyId ? { propertyId } : undefined,
    include: {
      property: { select: { id: true, name: true } },
      tasks: { select: { id: true, type: true, status: true, dueDate: true } },
    },
    orderBy: { checkInDate: 'desc' },
  })

  return NextResponse.json(reservations)
}
