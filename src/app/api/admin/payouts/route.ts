import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { estimatePayoutDate, calculateCommission } from '@/lib/payouts'

const CreatePayoutSchema = z.object({
  reservationId: z.string().min(1),
  platform: z.enum(['AIRBNB', 'BOOKING', 'MANUAL']),
  grossAmount: z.number().positive(),
  expectedDate: z.string().datetime().optional(), // obrigatório para MANUAL
  notes: z.string().optional(),
})

/**
 * GET /api/admin/payouts
 * Parâmetros: status, platform, month (YYYY-MM)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const platform = searchParams.get('platform')
  const month = searchParams.get('month')

  let dateFilter = {}
  if (month) {
    const [year, m] = month.split('-').map(Number)
    dateFilter = {
      expectedDate: {
        gte: new Date(year, m - 1, 1),
        lte: new Date(year, m, 0, 23, 59, 59),
      },
    }
  }

  const payouts = await prisma.payout.findMany({
    where: {
      ...(status && { status }),
      ...(platform && { platform }),
      ...dateFilter,
    },
    include: {
      reservation: {
        select: {
          id: true,
          guestName: true,
          checkInDate: true,
          checkOutDate: true,
          property: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { expectedDate: 'asc' },
  })

  // Totais para o dashboard (sempre sobre TODOS os payouts, ignorando filtros)
  const allPayouts = await prisma.payout.findMany({ select: { grossAmount: true, commissionAmount: true, netAmount: true, status: true } })

  const totals = allPayouts.reduce(
    (acc, p) => {
      acc.gross += p.grossAmount
      acc.commission += p.commissionAmount
      acc.net += p.netAmount
      if (p.status === 'RECEIVED') {
        acc.received += p.grossAmount
        acc.receivedNet += p.netAmount
      }
      if (p.status === 'PENDING' || p.status === 'OVERDUE') {
        acc.pending += p.grossAmount
      }
      if (p.status === 'OVERDUE') acc.overdueCount += 1
      return acc
    },
    { gross: 0, commission: 0, net: 0, received: 0, receivedNet: 0, pending: 0, overdueCount: 0 }
  )

  return NextResponse.json({ payouts, totals })
}

/**
 * POST /api/admin/payouts
 * Cria um payout manualmente ou a partir de uma reserva.
 * A data estimada é calculada automaticamente pela plataforma.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = CreatePayoutSchema.parse(body)

    if (data.platform === 'MANUAL' && !data.expectedDate) {
      return NextResponse.json(
        { error: 'expectedDate é obrigatório para pagamentos manuais' },
        { status: 400 }
      )
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id: data.reservationId },
      select: { id: true, checkInDate: true, checkOutDate: true },
    })

    if (!reservation) {
      return NextResponse.json({ error: 'Reserva não encontrada' }, { status: 404 })
    }

    const expectedDate =
      data.expectedDate
        ? new Date(data.expectedDate)
        : estimatePayoutDate(data.platform, reservation.checkInDate, reservation.checkOutDate)

    const { commissionAmount, netAmount } = calculateCommission(data.grossAmount)

    const payout = await prisma.payout.create({
      data: {
        reservationId: data.reservationId,
        platform: data.platform,
        grossAmount: data.grossAmount,
        commissionAmount,
        netAmount,
        expectedDate,
        notes: data.notes,
      },
      include: {
        reservation: {
          select: {
            guestName: true,
            property: { select: { name: true } },
          },
        },
      },
    })

    return NextResponse.json(payout, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: err.errors }, { status: 400 })
    }
    console.error('[POST /api/admin/payouts]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
