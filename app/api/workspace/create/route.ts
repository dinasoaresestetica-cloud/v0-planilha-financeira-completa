import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { workspaces } from '@/lib/db/schema'

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const nome = body.nome || 'Nova Planilha'

  const id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  
  await db.insert(workspaces).values({
    id,
    nome,
    ownerId: session.user.id,
  })

  return NextResponse.json({ id, nome })
}
