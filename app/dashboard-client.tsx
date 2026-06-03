"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, TrendingUp, LogOut, FileSpreadsheet, Trash2 } from 'lucide-react'
import { authClient } from '@/lib/auth-client'

interface Workspace {
  id: string
  nome: string
  createdAt: string
}

interface DashboardClientProps {
  user: { id: string; name: string; email: string }
  workspaces: Workspace[]
}

export function DashboardClient({ user, workspaces: initialWorkspaces }: DashboardClientProps) {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const [workspaces, setWorkspaces] = useState(initialWorkspaces)
  const [newName, setNewName] = useState('')

  const handleCreateNew = async () => {
    setIsCreating(true)
    try {
      const res = await fetch('/api/workspace/create', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: newName || 'Nova Planilha' })
      })
      const data = await res.json()
      router.push(`/w/${data.id}`)
    } catch (error) {
      console.error('Erro ao criar workspace:', error)
      setIsCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta planilha? Esta acao nao pode ser desfeita.')) return
    
    try {
      await fetch(`/api/workspace/${id}`, { method: 'DELETE' })
      setWorkspaces(prev => prev.filter(w => w.id !== id))
    } catch (error) {
      console.error('Erro ao excluir workspace:', error)
    }
  }

  const handleSignOut = async () => {
    await authClient.signOut()
    router.push('/entrar')
    router.refresh()
  }

  // Formatar data de forma consistente entre servidor e cliente
  const formatDate = (dateString: string) => {
    // Usar apenas a parte da data (YYYY-MM-DD) para evitar problemas de timezone
    const datePart = dateString.split('T')[0]
    const [year, month, day] = datePart.split('-')
    return `${day}/${month}/${year}`
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold text-foreground">Planilha Financeira</h1>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Boas vindas */}
        <div>
          <h2 className="text-2xl font-bold text-foreground">Ola, {user.name}!</h2>
          <p className="text-muted-foreground">Gerencie suas planilhas financeiras</p>
        </div>

        {/* Criar nova */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Plus className="h-5 w-5" />
              Criar Nova Planilha
            </CardTitle>
            <CardDescription>
              Crie uma planilha para um novo cliente
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Input
              placeholder="Nome do cliente ou planilha..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateNew()}
              className="flex-1"
            />
            <Button onClick={handleCreateNew} disabled={isCreating}>
              {isCreating ? 'Criando...' : 'Criar'}
            </Button>
          </CardContent>
        </Card>

        {/* Lista de planilhas */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">
            Suas Planilhas ({workspaces.length})
          </h3>
          
          {workspaces.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Voce ainda nao tem planilhas</p>
                <p className="text-sm text-muted-foreground">Crie sua primeira planilha acima</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {workspaces.map((workspace) => (
                <Card key={workspace.id} className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-4 flex items-center justify-between">
                    <button
                      onClick={() => router.push(`/w/${workspace.id}`)}
                      className="flex items-center gap-3 flex-1 text-left"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileSpreadsheet className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{workspace.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          Criada em {formatDate(workspace.createdAt)}
                        </p>
                      </div>
                    </button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(workspace.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
