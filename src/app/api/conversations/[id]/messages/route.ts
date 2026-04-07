import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const SendSchema = z.object({
  senderId: z.string().min(1),
  content: z.string().min(1),
})

/**
 * GET /api/conversations/:id/messages
 * Retorna todas as mensagens da conversa, ordem cronológica.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const messages = await prisma.message.findMany({
    where: { conversationId: params.id },
    include: { sender: { select: { id: true, name: true, avatar: true, role: true } } },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(messages)
}

/**
 * POST /api/conversations/:id/messages
 * Envia uma nova mensagem. Só client e manager da conversa podem enviar.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const { senderId, content } = SendSchema.parse(body)

    const conversation = await prisma.conversation.findUnique({
      where: { id: params.id },
      select: { clientId: true, managerId: true },
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 })
    }

    // Apenas client e manager da conversa podem enviar
    if (senderId !== conversation.clientId && senderId !== conversation.managerId) {
      return NextResponse.json({ error: 'Sem permissão para enviar mensagem' }, { status: 403 })
    }

    const message = await prisma.message.create({
      data: { conversationId: params.id, senderId, content },
      include: { sender: { select: { id: true, name: true, avatar: true, role: true } } },
    })

    // Bump updatedAt para ordenar conversa no topo
    await prisma.conversation.update({
      where: { id: params.id },
      data: { updatedAt: new Date() },
    })

    return NextResponse.json(message, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }
    console.error('[POST /api/conversations/:id/messages]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
