import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/conversations/:id/read?userId=
 * Marca como lidas todas as mensagens que não foram enviadas pelo userId.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'userId obrigatório' }, { status: 400 })
  }

  await prisma.message.updateMany({
    where: {
      conversationId: params.id,
      senderId: { not: userId },
      readAt: null,
    },
    data: { readAt: new Date() },
  })

  return NextResponse.json({ ok: true })
}
