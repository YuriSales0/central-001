import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'dev-secret-change-in-production-min-32-chars'
)
const COOKIE_NAME = 'session'
const MAX_AGE = 60 * 60 * 8 // 8 horas

export type SessionPayload = {
  userId: string
  role: string
  name: string
  email: string
}

// ─── Senha ───────────────────────────────────────────────────────────────────

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12)
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}

// ─── JWT ─────────────────────────────────────────────────────────────────────

export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(SECRET)
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

// ─── Cookie ──────────────────────────────────────────────────────────────────

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  })
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyToken(token)
}

// ─── Proteção de rota ────────────────────────────────────────────────────────

export const ROLE_ROUTES: Record<string, string[]> = {
  '/admin':   ['ADMIN'],
  '/manager': ['ADMIN', 'MANAGER'],
  '/crew':    ['ADMIN', 'MANAGER', 'CREW'],
  '/client':  ['ADMIN', 'MANAGER', 'CLIENT'],
}
