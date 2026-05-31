import { notFound } from 'next/navigation'
import { getOrCreateWorkspace, getGastos, getTrafego, getParceiros, getVendasParceiros, getCriativos, getAnaliseClientes } from '@/app/actions/data-actions'
import { WorkspaceClient } from './workspace-client'

interface WorkspacePageProps {
  params: Promise<{ id: string }>
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { id } = await params
  
  // Verificar/criar workspace
  const workspace = await getOrCreateWorkspace(id)
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
