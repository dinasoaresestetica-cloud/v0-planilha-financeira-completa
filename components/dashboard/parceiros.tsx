"use client"

import { useState } from 'react'
import { useData } from '@/lib/data-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { Plus, Pencil, Trash2, Users, DollarSign, Percent, PieChart } from 'lucide-react'
import { type Parceiro, mesesNomes } from '@/lib/types'
import { StatsCard } from './stats-card'
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16']

export function Parceiros() {
  const { 
    parceiros, 
    trafego,
    getTotalVendasTrafego,
    addParceiro, 
    updateParceiro, 
    deleteParceiro,
    mesAtual,
    anoAtual,
  } = useData()

  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    nome: '',
    porcentagem: '',
  })

  const resetForm = () => {
    setFormData({ nome: '', porcentagem: '' })
    setEditingId(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const parceiro = {
      nome: formData.nome,
      porcentagem: parseFloat(formData.porcentagem) || 0,
    }

    if (editingId) {
      updateParceiro(editingId, parceiro)
    } else {
      addParceiro(parceiro)
    }
    
    setIsOpen(false)
    resetForm()
  }

  const handleEdit = (p: Parceiro) => {
    setFormData({
      nome: p.nome,
      porcentagem: p.porcentagem.toString(),
    })
    setEditingId(p.id)
    setIsOpen(true)
  }

  // Calcular faturamento total do mes (vendas do trafego)
  const faturamentoTotal = getTotalVendasTrafego(mesAtual, anoAtual)
  
  // Calcular lucro de cada parceiro baseado na porcentagem do faturamento
  const parceirosComLucro = parceiros.map(p => ({
    ...p,
    lucro: faturamentoTotal * (p.porcentagem / 100),
  }))
  
  // Total distribuido aos parceiros
  const totalDistribuido = parceirosComLucro.reduce((sum, p) => sum + p.lucro, 0)
  
  // Lucro restante (parte do negocio)
  const lucroRestante = faturamentoTotal - totalDistribuido
  
  // Total de porcentagem dos parceiros
  const totalPorcentagem = parceiros.reduce((sum, p) => sum + p.porcentagem, 0)
  
  // Porcentagem restante para o negocio
  const porcentagemNegocio = 100 - totalPorcentagem

  // Dados para grafico de pizza
  const dadosPizza = [
    ...parceirosComLucro.map(p => ({ name: p.nome, value: p.lucro })),
    { name: 'Negocio', value: lucroRestante > 0 ? lucroRestante : 0 },
  ].filter(d => d.value > 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Parceiros</h1>
          <p className="text-muted-foreground mt-1">{mesesNomes[mesAtual - 1]} {anoAtual} - Distribuicao de lucro</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Parceiro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Parceiro' : 'Novo Parceiro'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel>Nome do Parceiro</FieldLabel>
                  <Input
                    placeholder="Nome do parceiro"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel>Porcentagem de Participacao (%)</FieldLabel>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="Ex: 50"
                    value={formData.porcentagem}
                    onChange={(e) => setFormData({ ...formData, porcentagem: e.target.value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Porcentagem do faturamento total que sera o lucro deste parceiro
                  </p>
                </Field>
              </FieldGroup>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingId ? 'Salvar' : 'Adicionar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Faturamento Total"
          value={formatCurrency(faturamentoTotal)}
          subtitle="Vendas do mes"
          icon={DollarSign}
          variant="default"
        />
        <StatsCard
          title="Lucro Parceiros"
          value={formatCurrency(totalDistribuido)}
          subtitle="Total distribuido"
          icon={Users}
          variant="warning"
        />
        <StatsCard
          title="Lucro Negocio"
          value={formatCurrency(lucroRestante)}
          subtitle={`${porcentagemNegocio.toFixed(1)}% restante`}
          icon={DollarSign}
          variant="success"
        />
        <StatsCard
          title="Parceiros Ativos"
          value={parceiros.length.toString()}
          subtitle={`${totalPorcentagem}% distribuido`}
          icon={Users}
          variant="default"
        />
      </div>

      {/* Aviso de porcentagem */}
      {totalPorcentagem > 100 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4">
            <p className="text-sm text-destructive font-medium">
              Atencao: A soma das porcentagens ({totalPorcentagem}%) excede 100%. Ajuste as porcentagens dos parceiros.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Grafico e Cards */}
      <div className="grid gap-6 lg:grid-cols-2 xl:gap-8">
        {/* Distribuicao Visual */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Distribuicao do Lucro</CardTitle>
          </CardHeader>
          <CardContent>
            {dadosPizza.length > 0 && faturamentoTotal > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPie>
                  <Pie
                    data={dadosPizza}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {dadosPizza.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                </RechartsPie>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <p>Registre vendas em Trafego Pago para ver a distribuicao</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detalhamento por Parceiro */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Lucro por Parceiro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {parceirosComLucro.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum parceiro cadastrado
              </p>
            ) : (
              <>
                {parceirosComLucro.map((p, index) => (
                  <div key={p.id} className="flex items-center justify-between p-4 bg-accent/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <div>
                        <p className="font-medium">{p.nome}</p>
                        <p className="text-sm text-muted-foreground">{p.porcentagem}% do faturamento</p>
                      </div>
                    </div>
                    <p className="font-bold text-lg">{formatCurrency(p.lucro)}</p>
                  </div>
                ))}
                
                {/* Lucro do Negocio */}
                <div className="flex items-center justify-between p-4 bg-green-500/10 rounded-lg border border-green-500/20 mt-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <div>
                      <p className="font-medium">Seu Negocio</p>
                      <p className="text-sm text-muted-foreground">{porcentagemNegocio.toFixed(1)}% restante</p>
                    </div>
                  </div>
                  <p className="font-bold text-lg text-green-600">{formatCurrency(lucroRestante)}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Parceiros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Parceiros Cadastrados</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="text-right">Porcentagem</TableHead>
                <TableHead className="text-right">Lucro Calculado</TableHead>
                <TableHead className="w-[100px]">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parceiros.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Nenhum parceiro cadastrado
                  </TableCell>
                </TableRow>
              ) : (
                parceirosComLucro.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.nome}</TableCell>
                    <TableCell className="text-right">{p.porcentagem}%</TableCell>
                    <TableCell className="text-right font-semibold text-primary">
                      {formatCurrency(p.lucro)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(p)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteParceiro(p.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Explicacao */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <PieChart className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Como funciona:</p>
              <p>O lucro de cada parceiro e calculado automaticamente com base na porcentagem definida sobre o faturamento total de vendas do trafego pago. Este valor representa a participacao do parceiro no lucro, nao sendo contabilizado como gasto.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
