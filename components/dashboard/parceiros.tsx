"use client"

import { useState } from 'react'
import { useData } from '@/lib/data-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2, Users, DollarSign, Clock, CheckCircle } from 'lucide-react'
import { type Parceiro, type VendaParceiro } from '@/lib/types'
import { StatsCard } from './stats-card'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

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
  } = useData()

  const [activeTab, setActiveTab] = useState('vendas')
  const [isParceiroOpen, setIsParceiroOpen] = useState(false)
  const [isVendaOpen, setIsVendaOpen] = useState(false)
  const [editingParceiroId, setEditingParceiroId] = useState<string | null>(null)
  const [editingVendaId, setEditingVendaId] = useState<string | null>(null)

  const [parceiroForm, setParceiroForm] = useState({
    nome: '',
    porcentagem: '',
  })

  const [vendaForm, setVendaForm] = useState({
    parceiroId: '',
    data: new Date().toISOString().split('T')[0],
    mensagens: '',
    vendas: '',
    valorTotal: '',
    status: 'pendente' as 'pendente' | 'pago',
    dataPagamento: '',
  })

  const resetParceiroForm = () => {
    setParceiroForm({ nome: '', porcentagem: '' })
    setEditingParceiroId(null)
  }

  const resetVendaForm = () => {
    setVendaForm({
      parceiroId: '',
      data: new Date().toISOString().split('T')[0],
      mensagens: '',
      vendas: '',
      valorTotal: '',
      status: 'pendente',
      dataPagamento: '',
    })
    setEditingVendaId(null)
  }

  const handleParceiroSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const parceiro = {
      nome: parceiroForm.nome,
      porcentagem: parseFloat(parceiroForm.porcentagem) || 0,
    }

    if (editingParceiroId) {
      updateParceiro(editingParceiroId, parceiro)
    } else {
      addParceiro(parceiro)
    }
    
    setIsParceiroOpen(false)
    resetParceiroForm()
  }

  const handleVendaSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const venda = {
      parceiroId: vendaForm.parceiroId,
      data: vendaForm.data,
      mensagens: parseInt(vendaForm.mensagens) || 0,
      vendas: parseInt(vendaForm.vendas) || 0,
      valorTotal: parseFloat(vendaForm.valorTotal) || 0,
      status: vendaForm.status,
      dataPagamento: vendaForm.status === 'pago' ? vendaForm.dataPagamento : undefined,
    }

    if (editingVendaId) {
      updateVendaParceiro(editingVendaId, venda)
    } else {
      addVendaParceiro(venda)
    }
    
    setIsVendaOpen(false)
    resetVendaForm()
  }

  const handleEditParceiro = (p: Parceiro) => {
    setParceiroForm({
      nome: p.nome,
      porcentagem: p.porcentagem.toString(),
    })
    setEditingParceiroId(p.id)
    setIsParceiroOpen(true)
  }

  const handleEditVenda = (v: VendaParceiro) => {
    setVendaForm({
      parceiroId: v.parceiroId,
      data: v.data,
      mensagens: v.mensagens.toString(),
      vendas: v.vendas.toString(),
      valorTotal: v.valorTotal.toString(),
      status: v.status,
      dataPagamento: v.dataPagamento || '',
    })
    setEditingVendaId(v.id)
    setIsVendaOpen(true)
  }

  const marcarComoPago = (id: string) => {
    const venda = vendasParceiros.find(v => v.id === id)
    if (venda) {
      updateVendaParceiro(id, {
        ...venda,
        status: 'pago',
        dataPagamento: new Date().toISOString().split('T')[0],
      })
    }
  }

  // Calculos
  const totalVendido = vendasParceiros.reduce((sum, v) => sum + v.valorTotal, 0)
  const totalAPagar = vendasParceiros.filter(v => v.status === 'pendente').reduce((sum, v) => sum + v.valorPagar, 0)
  const totalPago = vendasParceiros.filter(v => v.status === 'pago').reduce((sum, v) => sum + v.valorPagar, 0)

  // Resumo por parceiro
  const getResumoPorParceiro = () => {
    return parceiros.map(p => {
      const vendas = vendasParceiros.filter(v => v.parceiroId === p.id)
      return {
        ...p,
        totalVendido: vendas.reduce((sum, v) => sum + v.valorTotal, 0),
        totalAPagar: vendas.filter(v => v.status === 'pendente').reduce((sum, v) => sum + v.valorPagar, 0),
        totalPago: vendas.filter(v => v.status === 'pago').reduce((sum, v) => sum + v.valorPagar, 0),
        qtdVendas: vendas.reduce((sum, v) => sum + v.vendas, 0),
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Parceiros</h1>
          <p className="text-muted-foreground">Gerencie seus parceiros e repasses</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isParceiroOpen} onOpenChange={(open) => {
            setIsParceiroOpen(open)
            if (!open) resetParceiroForm()
          }}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Novo Parceiro
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingParceiroId ? 'Editar Parceiro' : 'Novo Parceiro'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleParceiroSubmit} className="space-y-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel>Nome</FieldLabel>
                    <Input
                      placeholder="Nome do parceiro"
                      value={parceiroForm.nome}
                      onChange={(e) => setParceiroForm({ ...parceiroForm, nome: e.target.value })}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Porcentagem (%)</FieldLabel>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="50"
                      value={parceiroForm.porcentagem}
                      onChange={(e) => setParceiroForm({ ...parceiroForm, porcentagem: e.target.value })}
                      required
                    />
                  </Field>
                </FieldGroup>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsParceiroOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingParceiroId ? 'Salvar' : 'Adicionar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isVendaOpen} onOpenChange={(open) => {
            setIsVendaOpen(open)
            if (!open) resetVendaForm()
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Venda
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingVendaId ? 'Editar Venda' : 'Nova Venda'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleVendaSubmit} className="space-y-4">
                <FieldGroup>
                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel>Parceiro</FieldLabel>
                      <Select 
                        value={vendaForm.parceiroId} 
                        onValueChange={(v) => setVendaForm({ ...vendaForm, parceiroId: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {parceiros.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.nome} ({p.porcentagem}%)</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field>
                      <FieldLabel>Data</FieldLabel>
                      <Input
                        type="date"
                        value={vendaForm.data}
                        onChange={(e) => setVendaForm({ ...vendaForm, data: e.target.value })}
                        required
                      />
                    </Field>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <Field>
                      <FieldLabel>Mensagens</FieldLabel>
                      <Input
                        type="number"
                        placeholder="0"
                        value={vendaForm.mensagens}
                        onChange={(e) => setVendaForm({ ...vendaForm, mensagens: e.target.value })}
                        required
                      />
                    </Field>
                    <Field>
                      <FieldLabel>Vendas</FieldLabel>
                      <Input
                        type="number"
                        placeholder="0"
                        value={vendaForm.vendas}
                        onChange={(e) => setVendaForm({ ...vendaForm, vendas: e.target.value })}
                        required
                      />
                    </Field>
                    <Field>
                      <FieldLabel>Valor Total</FieldLabel>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        value={vendaForm.valorTotal}
                        onChange={(e) => setVendaForm({ ...vendaForm, valorTotal: e.target.value })}
                        required
                      />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel>Status</FieldLabel>
                      <Select 
                        value={vendaForm.status} 
                        onValueChange={(v: 'pendente' | 'pago') => setVendaForm({ ...vendaForm, status: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="pago">Pago</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    {vendaForm.status === 'pago' && (
                      <Field>
                        <FieldLabel>Data Pagamento</FieldLabel>
                        <Input
                          type="date"
                          value={vendaForm.dataPagamento}
                          onChange={(e) => setVendaForm({ ...vendaForm, dataPagamento: e.target.value })}
                        />
                      </Field>
                    )}
                  </div>
                </FieldGroup>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsVendaOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingVendaId ? 'Salvar' : 'Adicionar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Vendido"
          value={formatCurrency(totalVendido)}
          subtitle="Pelos parceiros"
          icon={DollarSign}
          variant="default"
        />
        <StatsCard
          title="A Pagar"
          value={formatCurrency(totalAPagar)}
          subtitle="Pendente"
          icon={Clock}
          variant="warning"
        />
        <StatsCard
          title="Ja Pago"
          value={formatCurrency(totalPago)}
          subtitle="Total"
          icon={CheckCircle}
          variant="success"
        />
        <StatsCard
          title="Parceiros"
          value={parceiros.length.toString()}
          subtitle="Ativos"
          icon={Users}
          variant="default"
        />
      </div>

      {/* Resumo por Parceiro */}
      {parceiros.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {getResumoPorParceiro().map(p => (
            <Card key={p.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{p.nome}</h3>
                    <p className="text-sm text-muted-foreground">{p.porcentagem}% de comissao</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEditParceiro(p)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteParceiro(p.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total vendido:</span>
                    <span className="font-medium">{formatCurrency(p.totalVendido)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">A pagar:</span>
                    <span className="font-medium text-warning">{formatCurrency(p.totalAPagar)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ja pago:</span>
                    <span className="font-medium text-success">{formatCurrency(p.totalPago)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vendas:</span>
                    <span className="font-medium">{p.qtdVendas}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="vendas">Vendas</TabsTrigger>
          <TabsTrigger value="parceiros">Parceiros</TabsTrigger>
        </TabsList>

        <TabsContent value="vendas" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Parceiro</TableHead>
                    <TableHead className="text-right">Mensagens</TableHead>
                    <TableHead className="text-right">Vendas</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead className="text-right">A Pagar</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[120px]">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendasParceiros.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Nenhuma venda registrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    vendasParceiros
                      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                      .map((v) => {
                        const parceiro = parceiros.find(p => p.id === v.parceiroId)
                        return (
                          <TableRow key={v.id}>
                            <TableCell>{new Date(v.data).toLocaleDateString('pt-BR')}</TableCell>
                            <TableCell className="font-medium">{parceiro?.nome || 'N/A'}</TableCell>
                            <TableCell className="text-right">{v.mensagens}</TableCell>
                            <TableCell className="text-right">{v.vendas}</TableCell>
                            <TableCell className="text-right">{formatCurrency(v.valorTotal)}</TableCell>
                            <TableCell className="text-right font-semibold">{formatCurrency(v.valorPagar)}</TableCell>
                            <TableCell>
                              <Badge variant={v.status === 'pago' ? 'default' : 'secondary'}>
                                {v.status === 'pago' ? 'Pago' : 'Pendente'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {v.status === 'pendente' && (
                                  <Button variant="ghost" size="icon" onClick={() => marcarComoPago(v.id)}>
                                    <CheckCircle className="h-4 w-4 text-success" />
                                  </Button>
                                )}
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
        </TabsContent>

        <TabsContent value="parceiros" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="text-right">Porcentagem</TableHead>
                    <TableHead className="w-[100px]">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parceiros.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        Nenhum parceiro cadastrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    parceiros.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.nome}</TableCell>
                        <TableCell className="text-right">{p.porcentagem}%</TableCell>
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
