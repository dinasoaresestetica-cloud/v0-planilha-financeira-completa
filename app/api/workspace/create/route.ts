import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const nome = body.nome || 'Nova Planilha'

  const id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  
  await db.query(
    'INSERT INTO workspaces (id, nome, owner_id) VALUES ($1, $2, $3)',
    [id, nome, session.user.id]
  )

  return NextResponse.json({ id, nome })
}
