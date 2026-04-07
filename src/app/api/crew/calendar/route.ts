import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth } from 'date-fns'

/**
 * GET /api/crew/calendar
 * Parâmetros:
 *  - crewId: (obrigatório)
 *  - month: YYYY-MM
 *
 * Crew vê apenas suas próprias tasks.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const crewId = searchParams.get('crewId')
  const monthParam = searchParams.get('month')

  if (!crewId) {
    return NextResponse.json({ error: 'crewId é obrigatório' }, { status: 400 })
  }

  let from: Date
  let to: Date
  if (monthParam) {
    const [year, month] = monthParam.split('-').map(Number)
    from = startOfMonth(new Date(year, month - 1))
    to = endOfMonth(new Date(year, month - 1))
  } else {
    from = startOfMonth(new Date())
    to = endOfMonth(new Date())
  }

  const tasks = await prisma.task.findMany({
    where: {
      assigneeId: crewId,
      dueDate: { gte: from, lte: to },
    },
    include: {
      checklistItems: { orderBy: { order: 'asc' } },
      assignee: { select: { id: true, name: true } },
      property: { select: { id: true, name: true, address: true } },
      reservation: {
        select: { id: true, guestName: true, checkInDate: true, checkOutDate: true },
      },
    },
    orderBy: { dueDate: 'asc' },
  })

  return NextResponse.json({ tasks, from, to })
}
