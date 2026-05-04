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
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2, Users, UserPlus, UserCheck, DollarSign, ShoppingCart } from 'lucide-react'
import { mesesNomes } from '@/lib/types'
import { StatsCard } from './stats-card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

// Tipo para cliente na analise
interface ClienteAnalise {
  id: string
  data: string
  tipo: 'novo' | 'antigo'
  quantidadeCompras: number
  valorTotal: number
}

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

const COLORS = ['#3b82f6', '#22c55e']

export function AnaliseClientes() {
  const { mesAtual, anoAtual } = useData()
  const [clientes, setClientes] = useState<ClienteAnalise[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('analise-clientes')
      return stored ? JSON.parse(stored) : []
    }
    return []
  })
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0],
    tipo: 'novo' as 'novo' | 'antigo',
    quantidadeCompras: '',
    valorTotal: '',
  })

  // Persistir no localStorage
  const saveClientes = (newClientes: ClienteAnalise[]) => {
    setClientes(newClientes)
    if (typeof window !== 'undefined') {
      localStorage.setItem('analise-clientes', JSON.stringify(newClientes))
    }
  }

  const resetForm = () => {
    setFormData({
      data: new Date().toISOString().split('T')[0],
      tipo: 'novo',
      quantidadeCompras: '',
      valorTotal: '',
    })
    setEditingId(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const cliente: ClienteAnalise = {
      id: editingId || Math.random().toString(36).substring(2, 15),
      data: formData.data,
      tipo: formData.tipo,
      quantidadeCompras: parseInt(formData.quantidadeCompras) || 0,
      valorTotal: parseFloat(formData.valorTotal) || 0,
    }

    if (editingId) {
      saveClientes(clientes.map(c => c.id === editingId ? cliente : c))
    } else {
      saveClientes([...clientes, cliente])
    }
    
    setIsOpen(false)
    resetForm()
  }

  const handleEdit = (cliente: ClienteAnalise) => {
    setFormData({
      data: cliente.data,
      tipo: cliente.tipo,
      quantidadeCompras: cliente.quantidadeCompras.toString(),
      valorTotal: cliente.valorTotal.toString(),
    })
    setEditingId(cliente.id)
    setIsOpen(true)
  }

  const handleDelete = (id: string) => {
    saveClientes(clientes.filter(c => c.id !== id))
  }

  // Calculos
  const clientesNovos = clientes.filter(c => c.tipo === 'novo')
  const clientesAntigos = clientes.filter(c => c.tipo === 'antigo')
  
  const totalClientes = clientes.length
  const qtdNovos = clientesNovos.length
  const qtdAntigos = clientesAntigos.length
  
  const vendasNovos = clientesNovos.reduce((sum, c) => sum + c.quantidadeCompras, 0)
  const vendasAntigos = clientesAntigos.reduce((sum, c) => sum + c.quantidadeCompras, 0)
  const totalVendas = vendasNovos + vendasAntigos
  
  const valorNovos = clientesNovos.reduce((sum, c) => sum + c.valorTotal, 0)
  const valorAntigos = clientesAntigos.reduce((sum, c) => sum + c.valorTotal, 0)
  const valorTotal = valorNovos + valorAntigos
  
  const ticketMedioNovos = qtdNovos > 0 ? valorNovos / vendasNovos : 0
  const ticketMedioAntigos = qtdAntigos > 0 ? valorAntigos / vendasAntigos : 0

  // Dados para graficos
  const dadosPorTipo = [
    { name: 'Novos', clientes: qtdNovos, vendas: vendasNovos, valor: valorNovos },
    { name: 'Antigos', clientes: qtdAntigos, vendas: vendasAntigos, valor: valorAntigos },
  ]

  const dadosPizza = [
    { name: 'Novos', value: valorNovos },
    { name: 'Antigos', value: valorAntigos },
  ].filter(d => d.value > 0)

  const sortedClientes = [...clientes].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Analise de Clientes</h1>
          <p className="text-muted-foreground mt-1">{mesesNomes[mesAtual - 1]} {anoAtual} - Novos x Antigos</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Registrar Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Registro' : 'Novo Registro de Cliente'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FieldGroup>
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
                    <FieldLabel>Tipo de Cliente</FieldLabel>
                    <Select 
                      value={formData.tipo} 
                      onValueChange={(v: 'novo' | 'antigo') => setFormData({ ...formData, tipo: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="novo">Cliente Novo</SelectItem>
                        <SelectItem value="antigo">Cliente Antigo</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>Qtd de Compras</FieldLabel>
                    <Input
                      type="number"
                      min="1"
                      placeholder="1"
                      value={formData.quantidadeCompras}
                      onChange={(e) => setFormData({ ...formData, quantidadeCompras: e.target.value })}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Valor Total (Pix)</FieldLabel>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={formData.valorTotal}
                      onChange={(e) => setFormData({ ...formData, valorTotal: e.target.value })}
                      required
                    />
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

      {/* Stats principais */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total de Clientes"
          value={totalClientes.toString()}
          subtitle={`${qtdNovos} novos | ${qtdAntigos} antigos`}
          icon={Users}
          variant="default"
        />
        <StatsCard
          title="Total de Vendas"
          value={totalVendas.toString()}
          subtitle={`${vendasNovos} novos | ${vendasAntigos} antigos`}
          icon={ShoppingCart}
          variant="success"
        />
        <StatsCard
          title="Valor Total"
          value={formatCurrency(valorTotal)}
          subtitle="Receita total do periodo"
          icon={DollarSign}
          variant="default"
        />
        <StatsCard
          title="Ticket Medio"
          value={formatCurrency(totalVendas > 0 ? valorTotal / totalVendas : 0)}
          subtitle="Valor medio por venda"
          icon={DollarSign}
          variant="success"
        />
      </div>

      {/* Cards de resumo por tipo */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <UserPlus className="h-6 w-6 text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Clientes Novos</p>
                <p className="text-2xl font-bold text-foreground">{qtdNovos}</p>
                <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Vendas</p>
                    <p className="font-semibold">{vendasNovos}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Valor Total</p>
                    <p className="font-semibold text-blue-600">{formatCurrency(valorNovos)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Ticket Medio</p>
                    <p className="font-semibold">{formatCurrency(ticketMedioNovos)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">% do Total</p>
                    <p className="font-semibold">{valorTotal > 0 ? ((valorNovos / valorTotal) * 100).toFixed(1) : 0}%</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <UserCheck className="h-6 w-6 text-green-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Clientes Antigos</p>
                <p className="text-2xl font-bold text-foreground">{qtdAntigos}</p>
                <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Vendas</p>
                    <p className="font-semibold">{vendasAntigos}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Valor Total</p>
                    <p className="font-semibold text-green-600">{formatCurrency(valorAntigos)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Ticket Medio</p>
                    <p className="font-semibold">{formatCurrency(ticketMedioAntigos)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">% do Total</p>
                    <p className="font-semibold">{valorTotal > 0 ? ((valorAntigos / valorTotal) * 100).toFixed(1) : 0}%</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2 xl:gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Comparativo Novos x Antigos</CardTitle>
          </CardHeader>
          <CardContent>
            {clientes.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dadosPorTipo}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number, name: string) => [
                      name === 'valor' ? formatCurrency(value) : value,
                      name === 'clientes' ? 'Clientes' : name === 'vendas' ? 'Vendas' : 'Valor'
                    ]}
                  />
                  <Bar dataKey="clientes" name="clientes" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="vendas" name="vendas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <p>Nenhum cliente registrado</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Distribuicao de Receita</CardTitle>
          </CardHeader>
          <CardContent>
            {dadosPizza.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
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
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <p>Nenhum dado para exibir</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Registro de Clientes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Qtd Compras</TableHead>
                <TableHead className="text-right">Valor Total</TableHead>
                <TableHead className="w-[100px]">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedClientes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum cliente registrado
                  </TableCell>
                </TableRow>
              ) : (
                sortedClientes.map((cliente) => (
                  <TableRow key={cliente.id}>
                    <TableCell>{formatDate(cliente.data)}</TableCell>
                    <TableCell>
                      <Badge variant={cliente.tipo === 'novo' ? 'default' : 'secondary'}
                        className={cliente.tipo === 'novo' ? 'bg-blue-500 hover:bg-blue-500/80' : 'bg-green-500 hover:bg-green-500/80 text-white'}>
                        {cliente.tipo === 'novo' ? 'Novo' : 'Antigo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{cliente.quantidadeCompras}</TableCell>
                    <TableCell className="text-right font-semibold text-green-600">{formatCurrency(cliente.valorTotal)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(cliente)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(cliente.id)}>
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
