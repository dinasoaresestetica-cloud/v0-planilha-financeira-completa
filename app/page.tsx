import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { workspaces } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { DashboardClient } from './dashboard-client'

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() })
  
  if (!session?.user) {
    redirect('/entrar')
  }

  // Buscar workspaces do usuario usando Drizzle
  const result = await db
    .select({
      id: workspaces.id,
      nome: workspaces.nome,
      createdAt: workspaces.createdAt,
    })
    .from(workspaces)
    .where(eq(workspaces.ownerId, session.user.id))
    .orderBy(desc(workspaces.createdAt))

  const userWorkspaces = result.map(row => ({
    id: row.id,
    nome: row.nome,
    createdAt: row.createdAt?.toISOString() || new Date().toISOString(),
  }))

  return (
    <DashboardClient 
      user={{ id: session.user.id, name: session.user.name, email: session.user.email }}
      workspaces={userWorkspaces}
    />
  )
}
