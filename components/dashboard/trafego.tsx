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
import { Plus, Pencil, Trash2, Megaphone, MessageCircle, ShoppingCart, TrendingUp } from 'lucide-react'
import { plataformasTrafego, type TrafegoPago } from '@/lib/types'
import { StatsCard } from './stats-card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts'

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

export function Trafego() {
  const { trafego, addTrafego, updateTrafego, deleteTrafego, getTotalTrafego, getTotalVendasTrafego } = useData()
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filterMonth, setFilterMonth] = useState<string>('')

  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0],
    plataforma: '',
    valorInvestido: '',
    conversas: '',
    vendas: '',
    faturamento: '',
  })

  const resetForm = () => {
    setFormData({
      data: new Date().toISOString().split('T')[0],
      plataforma: '',
      valorInvestido: '',
      conversas: '',
      vendas: '',
      faturamento: '',
    })
    setEditingId(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trafegoData = {
      data: formData.data,
      plataforma: formData.plataforma,
      valorInvestido: parseFloat(formData.valorInvestido) || 0,
      conversas: parseInt(formData.conversas) || 0,
      vendas: parseInt(formData.vendas) || 0,
      faturamento: parseFloat(formData.faturamento) || 0,
    }

    if (editingId) {
      updateTrafego(editingId, trafegoData)
    } else {
      addTrafego(trafegoData)
    }
    
    setIsOpen(false)
    resetForm()
  }

  const handleEdit = (t: TrafegoPago) => {
    setFormData({
      data: t.data,
      plataforma: t.plataforma,
      valorInvestido: t.valorInvestido.toString(),
      conversas: t.conversas.toString(),
      vendas: t.vendas.toString(),
      faturamento: t.faturamento.toString(),
    })
    setEditingId(t.id)
    setIsOpen(true)
  }

  const filteredTrafego = trafego.filter(t => {
    if (!filterMonth) return true
    const { year, month } = getDateParts(t.data)
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
  const totalInvestido = getTotalTrafego(now.getMonth() + 1, now.getFullYear())
  const totalFaturamento = getTotalVendasTrafego(now.getMonth() + 1, now.getFullYear())
  const totalConversas = trafego.reduce((sum, t) => sum + t.conversas, 0)
  const totalVendas = trafego.reduce((sum, t) => sum + t.vendas, 0)
  const custoMedioConversa = totalConversas > 0 ? trafego.reduce((sum, t) => sum + t.valorInvestido, 0) / totalConversas : 0
  const roi = totalInvestido > 0 ? ((totalFaturamento - totalInvestido) / totalInvestido) * 100 : 0

  // Dados para grafico por plataforma
  const getDadosPorPlataforma = () => {
    return plataformasTrafego.map(plat => {
      const dados = trafego.filter(t => t.plataforma === plat)
      return {
        name: plat,
        investido: dados.reduce((sum, t) => sum + t.valorInvestido, 0),
        faturamento: dados.reduce((sum, t) => sum + t.faturamento, 0),
        conversas: dados.reduce((sum, t) => sum + t.conversas, 0),
      }
    }).filter(item => item.investido > 0 || item.faturamento > 0)
  }

  // Dados para grafico de evolucao
  const getEvolucao = () => {
    const last30Days: { [key: string]: { investido: number; faturamento: number } } = {}
    const today = new Date()
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const key = date.toISOString().split('T')[0]
      last30Days[key] = { investido: 0, faturamento: 0 }
    }
    
    trafego.forEach(t => {
      if (last30Days[t.data]) {
        last30Days[t.data].investido += t.valorInvestido
        last30Days[t.data].faturamento += t.faturamento
      }
    })
    
    return Object.entries(last30Days).map(([date, values]) => ({
      date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      ...values,
    }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Trafego Pago</h1>
          <p className="text-muted-foreground">Controle seus investimentos em anuncios</p>
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
                    <FieldLabel>Plataforma</FieldLabel>
                    <Select 
                      value={formData.plataforma} 
                      onValueChange={(v) => setFormData({ ...formData, plataforma: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {plataformasTrafego.map(plat => (
                          <SelectItem key={plat} value={plat}>{plat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>Valor Investido</FieldLabel>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={formData.valorInvestido}
                      onChange={(e) => setFormData({ ...formData, valorInvestido: e.target.value })}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Conversas</FieldLabel>
                    <Input
                      type="number"
                      placeholder="0"
                      value={formData.conversas}
                      onChange={(e) => setFormData({ ...formData, conversas: e.target.value })}
                      required
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>Vendas</FieldLabel>
                    <Input
                      type="number"
                      placeholder="0"
                      value={formData.vendas}
                      onChange={(e) => setFormData({ ...formData, vendas: e.target.value })}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Faturamento</FieldLabel>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={formData.faturamento}
                      onChange={(e) => setFormData({ ...formData, faturamento: e.target.value })}
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatsCard
          title="Investido"
          value={formatCurrency(totalInvestido)}
          subtitle="Este mes"
          icon={Megaphone}
          variant="warning"
        />
        <StatsCard
          title="Faturamento"
          value={formatCurrency(totalFaturamento)}
          subtitle="Este mes"
          icon={TrendingUp}
          variant="success"
        />
        <StatsCard
          title="ROI"
          value={`${roi.toFixed(1)}%`}
          subtitle="Retorno"
          icon={TrendingUp}
          variant={roi >= 0 ? 'success' : 'danger'}
        />
        <StatsCard
          title="Conversas"
          value={totalConversas.toString()}
          subtitle="Total"
          icon={MessageCircle}
          variant="default"
        />
        <StatsCard
          title="Vendas"
          value={totalVendas.toString()}
          subtitle="Total"
          icon={ShoppingCart}
          variant="success"
        />
        <StatsCard
          title="Custo/Conversa"
          value={formatCurrency(custoMedioConversa)}
          subtitle="Media"
          icon={MessageCircle}
          variant="default"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Investido vs Faturamento</CardTitle>
          </CardHeader>
          <CardContent>
            {getEvolucao().some(d => d.investido > 0 || d.faturamento > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={getEvolucao()}>
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
                  <Legend />
                  <Line type="monotone" dataKey="investido" name="Investido" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="faturamento" name="Faturamento" stroke="#22c55e" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                <p>Nenhum dado de trafego registrado</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Por Plataforma</CardTitle>
          </CardHeader>
          <CardContent>
            {getDadosPorPlataforma().length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={getDadosPorPlataforma()}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(v) => `R$${v}`} />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="investido" name="Investido" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="faturamento" name="Faturamento" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                <p>Nenhum dado de trafego registrado</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
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

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Plataforma</TableHead>
                <TableHead className="text-right">Investido</TableHead>
                <TableHead className="text-right">Conversas</TableHead>
                <TableHead className="text-right">Custo/Conversa</TableHead>
                <TableHead className="text-right">Vendas</TableHead>
                <TableHead className="text-right">Faturamento</TableHead>
                <TableHead className="w-[100px]">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTrafego.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhum registro de trafego
                  </TableCell>
                </TableRow>
              ) : (
                filteredTrafego.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{formatDate(t.data)}</TableCell>
                    <TableCell className="font-medium">{t.plataforma}</TableCell>
                    <TableCell className="text-right text-warning">{formatCurrency(t.valorInvestido)}</TableCell>
                    <TableCell className="text-right">{t.conversas}</TableCell>
                    <TableCell className="text-right">{formatCurrency(t.custoConversa)}</TableCell>
                    <TableCell className="text-right">{t.vendas}</TableCell>
                    <TableCell className="text-right font-semibold text-success">{formatCurrency(t.faturamento)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(t)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteTrafego(t.id)}>
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
