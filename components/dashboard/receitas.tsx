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
import { Plus, Pencil, Trash2, TrendingUp } from 'lucide-react'
import { tiposServico, formasPagamento, origensCliente, type Receita } from '@/lib/types'
import { StatsCard } from './stats-card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

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

export function Receitas() {
  const { receitas, addReceita, updateReceita, deleteReceita, getTotalReceitas } = useData()
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filterMonth, setFilterMonth] = useState<string>('')

  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0],
    cliente: '',
    tipoServico: '',
    valor: '',
    formaPagamento: '',
    origem: '',
    observacoes: '',
  })

  const resetForm = () => {
    setFormData({
      data: new Date().toISOString().split('T')[0],
      cliente: '',
      tipoServico: '',
      valor: '',
      formaPagamento: '',
      origem: '',
      observacoes: '',
    })
    setEditingId(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const receita = {
      data: formData.data,
      cliente: formData.cliente,
      tipoServico: formData.tipoServico,
      valor: parseFloat(formData.valor) || 0,
      formaPagamento: formData.formaPagamento,
      origem: formData.origem,
      observacoes: formData.observacoes,
    }

    if (editingId) {
      updateReceita(editingId, receita)
    } else {
      addReceita(receita)
    }
    
    setIsOpen(false)
    resetForm()
  }

  const handleEdit = (receita: Receita) => {
    setFormData({
      data: receita.data,
      cliente: receita.cliente,
      tipoServico: receita.tipoServico,
      valor: receita.valor.toString(),
      formaPagamento: receita.formaPagamento,
      origem: receita.origem,
      observacoes: receita.observacoes || '',
    })
    setEditingId(receita.id)
    setIsOpen(true)
  }

  const filteredReceitas = receitas.filter(r => {
    if (!filterMonth) return true
    const { year, month } = getDateParts(r.data)
    const monthYear = `${year}-${String(month).padStart(2, '0')}`
    return monthYear === filterMonth
  }).sort((a, b) => {
    const dateA = getDateParts(a.data)
    const dateB = getDateParts(b.data)
    const timeA = new Date(dateA.year, dateA.month - 1, dateA.day).getTime()
    const timeB = new Date(dateB.year, dateB.month - 1, dateB.day).getTime()
    return timeB - timeA
  })

  const now = new Date()
  const totalMes = getTotalReceitas(now.getMonth() + 1, now.getFullYear())

  // Dados para grafico
  const getChartData = () => {
    const last30Days: { [key: string]: number } = {}
    const today = new Date()
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const key = date.toISOString().split('T')[0]
      last30Days[key] = 0
    }
    
    receitas.forEach(r => {
      if (last30Days[r.data] !== undefined) {
        last30Days[r.data] += r.valor
      }
    })
    
    return Object.entries(last30Days).map(([dateKey, value]) => {
      // Formatar data sem conversao de timezone
      const [year, month, day] = dateKey.split('-')
      return {
        date: `${day}/${month}`,
        valor: value,
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Faturamento</h1>
          <p className="text-muted-foreground">Gerencie suas receitas e entradas</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Receita
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Receita' : 'Nova Receita'}</DialogTitle>
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
                <Field>
                  <FieldLabel>Cliente</FieldLabel>
                  <Input
                    placeholder="Nome do cliente"
                    value={formData.cliente}
                    onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                    required
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>Tipo de Servico</FieldLabel>
                    <Select 
                      value={formData.tipoServico} 
                      onValueChange={(v) => setFormData({ ...formData, tipoServico: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {tiposServico.map(tipo => (
                          <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel>Forma de Pagamento</FieldLabel>
                    <Select 
                      value={formData.formaPagamento} 
                      onValueChange={(v) => setFormData({ ...formData, formaPagamento: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {formasPagamento.map(forma => (
                          <SelectItem key={forma} value={forma}>{forma}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
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
                  <FieldLabel>Observacoes</FieldLabel>
                  <Input
                    placeholder="Observacoes (opcional)"
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  />
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
      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard
          title="Total do Mes"
          value={formatCurrency(totalMes)}
          icon={TrendingUp}
          variant="success"
        />
        <StatsCard
          title="Total Geral"
          value={formatCurrency(receitas.reduce((sum, r) => sum + r.valor, 0))}
          icon={TrendingUp}
          variant="default"
        />
        <StatsCard
          title="Quantidade"
          value={receitas.length.toString()}
          subtitle="registros"
          icon={TrendingUp}
          variant="default"
        />
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Faturamento - Ultimos 30 dias</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={getChartData()}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis className="text-xs" tickFormatter={(v) => `R$${v}`} />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Line 
                type="monotone" 
                dataKey="valor" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Filter */}
      <div className="flex gap-4">
        <Input
          type="month"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="w-auto"
          placeholder="Filtrar por mes"
        />
        {filterMonth && (
          <Button variant="ghost" onClick={() => setFilterMonth('')}>
            Limpar filtro
          </Button>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Servico</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="w-[100px]">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReceitas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhuma receita registrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredReceitas.map((receita) => (
                  <TableRow key={receita.id}>
                    <TableCell>{formatDate(receita.data)}</TableCell>
                    <TableCell className="font-medium">{receita.cliente}</TableCell>
                    <TableCell>{receita.tipoServico}</TableCell>
                    <TableCell>{receita.origem}</TableCell>
                    <TableCell>{receita.formaPagamento}</TableCell>
                    <TableCell className="text-right font-semibold text-success">
                      {formatCurrency(receita.valor)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(receita)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteReceita(receita.id)}>
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
