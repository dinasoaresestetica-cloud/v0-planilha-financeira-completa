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
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2, TrendingDown } from 'lucide-react'
import { categoriasGasto, type Gasto } from '@/lib/types'
import { StatsCard } from './stats-card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

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

const COLORS = ['#3b82f6', '#22c55e', '#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16']

export function Gastos() {
  const { gastos, addGasto, updateGasto, deleteGasto, getTotalGastos } = useData()
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filterMonth, setFilterMonth] = useState<string>('')
  const [activeTab, setActiveTab] = useState('todos')

  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0],
    categoria: '',
    descricao: '',
    valor: '',
    fixo: false,
  })

  const resetForm = () => {
    setFormData({
      data: new Date().toISOString().split('T')[0],
      categoria: '',
      descricao: '',
      valor: '',
      fixo: false,
    })
    setEditingId(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const gasto = {
      data: formData.data,
      categoria: formData.categoria,
      descricao: formData.descricao,
      valor: parseFloat(formData.valor) || 0,
      fixo: formData.fixo,
    }

    if (editingId) {
      updateGasto(editingId, gasto)
    } else {
      addGasto(gasto)
    }
    
    setIsOpen(false)
    resetForm()
  }

  const handleEdit = (gasto: Gasto) => {
    setFormData({
      data: gasto.data,
      categoria: gasto.categoria,
      descricao: gasto.descricao,
      valor: gasto.valor.toString(),
      fixo: gasto.fixo,
    })
    setEditingId(gasto.id)
    setIsOpen(true)
  }

  const filteredGastos = gastos.filter(g => {
    if (!filterMonth) {
      if (activeTab === 'fixos') return g.fixo
      if (activeTab === 'variaveis') return !g.fixo
      return true
    }
    const { year, month } = getDateParts(g.data)
    const monthYear = `${year}-${String(month).padStart(2, '0')}`
    const matchMonth = monthYear === filterMonth
    if (activeTab === 'fixos') return matchMonth && g.fixo
    if (activeTab === 'variaveis') return matchMonth && !g.fixo
    return matchMonth
  }).sort((a, b) => {
    const dateA = getDateParts(a.data)
    const dateB = getDateParts(b.data)
    const timeA = new Date(dateA.year, dateA.month - 1, dateA.day).getTime()
    const timeB = new Date(dateB.year, dateB.month - 1, dateB.day).getTime()
    return timeB - timeA
  })

  const now = new Date()
  const totalMes = getTotalGastos(now.getMonth() + 1, now.getFullYear())
  const gastosFixos = gastos.filter(g => g.fixo).reduce((sum, g) => sum + g.valor, 0)
  const gastosVariaveis = gastos.filter(g => !g.fixo).reduce((sum, g) => sum + g.valor, 0)

  // Dados para grafico por categoria
  const getGastosPorCategoria = () => {
    return categoriasGasto.map(cat => ({
      name: cat.label,
      value: gastos.filter(g => g.categoria === cat.value).reduce((sum, g) => sum + g.valor, 0),
    })).filter(item => item.value > 0)
  }

  // Maior categoria de gasto
  const getMaiorCategoria = () => {
    const categorias = getGastosPorCategoria()
    if (categorias.length === 0) return null
    return categorias.reduce((max, cat) => cat.value > max.value ? cat : max)
  }

  const maiorCategoria = getMaiorCategoria()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gastos</h1>
          <p className="text-muted-foreground">Controle suas despesas e gastos fixos</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Gasto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Gasto' : 'Novo Gasto'}</DialogTitle>
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
                  <FieldLabel>Categoria</FieldLabel>
                  <Select 
                    value={formData.categoria} 
                    onValueChange={(v) => setFormData({ ...formData, categoria: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriasGasto.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>Descricao</FieldLabel>
                  <Input
                    placeholder="Descricao do gasto"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    required
                  />
                </Field>
                <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Gasto Fixo</p>
                    <p className="text-xs text-muted-foreground">Marque se este e um gasto recorrente mensal</p>
                  </div>
                  <Switch
                    checked={formData.fixo}
                    onCheckedChange={(checked) => setFormData({ ...formData, fixo: checked })}
                  />
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
      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard
          title="Total do Mes"
          value={formatCurrency(totalMes)}
          icon={TrendingDown}
          variant="danger"
        />
        <StatsCard
          title="Gastos Fixos"
          value={formatCurrency(gastosFixos)}
          icon={TrendingDown}
          variant="warning"
        />
        <StatsCard
          title="Gastos Variaveis"
          value={formatCurrency(gastosVariaveis)}
          icon={TrendingDown}
          variant="default"
        />
      </div>

      {/* Maior Gasto */}
      {maiorCategoria && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Maior categoria de gasto</p>
                <p className="text-xl font-bold text-destructive">{maiorCategoria.name}</p>
              </div>
              <p className="text-2xl font-bold text-destructive">{formatCurrency(maiorCategoria.value)}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gastos por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {getGastosPorCategoria().length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={getGastosPorCategoria()} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tickFormatter={(v) => `R$${v}`} className="text-xs" />
                  <YAxis type="category" dataKey="name" className="text-xs" width={100} />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                <p>Nenhum gasto registrado</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuicao</CardTitle>
          </CardHeader>
          <CardContent>
            {getGastosPorCategoria().length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={getGastosPorCategoria()}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {getGastosPorCategoria().map((_, index) => (
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
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                <p>Nenhum gasto registrado</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs & Filter */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="fixos">Fixos</TabsTrigger>
            <TabsTrigger value="variaveis">Variaveis</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex gap-4">
          <Input
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="w-auto"
          />
          {filterMonth && (
            <Button variant="ghost" onClick={() => setFilterMonth('')}>
              Limpar
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Descricao</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="w-[100px]">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGastos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum gasto registrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredGastos.map((gasto) => (
                  <TableRow key={gasto.id}>
                    <TableCell>{formatDate(gasto.data)}</TableCell>
                    <TableCell className="font-medium">
                      {categoriasGasto.find(c => c.value === gasto.categoria)?.label || gasto.categoria}
                    </TableCell>
                    <TableCell>{gasto.descricao}</TableCell>
                    <TableCell>
                      <Badge variant={gasto.fixo ? 'default' : 'secondary'}>
                        {gasto.fixo ? 'Fixo' : 'Variavel'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-destructive">
                      {formatCurrency(gasto.valor)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(gasto)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteGasto(gasto.id)}>
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
