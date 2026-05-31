"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, ArrowRight, TrendingUp } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const [existingLink, setExistingLink] = useState('')

  const handleCreateNew = async () => {
    setIsCreating(true)
    try {
      const res = await fetch('/api/workspace/create', { method: 'POST' })
      const data = await res.json()
      router.push(`/w/${data.id}`)
    } catch (error) {
      console.error('Erro ao criar workspace:', error)
      setIsCreating(false)
    }
  }

  const handleAccessExisting = () => {
    // Extrair o ID do link se for um link completo
    let id = existingLink.trim()
    if (id.includes('/w/')) {
      id = id.split('/w/')[1]?.split('?')[0] || ''
    }
    if (id) {
      router.push(`/w/${id}`)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto">
            <TrendingUp className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Planilha Financeira</h1>
          <p className="text-muted-foreground">Controle completo do seu negocio</p>
        </div>

        {/* Card Criar Novo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Criar Nova Planilha
            </CardTitle>
            <CardDescription>
              Crie uma nova planilha para um cliente. Voce recebera um link unico para compartilhar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleCreateNew} 
              className="w-full" 
              size="lg"
              disabled={isCreating}
            >
              {isCreating ? 'Criando...' : 'Criar Nova Planilha'}
            </Button>
          </CardContent>
        </Card>

        {/* Card Acessar Existente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5" />
              Acessar Planilha Existente
            </CardTitle>
            <CardDescription>
              Cole o link ou ID de uma planilha ja criada para acessar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Cole o link ou ID aqui..."
              value={existingLink}
              onChange={(e) => setExistingLink(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAccessExisting()}
            />
            <Button 
              onClick={handleAccessExisting} 
              variant="outline" 
              className="w-full"
              disabled={!existingLink.trim()}
            >
              Acessar Planilha
            </Button>
          </CardContent>
        </Card>

        {/* Info */}
        <p className="text-xs text-center text-muted-foreground">
          Cada planilha tem um link unico. Os dados ficam salvos na nuvem e podem ser acessados de qualquer dispositivo.
        </p>
      </div>
    </div>
  )
}
