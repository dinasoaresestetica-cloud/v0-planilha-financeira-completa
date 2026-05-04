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
import { Plus, Pencil, Trash2, Users, UserCheck, Percent } from 'lucide-react'
import { origensCliente, mesesNomes, type ClienteSimples } from '@/lib/types'
import { StatsCard } from './stats-card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b']

// Formatar data sem conversao de timezone (evita erro de -1 dia)
function formatDate(dateString: string) {
  const [year, month, day] = dateString.split('-')
  return `${day}/${month}/${year}`
}

// Extrair partes da data sem conversao de timezone
function getDateParts(dateString: string) {
  const [year, month, day] = dateString.split('-').map(Number)
  return { year, month, day }
}

export function Clientes() {
  const { clientes, addCliente, updateCliente, deleteCliente, mesAtual, anoAtual } = useData()
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0],
    contatos: '',
    fechados: '',
    origem: '',
  })

  const resetForm = () => {
    setFormData({
      data: new Date().toISOString().split('T')[0],
      contatos: '',
      fechados: '',
      origem: '',
    })
    setEditingId(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const cliente = {
      data: formData.data,
      contatos: parseInt(formData.contatos) || 0,
      fechados: parseInt(formData.fechados) || 0,
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

  const handleEdit = (cliente: ClienteSimples) => {
    setFormData({
      data: cliente.data,
      contatos: cliente.contatos.toString(),
      fechados: cliente.fechados.toString(),
      origem: cliente.origem,
    })
    setEditingId(cliente.id)
    setIsOpen(true)
  }

  // Calculos do mes
  const totalContatos = clientes.reduce((sum, c) => sum + c.contatos, 0)
  const totalFechados = clientes.reduce((sum, c) => sum + c.fechados, 0)
  const taxaConversao = totalContatos > 0 ? (totalFechados / totalContatos) * 100 : 0

  // Dados por origem
  const getClientesPorOrigem = () => {
    return origensCliente.map(origem => {
      const registros = clientes.filter(c => c.origem === origem)
      return {
        name: origem,
        contatos: registros.reduce((sum, c) => sum + c.contatos, 0),
        fechados: registros.reduce((sum, c) => sum + c.fechados, 0),
      }
    }).filter(item => item.contatos > 0 || item.fechados > 0)
  }

  // Dados para pie chart de origens
  const getOrigemPieData = () => {
    return origensCliente.map((origem, index) => {
      const registros = clientes.filter(c => c.origem === origem)
      return {
        name: origem,
        value: registros.reduce((sum, c) => sum + c.fechados, 0),
        color: COLORS[index % COLORS.length],
      }
    }).filter(item => item.value > 0)
  }

  const sortedClientes = [...clientes].sort((a, b) => {
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
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground mt-1">{mesesNomes[mesAtual - 1]} {anoAtual} - Controle de contatos e conversoes</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Registro
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Registro' : 'Novo Registro'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel>Data</FieldLabel>
                  <Input
                    type="date"
                    value={formData.data}
                    onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                    required
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>Contatos</FieldLabel>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.contatos}
                      onChange={(e) => setFormData({ ...formData, contatos: e.target.value })}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Fechados</FieldLabel>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.fechados}
                      onChange={(e) => setFormData({ ...formData, fechados: e.target.value })}
                      required
                    />
                  </Field>
                </div>
                <Field>
                  <FieldLabel>Origem</FieldLabel>
                  <Select 
                    value={formData.origem} 
                    onValueChange={(v) => setFormData({ ...formData, origem: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a origem" />
                    </SelectTrigger>
                    <SelectContent>
                      {origensCliente.map(origem => (
                        <SelectItem key={origem} value={origem}>{origem}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Total Contatos"
          value={totalContatos.toString()}
          subtitle="Pessoas que entraram em contato"
          icon={Users}
          variant="default"
        />
        <StatsCard
          title="Total Fechados"
          value={totalFechados.toString()}
          subtitle="Clientes convertidos"
          icon={UserCheck}
          variant="success"
        />
        <StatsCard
          title="Taxa de Conversao"
          value={`${taxaConversao.toFixed(1)}%`}
          subtitle="Fechados / Contatos"
          icon={Percent}
          variant={taxaConversao >= 30 ? 'success' : taxaConversao >= 15 ? 'warning' : 'danger'}
        />
      </div>

      {/* Barra de progresso da conversao */}
      <Card className="border-primary/50 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Progresso de Conversao do Mes</p>
              <p className="text-2xl font-bold text-primary">{totalFechados} de {totalContatos} contatos</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-primary">{taxaConversao.toFixed(1)}%</p>
            </div>
          </div>
          <div className="w-full h-4 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${Math.min(taxaConversao, 100)}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2 xl:gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Contatos vs Fechados por Origem</CardTitle>
          </CardHeader>
          <CardContent>
            {getClientesPorOrigem().length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
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
                  <Bar dataKey="contatos" name="Contatos" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="fechados" name="Fechados" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <p>Nenhum registro de cliente</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Vendas por Origem</CardTitle>
          </CardHeader>
          <CardContent>
            {getOrigemPieData().length > 0 ? (
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getOrigemPieData()}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {getOrigemPieData().map((entry, index) => (
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
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <p>Nenhum cliente fechado</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Registros do Mes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead className="text-center">Contatos</TableHead>
                <TableHead className="text-center">Fechados</TableHead>
                <TableHead className="text-center">Taxa</TableHead>
                <TableHead className="w-[100px]">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedClientes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum registro encontrado
                  </TableCell>
                </TableRow>
              ) : (
                sortedClientes.map((cliente) => {
                  const taxa = cliente.contatos > 0 ? (cliente.fechados / cliente.contatos) * 100 : 0
                  return (
                    <TableRow key={cliente.id}>
                      <TableCell>{formatDate(cliente.data)}</TableCell>
                      <TableCell>{cliente.origem}</TableCell>
                      <TableCell className="text-center font-medium">{cliente.contatos}</TableCell>
                      <TableCell className="text-center font-medium text-green-600">{cliente.fechados}</TableCell>
                      <TableCell className="text-center">
                        <span className={`font-semibold ${taxa >= 30 ? 'text-green-600' : taxa >= 15 ? 'text-yellow-600' : 'text-red-500'}`}>
                          {taxa.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(cliente)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteCliente(cliente.id)}>
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
