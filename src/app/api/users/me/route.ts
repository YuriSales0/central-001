import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/users/me
 * Retorna o perfil completo do utilizador autenticado (incluindo managerId).
 */
export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, role: true, avatar: true, managerId: true },
  })

  if (!user) {
    return NextResponse.json({ error: 'Utilizador não encontrado' }, { status: 404 })
  }

  return NextResponse.json({ user })
}
