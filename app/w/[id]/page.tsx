import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { getWorkspaceData, getGastos, getTrafego, getParceiros, getVendasParceiros, getCriativos, getAnaliseClientes } from '@/app/actions/data-actions'
import { WorkspaceClient } from './workspace-client'

interface WorkspacePageProps {
  params: Promise<{ id: string }>
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const session = await auth.api.getSession({ headers: await headers() })
  
  if (!session?.user) {
    redirect('/entrar')
  }

  const { id } = await params
  
  // Verificar se workspace existe e pertence ao usuario
  const workspace = await getWorkspaceData(id, session.user.id)
  if (!workspace) {
    notFound()
  }
  
  // Carregar todos os dados do workspace
  const [gastos, trafego, parceiros, vendasParceiros, criativos, analiseClientes] = await Promise.all([
    getGastos(id),
    getTrafego(id),
    getParceiros(id),
    getVendasParceiros(id),
    getCriativos(id),
    getAnaliseClientes(id),
  ])
  
  return (
    <WorkspaceClient
      workspaceId={id}
      workspaceName={workspace.nome}
      initialData={{
        gastos,
        trafego,
        parceiros,
        vendasParceiros,
        criativos,
        analiseClientes,
      }}
    />
  )
}
