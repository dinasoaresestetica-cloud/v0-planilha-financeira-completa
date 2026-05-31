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
import { Plus, Pencil, Trash2, Wrench, DollarSign } from 'lucide-react'
import { tiposFerramenta, type Ferramenta } from '@/lib/types'
import { StatsCard } from './stats-card'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

const COLORS = ['#3b82f6', '#22c55e', '#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899']

export function Ferramentas() {
  const { ferramentas, addFerramenta, updateFerramenta, deleteFerramenta } = useData()
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    nome: '',
    tipo: '',
    valor: '',
  })

  const resetForm = () => {
    setFormData({
      nome: '',
      tipo: '',
      valor: '',
    })
    setEditingId(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const ferramenta = {
      nome: formData.nome,
      tipo: formData.tipo,
      valor: parseFloat(formData.valor) || 0,
    }

    if (editingId) {
      updateFerramenta(editingId, ferramenta)
    } else {
      addFerramenta(ferramenta)
    }
    
    setIsOpen(false)
    resetForm()
  }

  const handleEdit = (ferramenta: Ferramenta) => {
    setFormData({
      nome: ferramenta.nome,
      tipo: ferramenta.tipo,
      valor: ferramenta.valor.toString(),
    })
    setEditingId(ferramenta.id)
    setIsOpen(true)
  }

  // Calculos
  const totalMensal = ferramentas.reduce((sum, f) => sum + f.valor, 0)
  const totalAnual = totalMensal * 12

  // Dados por tipo
  const getFerramentasPorTipo = () => {
    return tiposFerramenta.map(tipo => ({
      name: tipo,
      valor: ferramentas.filter(f => f.tipo === tipo).reduce((sum, f) => sum + f.valor, 0),
      quantidade: ferramentas.filter(f => f.tipo === tipo).length,
    })).filter(item => item.quantidade > 0)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ferramentas</h1>
          <p className="text-muted-foreground">Gerencie suas ferramentas e programas</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Ferramenta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Ferramenta' : 'Nova Ferramenta'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel>Nome</FieldLabel>
                  <Input
                    placeholder="Nome da ferramenta"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>Tipo</FieldLabel>
                    <Select 
                      value={formData.tipo} 
                      onValueChange={(v) => setFormData({ ...formData, tipo: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {tiposFerramenta.map(tipo => (
                          <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel>Valor Mensal</FieldLabel>
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
          title="Total Mensal"
          value={formatCurrency(totalMensal)}
          icon={DollarSign}
          variant="default"
        />
        <StatsCard
          title="Total Anual"
          value={formatCurrency(totalAnual)}
          icon={DollarSign}
          variant="warning"
        />
        <StatsCard
          title="Ferramentas"
          value={ferramentas.length.toString()}
          subtitle="Ativas"
          icon={Wrench}
          variant="default"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Custo por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            {getFerramentasPorTipo().length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={getFerramentasPorTipo()} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tickFormatter={(v) => `R$${v}`} className="text-xs" />
                  <YAxis type="category" dataKey="name" className="text-xs" width={80} />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="valor" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                <p>Nenhuma ferramenta cadastrada</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuicao</CardTitle>
          </CardHeader>
          <CardContent>
            {getFerramentasPorTipo().length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={getFerramentasPorTipo()}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="valor"
                    label={({ name }) => name}
                    labelLine={false}
                  >
                    {getFerramentasPorTipo().map((_, index) => (
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
                <p>Nenhuma ferramenta cadastrada</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cards por ferramenta */}
      {ferramentas.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {ferramentas.map((f) => (
            <Card key={f.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{f.nome}</h3>
                    <Badge variant="secondary" className="mt-1">{f.tipo}</Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(f)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteFerramenta(f.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <p className="text-2xl font-bold mt-3">{formatCurrency(f.valor)}</p>
                <p className="text-xs text-muted-foreground">por mes</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lista de Ferramentas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Valor Mensal</TableHead>
                <TableHead className="text-right">Valor Anual</TableHead>
                <TableHead className="w-[100px]">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ferramentas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhuma ferramenta cadastrada
                  </TableCell>
                </TableRow>
              ) : (
                ferramentas.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.nome}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{f.tipo}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(f.valor)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(f.valor * 12)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(f)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteFerramenta(f.id)}>
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
