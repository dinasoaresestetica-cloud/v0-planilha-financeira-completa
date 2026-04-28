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
import { Plus, Pencil, Trash2, Image, Users, ShoppingCart, TrendingUp, TrendingDown, Award } from 'lucide-react'
import { plataformasTrafego, mesesNomes, type Criativo } from '@/lib/types'
import { StatsCard } from './stats-card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

export function Criativos() {
  const { criativos, addCriativo, updateCriativo, deleteCriativo, mesAtual, anoAtual } = useData()
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0],
    nome: '',
    plataforma: '',
    pessoasAlcancadas: '',
    conversoes: '',
  })

  const resetForm = () => {
    setFormData({
      data: new Date().toISOString().split('T')[0],
      nome: '',
      plataforma: '',
      pessoasAlcancadas: '',
      conversoes: '',
    })
    setEditingId(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const criativo = {
      data: formData.data,
      nome: formData.nome,
      plataforma: formData.plataforma,
      pessoasAlcancadas: parseInt(formData.pessoasAlcancadas) || 0,
      conversoes: parseInt(formData.conversoes) || 0,
    }

    if (editingId) {
      updateCriativo(editingId, criativo)
    } else {
      addCriativo(criativo)
    }
    
    setIsOpen(false)
    resetForm()
  }

  const handleEdit = (criativo: Criativo) => {
    setFormData({
      data: criativo.data,
      nome: criativo.nome,
      plataforma: criativo.plataforma,
      pessoasAlcancadas: criativo.pessoasAlcancadas.toString(),
      conversoes: criativo.conversoes.toString(),
    })
    setEditingId(criativo.id)
    setIsOpen(true)
  }

  // Calculos do mes
  const totalPessoas = criativos.reduce((sum, c) => sum + c.pessoasAlcancadas, 0)
  const totalConversoes = criativos.reduce((sum, c) => sum + c.conversoes, 0)
  const taxaConversaoGeral = totalPessoas > 0 ? (totalConversoes / totalPessoas) * 100 : 0

  // Melhor e pior criativo
  const criativosOrdenados = [...criativos].sort((a, b) => b.taxaConversao - a.taxaConversao)
  const melhorCriativo = criativosOrdenados[0]
  const piorCriativo = criativosOrdenados[criativosOrdenados.length - 1]

  // Dados para grafico de barras
  const getChartData = () => {
    return criativos.map(c => ({
      name: c.nome.length > 15 ? c.nome.substring(0, 15) + '...' : c.nome,
      pessoas: c.pessoasAlcancadas,
      conversoes: c.conversoes,
      taxa: c.taxaConversao,
    }))
  }

  // Dados por plataforma
  const getDadosPorPlataforma = () => {
    return plataformasTrafego.map(plataforma => {
      const registros = criativos.filter(c => c.plataforma === plataforma)
      const pessoas = registros.reduce((sum, c) => sum + c.pessoasAlcancadas, 0)
      const conversoes = registros.reduce((sum, c) => sum + c.conversoes, 0)
      return {
        name: plataforma,
        pessoas,
        conversoes,
        taxa: pessoas > 0 ? (conversoes / pessoas) * 100 : 0,
      }
    }).filter(item => item.pessoas > 0)
  }

  const sortedCriativos = [...criativos].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Criativos</h1>
          <p className="text-muted-foreground mt-1">{mesesNomes[mesAtual - 1]} {anoAtual} - Analise de desempenho dos criativos</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Criativo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Criativo' : 'Novo Criativo'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel>Nome do Criativo</FieldLabel>
                  <Input
                    placeholder="Ex: Criativo Video A, Story Promocao..."
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
                    <FieldLabel>Plataforma</FieldLabel>
                    <Select 
                      value={formData.plataforma} 
                      onValueChange={(v) => setFormData({ ...formData, plataforma: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {plataformasTrafego.map(plataforma => (
                          <SelectItem key={plataforma} value={plataforma}>{plataforma}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>Pessoas Alcancadas</FieldLabel>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.pessoasAlcancadas}
                      onChange={(e) => setFormData({ ...formData, pessoasAlcancadas: e.target.value })}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Conversoes (Vendas)</FieldLabel>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.conversoes}
                      onChange={(e) => setFormData({ ...formData, conversoes: e.target.value })}
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Pessoas"
          value={totalPessoas.toLocaleString('pt-BR')}
          subtitle="Alcancadas pelo trafego"
          icon={Users}
          variant="default"
        />
        <StatsCard
          title="Total Conversoes"
          value={totalConversoes.toString()}
          subtitle="Vendas geradas"
          icon={ShoppingCart}
          variant="success"
        />
        <StatsCard
          title="Taxa Geral"
          value={`${taxaConversaoGeral.toFixed(2)}%`}
          subtitle="Conversoes / Alcance"
          icon={TrendingUp}
          variant={taxaConversaoGeral >= 2 ? 'success' : taxaConversaoGeral >= 1 ? 'warning' : 'danger'}
        />
        <StatsCard
          title="Criativos Ativos"
          value={criativos.length.toString()}
          subtitle="Registrados no mes"
          icon={Image}
          variant="default"
        />
      </div>

      {/* Destaque Melhor e Pior */}
      {criativos.length >= 2 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-green-500/50 bg-green-500/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <Award className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Melhor Criativo</p>
                  <p className="text-lg font-bold text-foreground">{melhorCriativo?.nome}</p>
                  <div className="flex gap-4 mt-2 text-sm">
                    <span className="text-muted-foreground">{melhorCriativo?.pessoasAlcancadas.toLocaleString('pt-BR')} pessoas</span>
                    <span className="text-green-600 font-semibold">{melhorCriativo?.taxaConversao.toFixed(2)}% conversao</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-500/50 bg-red-500/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <TrendingDown className="h-6 w-6 text-red-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Criativo a Melhorar</p>
                  <p className="text-lg font-bold text-foreground">{piorCriativo?.nome}</p>
                  <div className="flex gap-4 mt-2 text-sm">
                    <span className="text-muted-foreground">{piorCriativo?.pessoasAlcancadas.toLocaleString('pt-BR')} pessoas</span>
                    <span className="text-red-500 font-semibold">{piorCriativo?.taxaConversao.toFixed(2)}% conversao</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2 xl:gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Desempenho por Criativo</CardTitle>
          </CardHeader>
          <CardContent>
            {getChartData().length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={getChartData()} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="name" type="category" className="text-xs" width={100} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number, name: string) => [
                      name === 'taxa' ? `${value.toFixed(2)}%` : value.toLocaleString('pt-BR'),
                      name === 'pessoas' ? 'Alcance' : name === 'conversoes' ? 'Conversoes' : 'Taxa'
                    ]}
                  />
                  <Bar dataKey="pessoas" name="pessoas" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="conversoes" name="conversoes" fill="#22c55e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                <p>Nenhum criativo registrado</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Desempenho por Plataforma</CardTitle>
          </CardHeader>
          <CardContent>
            {getDadosPorPlataforma().length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={getDadosPorPlataforma()}>
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
                  <Bar dataKey="pessoas" name="Pessoas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="conversoes" name="Conversoes" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                <p>Nenhum dado por plataforma</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Taxa de Conversao por Criativo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Taxa de Conversao por Criativo</CardTitle>
        </CardHeader>
        <CardContent>
          {criativos.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={getChartData()}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={(value) => `${value}%`} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`${value.toFixed(2)}%`, 'Taxa de Conversao']}
                />
                <Line 
                  type="monotone" 
                  dataKey="taxa" 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              <p>Nenhum criativo registrado</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Todos os Criativos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Plataforma</TableHead>
                <TableHead className="text-right">Alcance</TableHead>
                <TableHead className="text-right">Conversoes</TableHead>
                <TableHead className="text-center">Taxa</TableHead>
                <TableHead className="w-[100px]">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCriativos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum criativo registrado
                  </TableCell>
                </TableRow>
              ) : (
                sortedCriativos.map((criativo) => (
                  <TableRow key={criativo.id}>
                    <TableCell>{new Date(criativo.data).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className="font-medium">{criativo.nome}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{criativo.plataforma}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{criativo.pessoasAlcancadas.toLocaleString('pt-BR')}</TableCell>
                    <TableCell className="text-right font-semibold text-green-600">{criativo.conversoes}</TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant={criativo.taxaConversao >= 2 ? 'default' : 'destructive'}
                        className={criativo.taxaConversao >= 2 ? 'bg-green-500 hover:bg-green-500/80' : ''}
                      >
                        {criativo.taxaConversao.toFixed(2)}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(criativo)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteCriativo(criativo.id)}>
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
