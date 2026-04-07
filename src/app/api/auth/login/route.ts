import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyPassword, signToken, setSessionCookie } from '@/lib/auth'

const Schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = Schema.parse(body)

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, role: true, passwordHash: true, active: true },
    })

    if (!user || !user.passwordHash || !user.active) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
    }

    const valid = await verifyPassword(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
    }

    const token = await signToken({
      userId: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
    })

    await setSessionCookie(token)

    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }
    console.error('[POST /api/auth/login]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
