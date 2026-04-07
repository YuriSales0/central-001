import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const UpdateSchema = z.object({
  status: z.enum(['PENDING', 'RECEIVED', 'OVERDUE']).optional(),
  receivedAt: z.string().datetime().optional(),
  notes: z.string().optional(),
  expectedDate: z.string().datetime().optional(),
})

/**
 * PATCH /api/admin/payouts/:id
 * Confirmar recebimento: { status: "RECEIVED", receivedAt: ISO }
 * Marcar overdue, editar notas, corrigir data esperada.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const data = UpdateSchema.parse(body)

    const payout = await prisma.payout.findUnique({ where: { id: params.id } })
    if (!payout) {
      return NextResponse.json({ error: 'Payout não encontrado' }, { status: 404 })
    }

    const updated = await prisma.payout.update({
      where: { id: params.id },
      data: {
        ...(data.status && { status: data.status }),
        ...(data.status === 'RECEIVED' && {
          receivedAt: data.receivedAt ? new Date(data.receivedAt) : new Date(),
        }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.expectedDate && { expectedDate: new Date(data.expectedDate) }),
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

    return NextResponse.json(updated)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: err.errors }, { status: 400 })
    }
    console.error('[PATCH /api/admin/payouts/:id]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/payouts/:id
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.payout.delete({ where: { id: params.id } })
  return new NextResponse(null, { status: 204 })
}
