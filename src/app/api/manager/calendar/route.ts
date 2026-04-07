import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth } from 'date-fns'

/**
 * GET /api/manager/calendar
 * Parâmetros:
 *  - managerId: (obrigatório) ID do manager
 *  - viewManagerId: (opcional) ver calendário de outro manager
 *  - month: YYYY-MM
 *  - propertyId: filtro por propriedade
 *
 * Manager vê apenas tasks das propriedades que gerencia.
 * Com viewManagerId pode ver tasks de outro manager (permissão extra).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const managerId = searchParams.get('managerId')
  const viewManagerId = searchParams.get('viewManagerId')
  const monthParam = searchParams.get('month')
  const propertyId = searchParams.get('propertyId')

  if (!managerId) {
    return NextResponse.json({ error: 'managerId é obrigatório' }, { status: 400 })
  }

  // O manager efetivo a visualizar
  const targetManagerId = viewManagerId ?? managerId

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

  // Propriedades do manager alvo
  const managerProperties = await prisma.property.findMany({
    where: { managerId: targetManagerId },
    select: { id: true, name: true },
  })

  const propertyIds = managerProperties.map((p) => p.id)

  if (propertyIds.length === 0) {
    return NextResponse.json({ tasks: [], properties: managerProperties, from, to })
  }

  const tasks = await prisma.task.findMany({
    where: {
      propertyId: { in: propertyId ? [propertyId] : propertyIds },
      dueDate: { gte: from, lte: to },
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

  // Lista de todos os managers para o switcher
  const allManagers = await prisma.user.findMany({
    where: { role: 'MANAGER', active: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json({
    tasks,
    properties: managerProperties,
    allManagers,
    currentManagerId: targetManagerId,
    from,
    to,
  })
}
