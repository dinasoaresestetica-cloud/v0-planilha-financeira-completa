"use client"

import { Card, CardContent } from '@/components/ui/card'
import { History } from 'lucide-react'

export function Historico() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Historico e Comparativo</h1>
        <p className="text-muted-foreground mt-1">Analise o desempenho ao longo dos meses</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <History className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Historico em desenvolvimento</h3>
          <p className="text-muted-foreground text-center max-w-md">
            O historico sera gerado automaticamente ao virar o mes. Todos os dados do mes atual serao arquivados para comparacao.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
