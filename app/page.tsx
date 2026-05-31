import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { DashboardClient } from './dashboard-client'

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() })
  
  if (!session?.user) {
    redirect('/entrar')
  }

  // Buscar workspaces do usuario
  const result = await db.query(
    'SELECT id, nome, created_at FROM workspaces WHERE owner_id = $1 ORDER BY created_at DESC',
    [session.user.id]
  )

  const workspaces = result.rows.map(row => ({
    id: row.id,
    nome: row.nome,
    createdAt: row.created_at.toISOString(),
  }))

  return (
    <DashboardClient 
      user={{ id: session.user.id, name: session.user.name, email: session.user.email }}
      workspaces={workspaces}
    />
  )
}
