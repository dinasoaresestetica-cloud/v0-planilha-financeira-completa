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
import { Plus, Pencil, Trash2, Users, DollarSign, CheckCircle, XCircle } from 'lucide-react'
import { origensCliente, type Cliente } from '@/lib/types'
import { StatsCard } from './stats-card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

const COLORS = ['#3b82f6', '#22c55e', '#ef4444', '#f59e0b', '#8b5cf6']

export function Clientes() {
  const { clientes, addCliente, updateCliente, deleteCliente } = useData()
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('todos')

  const [formData, setFormData] = useState({
    nome: '',
    data: new Date().toISOString().split('T')[0],
    valor: '',
    status: 'pendente' as 'pago' | 'pendente',
    origem: '',
  })

  const resetForm = () => {
    setFormData({
      nome: '',
      data: new Date().toISOString().split('T')[0],
      valor: '',
      status: 'pendente',
      origem: '',
    })
    setEditingId(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const cliente = {
      nome: formData.nome,
      data: formData.data,
      valor: parseFloat(formData.valor) || 0,
      status: formData.status,
      origem: formData.origem,
    }

    if (editingId) {
      updateCliente(editingId, cliente)
    } else {
      addCliente(cliente)
    }
    
    setIsOpen(false)
    resetForm()
  }

  const handleEdit = (cliente: Cliente) => {
    setFormData({
      nome: cliente.nome,
      data: cliente.data,
      valor: cliente.valor.toString(),
      status: cliente.status,
      origem: cliente.origem,
    })
    setEditingId(cliente.id)
    setIsOpen(true)
  }

  const marcarComoPago = (id: string) => {
    const cliente = clientes.find(c => c.id === id)
    if (cliente) {
      updateCliente(id, { ...cliente, status: 'pago' })
    }
  }

  const filteredClientes = clientes.filter(c => {
    if (activeTab === 'pagos') return c.status === 'pago'
    if (activeTab === 'pendentes') return c.status === 'pendente'
    return true
  }).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())

  // Calculos
  const totalClientes = clientes.length
  const clientesPagos = clientes.filter(c => c.status === 'pago')
  const clientesPendentes = clientes.filter(c => c.status === 'pendente')
  const valorTotal = clientes.reduce((sum, c) => sum + c.valor, 0)
  const valorRecebido = clientesPagos.reduce((sum, c) => sum + c.valor, 0)
  const valorPendente = clientesPendentes.reduce((sum, c) => sum + c.valor, 0)
  const taxaConversao = totalClientes > 0 ? (clientesPagos.length / totalClientes) * 100 : 0

  // Dados por origem
  const getClientesPorOrigem = () => {
    return origensCliente.map(origem => ({
      name: origem,
      total: clientes.filter(c => c.origem === origem).length,
      valor: clientes.filter(c => c.origem === origem).reduce((sum, c) => sum + c.valor, 0),
    })).filter(item => item.total > 0)
  }

  // Status para pie chart
  const getStatusData = () => {
    return [
      { name: 'Pagos', value: clientesPagos.length, color: '#22c55e' },
      { name: 'Pendentes', value: clientesPendentes.length, color: '#ef4444' },
    ].filter(item => item.value > 0)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground">Gerencie sua base de clientes</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel>Nome</FieldLabel>
                  <Input
                    placeholder="Nome do cliente"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>Data</FieldLabel>
                    <Input
                      type="date"
                      value={formData.data}
                      onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Valor</FieldLabel>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={formData.valor}
                      onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                      required
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>Origem</FieldLabel>
                    <Select 
                      value={formData.origem} 
                      onValueChange={(v) => setFormData({ ...formData, origem: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {origensCliente.map(origem => (
                          <SelectItem key={origem} value={origem}>{origem}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel>Status</FieldLabel>
                    <Select 
                      value={formData.status} 
                      onValueChange={(v: 'pago' | 'pendente') => setFormData({ ...formData, status: v })}
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
                </div>
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Clientes"
          value={totalClientes.toString()}
          icon={Users}
          variant="default"
        />
        <StatsCard
          title="Valor Total"
          value={formatCurrency(valorTotal)}
          icon={DollarSign}
          variant="default"
        />
        <StatsCard
          title="Recebido"
          value={formatCurrency(valorRecebido)}
          subtitle={`${clientesPagos.length} clientes`}
          icon={CheckCircle}
          variant="success"
        />
        <StatsCard
          title="Pendente"
          value={formatCurrency(valorPendente)}
          subtitle={`${clientesPendentes.length} clientes`}
          icon={XCircle}
          variant="danger"
        />
      </div>

      {/* Taxa de Conversao */}
      <Card className="border-primary/50 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Taxa de Conversao</p>
              <p className="text-xl font-bold text-primary">{taxaConversao.toFixed(1)}%</p>
            </div>
            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${taxaConversao}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Clientes por Origem</CardTitle>
          </CardHeader>
          <CardContent>
            {getClientesPorOrigem().length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={getClientesPorOrigem()}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="total" name="Clientes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                <p>Nenhum cliente registrado</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status dos Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            {getStatusData().length > 0 ? (
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={getStatusData()}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {getStatusData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                <p>Nenhum cliente registrado</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="todos">Todos ({clientes.length})</TabsTrigger>
          <TabsTrigger value="pagos">Pagos ({clientesPagos.length})</TabsTrigger>
          <TabsTrigger value="pendentes">Pendentes ({clientesPendentes.length})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[120px]">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClientes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum cliente encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredClientes.map((cliente) => (
                  <TableRow key={cliente.id}>
                    <TableCell>{new Date(cliente.data).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className="font-medium">{cliente.nome}</TableCell>
                    <TableCell>{cliente.origem}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(cliente.valor)}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={cliente.status === 'pago' ? 'default' : 'destructive'}
                        className={cliente.status === 'pago' ? 'bg-success text-success-foreground hover:bg-success/80' : ''}
                      >
                        {cliente.status === 'pago' ? 'PAGO' : 'NAO PAGO'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {cliente.status === 'pendente' && (
                          <Button variant="ghost" size="icon" onClick={() => marcarComoPago(cliente.id)}>
                            <CheckCircle className="h-4 w-4 text-success" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(cliente)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteCliente(cliente.id)}>
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
    </div>
  )
}
