import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { workspaces, gastos, trafego, parceiros, vendasParceiros, criativos, analiseClientes } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

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
  const result = await db
    .select({ id: workspaces.id })
    .from(workspaces)
    .where(and(eq(workspaces.id, id), eq(workspaces.ownerId, session.user.id)))
    .limit(1)

  if (result.length === 0) {
    return NextResponse.json({ error: 'Planilha nao encontrada' }, { status: 404 })
  }

  // Deletar todos os dados relacionados
  await db.delete(gastos).where(eq(gastos.workspaceId, id))
  await db.delete(trafego).where(eq(trafego.workspaceId, id))
  await db.delete(vendasParceiros).where(eq(vendasParceiros.workspaceId, id))
  await db.delete(parceiros).where(eq(parceiros.workspaceId, id))
  await db.delete(criativos).where(eq(criativos.workspaceId, id))
  await db.delete(analiseClientes).where(eq(analiseClientes.workspaceId, id))
  await db.delete(workspaces).where(eq(workspaces.id, id))

  return NextResponse.json({ success: true })
}
