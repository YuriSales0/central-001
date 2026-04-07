import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const CreateSchema = z.object({
  clientId: z.string().min(1),
  managerId: z.string().min(1),
  subject: z.string().optional(),
  firstMessage: z.string().min(1),  // cria a conversa já com a 1ª mensagem
})

/**
 * GET /api/conversations?clientId=&managerId=&viewAll=true
 *
 * clientId   → conversas do client (só a dele)
 * managerId  → conversas do manager (todos os seus clients)
 * viewAll    → todas as conversas (admin)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const clientId  = searchParams.get('clientId')
  const managerId = searchParams.get('managerId')
  const viewAll   = searchParams.get('viewAll') === 'true'
  // viewerId: quem está a ver (para contar mensagens não lidas correctamente)
  const viewerId  = searchParams.get('viewerId') ?? clientId ?? managerId ?? ''

  const conversations = await prisma.conversation.findMany({
    where: viewAll ? {} : {
      ...(clientId  && { clientId }),
      ...(managerId && { managerId }),
    },
    include: {
      client:  { select: { id: true, name: true, email: true, avatar: true } },
      manager: { select: { id: true, name: true, email: true, avatar: true } },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,   // última mensagem para preview
        include: { sender: { select: { id: true, name: true } } },
      },
      _count: {
        select: {
          messages: {
            where: { readAt: null, senderId: { not: viewerId } }
          }
        }
      }
    },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json(conversations)
}

/**
 * POST /api/conversations
 * Cria conversa + primeira mensagem (idempotente: reutiliza se já existe).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = CreateSchema.parse(body)

    // Valida que client tem o manager correcto
    const client = await prisma.user.findUnique({
      where: { id: data.clientId },
      select: { managerId: true, role: true },
    })

    if (!client || client.role !== 'CLIENT') {
      return NextResponse.json({ error: 'Utilizador não é um cliente' }, { status: 400 })
    }

    if (client.managerId !== data.managerId) {
      return NextResponse.json(
        { error: 'Manager não é o responsável por este cliente' },
        { status: 403 }
      )
    }

    // Reutiliza conversa existente
    let conversation = await prisma.conversation.findUnique({
      where: { clientId_managerId: { clientId: data.clientId, managerId: data.managerId } },
    })

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          clientId: data.clientId,
          managerId: data.managerId,
          subject: data.subject,
        },
      })
    }

    // Cria a primeira mensagem
    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: data.clientId,
        content: data.firstMessage,
      },
      include: { sender: { select: { id: true, name: true } } },
    })

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    })

    return NextResponse.json({ conversation, message }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: err.errors }, { status: 400 })
    }
    console.error('[POST /api/conversations]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
