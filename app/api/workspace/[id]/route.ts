import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  const { id } = await params

  // Verificar se o workspace pertence ao usuario
  const result = await db.query(
    'SELECT id FROM workspaces WHERE id = $1 AND owner_id = $2',
    [id, session.user.id]
  )

  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'Planilha nao encontrada' }, { status: 404 })
  }

  // Deletar todos os dados relacionados
  await db.query('DELETE FROM gastos WHERE workspace_id = $1', [id])
  await db.query('DELETE FROM trafego WHERE workspace_id = $1', [id])
  await db.query('DELETE FROM vendas_parceiros WHERE workspace_id = $1', [id])
  await db.query('DELETE FROM parceiros WHERE workspace_id = $1', [id])
  await db.query('DELETE FROM criativos WHERE workspace_id = $1', [id])
  await db.query('DELETE FROM analise_clientes WHERE workspace_id = $1', [id])
  await db.query('DELETE FROM workspaces WHERE id = $1', [id])

  return NextResponse.json({ success: true })
}
