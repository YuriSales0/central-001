import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/crew
 * Retorna todos os crew members ativos para o select de reatribuição.
 */
export async function GET() {
  const crew = await prisma.user.findMany({
    where: { role: 'CREW', active: true },
    select: { id: true, name: true, email: true },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(crew)
}
