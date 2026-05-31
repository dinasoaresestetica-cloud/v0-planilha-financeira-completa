import { redirect } from 'next/navigation'
import { createNewWorkspace } from './actions/data-actions'

export default async function HomePage() {
  // Criar um novo workspace e redirecionar para ele
  const workspaceId = await createNewWorkspace()
  redirect(`/w/${workspaceId}`)
}
