import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth } from 'date-fns'

/**
 * GET /api/admin/calendar
 * Parâmetros:
 *  - month: YYYY-MM  (default: mês atual)
 *  - propertyId: filtro por propriedade
 *  - type: filtro por tipo de task
 *  - status: filtro por status
 *
 * Admin vê todas as tasks de todas as propriedades.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const monthParam = searchParams.get('month')
  const propertyId = searchParams.get('propertyId')
  const type = searchParams.get('type')
  const status = searchParams.get('status')

  // Parse do mês
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
      dueDate: { gte: from, lte: to },
      ...(propertyId && { propertyId }),
      ...(type && { type: type as never }),
      ...(status && { status: status as never }),
    },
    include: {
      checklistItems: { select: { id: true, completed: true } },
      assignee: { select: { id: true, name: true } },
      property: { select: { id: true, name: true } },
      reservation: {
        select: { id: true, guestName: true, checkInDate: true, checkOutDate: true },
      },
    },
    orderBy: { dueDate: 'asc' },
  })

  // Lista de propriedades para o filtro
  const properties = await prisma.property.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json({ tasks, properties, from, to })
}
