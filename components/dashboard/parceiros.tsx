"use client"

import { useState } from 'react'
import { useData } from '@/lib/cloud-data-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2, Users, DollarSign, UserPlus } from 'lucide-react'
import { type Parceiro, type VendaParceiro, mesesNomes } from '@/lib/types'
import { StatsCard } from './stats-card'
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

// Formatar data sem conversao de timezone
function formatDate(dateString: string) {
  const [year, month, day] = dateString.split('-')
  return `${day}/${month}/${year}`
}

// Extrair partes da data sem conversao de timezone
function getDateParts(dateString: string) {
  const [year, month, day] = dateString.split('-').map(Number)
  return { year, month, day }
}

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16']

export function Parceiros() {
  const { 
    parceiros, 
    vendasParceiros,
    addParceiro, 
    updateParceiro, 
    deleteParceiro,
    addVendaParceiro,
    updateVendaParceiro,
    deleteVendaParceiro,
    mesAtual,
    anoAtual,
  } = useData()

  const [isOpenParceiro, setIsOpenParceiro] = useState(false)
  const [isOpenVenda, setIsOpenVenda] = useState(false)
  const [editingParceiroId, setEditingParceiroId] = useState<string | null>(null)
  const [editingVendaId, setEditingVendaId] = useState<string | null>(null)

  const [formParceiro, setFormParceiro] = useState({
    nome: '',
    porcentagem: '',
  })

  const [formVenda, setFormVenda] = useState({
    parceiroId: '',
    data: new Date().toISOString().split('T')[0],
    valorTotal: '',
  })

  const resetFormParceiro = () => {
    setFormParceiro({ nome: '', porcentagem: '' })
    setEditingParceiroId(null)
  }

  const resetFormVenda = () => {
    setFormVenda({
      parceiroId: '',
      data: new Date().toISOString().split('T')[0],
      valorTotal: '',
    })
    setEditingVendaId(null)
  }

  const handleSubmitParceiro = (e: React.FormEvent) => {
    e.preventDefault()
    const parceiro = {
      nome: formParceiro.nome,
      porcentagem: parseFloat(formParceiro.porcentagem) || 0,
    }

    if (editingParceiroId) {
      updateParceiro(editingParceiroId, parceiro)
    } else {
      addParceiro(parceiro)
    }
    
    setIsOpenParceiro(false)
    resetFormParceiro()
  }

  const handleSubmitVenda = (e: React.FormEvent) => {
    e.preventDefault()
    const parceiro = parceiros.find(p => p.id === formVenda.parceiroId)
    if (!parceiro) return

    const valorTotal = parseFloat(formVenda.valorTotal) || 0
    const valorPagar = valorTotal * (parceiro.porcentagem / 100)

    const venda = {
      parceiroId: formVenda.parceiroId,
      data: formVenda.data,
      mensagens: 0,
      vendas: 1,
      valorTotal,
      valorPagar,
      status: 'pendente' as const,
    }

    if (editingVendaId) {
      updateVendaParceiro(editingVendaId, venda)
    } else {
      addVendaParceiro(venda)
    }
    
    setIsOpenVenda(false)
    resetFormVenda()
  }

  const handleEditParceiro = (p: Parceiro) => {
    setFormParceiro({
      nome: p.nome,
      porcentagem: p.porcentagem.toString(),
    })
    setEditingParceiroId(p.id)
    setIsOpenParceiro(true)
  }

  const handleEditVenda = (v: VendaParceiro) => {
    setFormVenda({
      parceiroId: v.parceiroId,
      data: v.data,
      valorTotal: v.valorTotal.toString(),
    })
    setEditingVendaId(v.id)
    setIsOpenVenda(true)
  }

  // Filtrar vendas do mes atual
  const vendasMesAtual = vendasParceiros.filter(v => {
    const { year, month } = getDateParts(v.data)
    return month === mesAtual && year === anoAtual
  })

  // Calculos por parceiro
  const parceirosComVendas = parceiros.map(p => {
    const vendas = vendasMesAtual.filter(v => v.parceiroId === p.id)
    const totalVendas = vendas.reduce((sum, v) => sum + v.valorTotal, 0)
    const totalPagar = vendas.reduce((sum, v) => sum + v.valorPagar, 0)
    return {
      ...p,
      vendas: vendas.length,
      totalVendas,
      totalPagar,
    }
  })
  
  // Totais
  const totalVendasParceiros = vendasMesAtual.reduce((sum, v) => sum + v.valorTotal, 0)
  const totalPagarParceiros = vendasMesAtual.reduce((sum, v) => sum + v.valorPagar, 0)
  const lucroNegocio = totalVendasParceiros - totalPagarParceiros

  // Dados para grafico de pizza
  const dadosPizza = [
    ...parceirosComVendas.filter(p => p.totalPagar > 0).map(p => ({ name: p.nome, value: p.totalPagar })),
    { name: 'Seu Negocio', value: lucroNegocio > 0 ? lucroNegocio : 0 },
  ].filter(d => d.value > 0)

  // Ordenar vendas por data
  const vendasOrdenadas = [...vendasMesAtual].sort((a, b) => {
    const dateA = getDateParts(a.data)
    const dateB = getDateParts(b.data)
    const timeA = new Date(dateA.year, dateA.month - 1, dateA.day).getTime()
    const timeB = new Date(dateB.year, dateB.month - 1, dateB.day).getTime()
    return timeB - timeA
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Parceiros</h1>
          <p className="text-muted-foreground mt-1">{mesesNomes[mesAtual - 1]} {anoAtual} - Vendas e comissoes</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isOpenParceiro} onOpenChange={(open) => {
            setIsOpenParceiro(open)
            if (!open) resetFormParceiro()
          }}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <UserPlus className="h-4 w-4 mr-2" />
                Novo Parceiro
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingParceiroId ? 'Editar Parceiro' : 'Novo Parceiro'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmitParceiro} className="space-y-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel>Nome do Parceiro</FieldLabel>
                    <Input
                      placeholder="Nome do parceiro"
                      value={formParceiro.nome}
                      onChange={(e) => setFormParceiro({ ...formParceiro, nome: e.target.value })}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Porcentagem de Comissao (%)</FieldLabel>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      placeholder="Ex: 50"
                      value={formParceiro.porcentagem}
                      onChange={(e) => setFormParceiro({ ...formParceiro, porcentagem: e.target.value })}
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Porcentagem que o parceiro recebe sobre cada venda dele
                    </p>
                  </Field>
                </FieldGroup>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsOpenParceiro(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingParceiroId ? 'Salvar' : 'Adicionar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isOpenVenda} onOpenChange={(open) => {
            setIsOpenVenda(open)
            if (!open) resetFormVenda()
          }}>
            <DialogTrigger asChild>
              <Button disabled={parceiros.length === 0}>
                <Plus className="h-4 w-4 mr-2" />
                Registrar Venda
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingVendaId ? 'Editar Venda' : 'Registrar Venda de Parceiro'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmitVenda} className="space-y-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel>Parceiro</FieldLabel>
                    <Select 
                      value={formVenda.parceiroId} 
                      onValueChange={(v) => setFormVenda({ ...formVenda, parceiroId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o parceiro" />
                      </SelectTrigger>
                      <SelectContent>
                        {parceiros.map(p => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.nome} ({p.porcentagem}%)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel>Data</FieldLabel>
                      <Input
                        type="date"
                        value={formVenda.data}
                        onChange={(e) => setFormVenda({ ...formVenda, data: e.target.value })}
                        required
                      />
                    </Field>
                    <Field>
                      <FieldLabel>Valor da Venda</FieldLabel>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        value={formVenda.valorTotal}
                        onChange={(e) => setFormVenda({ ...formVenda, valorTotal: e.target.value })}
                        required
                      />
                    </Field>
                  </div>
                  {formVenda.parceiroId && formVenda.valorTotal && (
                    <div className="p-3 bg-accent/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Comissao do parceiro:</p>
                      <p className="text-lg font-bold text-primary">
                        {formatCurrency(
                          parseFloat(formVenda.valorTotal) * 
                          ((parceiros.find(p => p.id === formVenda.parceiroId)?.porcentagem || 0) / 100)
                        )}
                      </p>
                    </div>
                  )}
                </FieldGroup>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsOpenVenda(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingVendaId ? 'Salvar' : 'Registrar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Vendas Parceiros"
          value={formatCurrency(totalVendasParceiros)}
          subtitle={`${vendasMesAtual.length} vendas`}
          icon={DollarSign}
          variant="default"
        />
        <StatsCard
          title="Comissoes a Pagar"
          value={formatCurrency(totalPagarParceiros)}
          subtitle="Total dos parceiros"
          icon={Users}
          variant="warning"
        />
        <StatsCard
          title="Seu Lucro"
          value={formatCurrency(lucroNegocio)}
          subtitle="Apos comissoes"
          icon={DollarSign}
          variant="success"
        />
        <StatsCard
          title="Parceiros Ativos"
          value={parceiros.length.toString()}
          subtitle="Cadastrados"
          icon={Users}
          variant="default"
        />
      </div>

      {/* Grafico e Resumo */}
      <div className="grid gap-6 lg:grid-cols-2 xl:gap-8">
        {/* Distribuicao Visual */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Distribuicao das Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            {dadosPizza.length > 0 && totalVendasParceiros > 0 ? (
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
                <p>Registre vendas para ver a distribuicao</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resumo por Parceiro */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Resumo por Parceiro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {parceirosComVendas.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum parceiro cadastrado
              </p>
            ) : (
              <>
                {parceirosComVendas.map((p, index) => (
                  <div key={p.id} className="flex items-center justify-between p-4 bg-accent/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <div>
                        <p className="font-medium">{p.nome}</p>
                        <p className="text-sm text-muted-foreground">
                          {p.vendas} vendas | {p.porcentagem}% comissao
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Vendas: {formatCurrency(p.totalVendas)}</p>
                      <p className="font-bold text-primary">Pagar: {formatCurrency(p.totalPagar)}</p>
                    </div>
                  </div>
                ))}
                
                {/* Seu Negocio */}
                <div className="flex items-center justify-between p-4 bg-green-500/10 rounded-lg border border-green-500/20 mt-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <div>
                      <p className="font-medium">Seu Negocio</p>
                      <p className="text-sm text-muted-foreground">Lucro apos comissoes</p>
                    </div>
                  </div>
                  <p className="font-bold text-lg text-green-600">{formatCurrency(lucroNegocio)}</p>
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
                <TableHead className="text-right">Comissao</TableHead>
                <TableHead className="text-right">Vendas no Mes</TableHead>
                <TableHead className="text-right">Total Vendido</TableHead>
                <TableHead className="text-right">A Pagar</TableHead>
                <TableHead className="w-[100px]">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parceirosComVendas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum parceiro cadastrado
                  </TableCell>
                </TableRow>
              ) : (
                parceirosComVendas.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.nome}</TableCell>
                    <TableCell className="text-right">{p.porcentagem}%</TableCell>
                    <TableCell className="text-right">{p.vendas}</TableCell>
                    <TableCell className="text-right">{formatCurrency(p.totalVendas)}</TableCell>
                    <TableCell className="text-right font-semibold text-primary">
                      {formatCurrency(p.totalPagar)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEditParceiro(p)}>
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

      {/* Tabela de Vendas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Vendas do Mes - {mesesNomes[mesAtual - 1]} {anoAtual}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Parceiro</TableHead>
                <TableHead className="text-right">Valor Venda</TableHead>
                <TableHead className="text-right">Comissao</TableHead>
                <TableHead className="w-[100px]">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendasOrdenadas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhuma venda registrada
                  </TableCell>
                </TableRow>
              ) : (
                vendasOrdenadas.map((v) => {
                  const parceiro = parceiros.find(p => p.id === v.parceiroId)
                  return (
                    <TableRow key={v.id}>
                      <TableCell>{formatDate(v.data)}</TableCell>
                      <TableCell className="font-medium">
                        {parceiro?.nome || 'Parceiro removido'}
                        <Badge variant="secondary" className="ml-2">{parceiro?.porcentagem || 0}%</Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(v.valorTotal)}</TableCell>
                      <TableCell className="text-right font-semibold text-primary">
                        {formatCurrency(v.valorPagar)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEditVenda(v)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteVendaParceiro(v.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
