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
import { Plus, Pencil, Trash2, Image, Users, ShoppingCart, TrendingUp, TrendingDown, Award, PlusCircle } from 'lucide-react'
import { plataformasTrafego, mesesNomes, type Criativo } from '@/lib/types'
import { StatsCard } from './stats-card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

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

export function Criativos() {
  const { criativos, addCriativo, updateCriativo, deleteCriativo, mesAtual, anoAtual } = useData()
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isNewCriativo, setIsNewCriativo] = useState(true)

  // Lista de nomes de criativos unicos (para selecionar um existente)
  const criativosUnicos = [...new Set(criativos.map(c => c.nome))]

  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0],
    nome: '',
    nomeSelecionado: '',
    plataforma: '',
    pessoasAlcancadas: '',
    conversoes: '',
  })

  const resetForm = () => {
    setFormData({
      data: new Date().toISOString().split('T')[0],
      nome: '',
      nomeSelecionado: '',
      plataforma: '',
      pessoasAlcancadas: '',
      conversoes: '',
    })
    setEditingId(null)
    setIsNewCriativo(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Se estiver continuando um criativo existente, usar o nome selecionado
    let nomeDosCriativos = isNewCriativo ? formData.nome : formData.nomeSelecionado
    
    // Se selecionou um existente, pegar a plataforma dele
    let plataforma = formData.plataforma
    if (!isNewCriativo && formData.nomeSelecionado) {
      const criativoExistente = criativos.find(c => c.nome === formData.nomeSelecionado)
      if (criativoExistente && !plataforma) {
        plataforma = criativoExistente.plataforma
      }
    }

    const criativo = {
      data: formData.data,
      nome: nomeDosCriativos,
      plataforma: plataforma,
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
      nomeSelecionado: criativo.nome,
      plataforma: criativo.plataforma,
      pessoasAlcancadas: criativo.pessoasAlcancadas.toString(),
      conversoes: criativo.conversoes.toString(),
    })
    setEditingId(criativo.id)
    setIsNewCriativo(true)
    setIsOpen(true)
  }

  // Agrupar criativos por nome para ver totais
  const criativosAgrupados = criativosUnicos.map(nome => {
    const registros = criativos.filter(c => c.nome === nome)
    const totalPessoas = registros.reduce((sum, c) => sum + c.pessoasAlcancadas, 0)
    const totalConversoes = registros.reduce((sum, c) => sum + c.conversoes, 0)
    const taxaConversao = totalPessoas > 0 ? (totalConversoes / totalPessoas) * 100 : 0
    const plataforma = registros[0]?.plataforma || ''
    return {
      nome,
      plataforma,
      registros: registros.length,
      totalPessoas,
      totalConversoes,
      taxaConversao,
    }
  }).sort((a, b) => b.taxaConversao - a.taxaConversao)

  // Calculos do mes
  const totalPessoas = criativos.reduce((sum, c) => sum + c.pessoasAlcancadas, 0)
  const totalConversoes = criativos.reduce((sum, c) => sum + c.conversoes, 0)
  const taxaConversaoGeral = totalPessoas > 0 ? (totalConversoes / totalPessoas) * 100 : 0

  // Melhor e pior criativo
  const melhorCriativo = criativosAgrupados[0]
  const piorCriativo = criativosAgrupados[criativosAgrupados.length - 1]

  // Dados para grafico de barras (por criativo agrupado)
  const getChartData = () => {
    return criativosAgrupados.map(c => ({
      name: c.nome.length > 12 ? c.nome.substring(0, 12) + '...' : c.nome,
      pessoas: c.totalPessoas,
      conversoes: c.totalConversoes,
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

  const sortedCriativos = [...criativos].sort((a, b) => {
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
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Criativos</h1>
          <p className="text-muted-foreground mt-1">{mesesNomes[mesAtual - 1]} {anoAtual} - Analise de desempenho</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Registrar Dados
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Registro' : 'Registrar Dados do Criativo'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FieldGroup>
                {/* Opcao: Novo ou Existente */}
                {!editingId && criativosUnicos.length > 0 && (
                  <div className="flex gap-2 mb-2">
                    <Button
                      type="button"
                      variant={isNewCriativo ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setIsNewCriativo(true)}
                    >
                      <PlusCircle className="h-4 w-4 mr-1" />
                      Novo Criativo
                    </Button>
                    <Button
                      type="button"
                      variant={!isNewCriativo ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setIsNewCriativo(false)}
                    >
                      <Image className="h-4 w-4 mr-1" />
                      Continuar Existente
                    </Button>
                  </div>
                )}

                {isNewCriativo ? (
                  <>
                    <Field>
                      <FieldLabel>Nome do Criativo</FieldLabel>
                      <Input
                        placeholder="Ex: Video A, Story Promo..."
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
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
                  </>
                ) : (
                  <Field>
                    <FieldLabel>Selecionar Criativo</FieldLabel>
                    <Select 
                      value={formData.nomeSelecionado} 
                      onValueChange={(v) => setFormData({ ...formData, nomeSelecionado: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o criativo" />
                      </SelectTrigger>
                      <SelectContent>
                        {criativosUnicos.map(nome => {
                          const c = criativos.find(cr => cr.nome === nome)
                          return (
                            <SelectItem key={nome} value={nome}>
                              {nome} ({c?.plataforma})
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </Field>
                )}

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
                  {editingId ? 'Salvar' : 'Registrar'}
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
          title="Criativos"
          value={criativosUnicos.length.toString()}
          subtitle={`${criativos.length} registros`}
          icon={Image}
          variant="default"
        />
      </div>

      {/* Destaque Melhor e Pior */}
      {criativosAgrupados.length >= 2 && (
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
                    <span className="text-muted-foreground">{melhorCriativo?.totalPessoas.toLocaleString('pt-BR')} pessoas</span>
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
                    <span className="text-muted-foreground">{piorCriativo?.totalPessoas.toLocaleString('pt-BR')} pessoas</span>
                    <span className="text-red-500 font-semibold">{piorCriativo?.taxaConversao.toFixed(2)}% conversao</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Resumo por Criativo */}
      {criativosAgrupados.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Resumo por Criativo</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Criativo</TableHead>
                  <TableHead>Plataforma</TableHead>
                  <TableHead className="text-right">Registros</TableHead>
                  <TableHead className="text-right">Alcance Total</TableHead>
                  <TableHead className="text-right">Conversoes</TableHead>
                  <TableHead className="text-center">Taxa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {criativosAgrupados.map((c) => (
                  <TableRow key={c.nome}>
                    <TableCell className="font-medium">{c.nome}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{c.plataforma}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{c.registros}</TableCell>
                    <TableCell className="text-right">{c.totalPessoas.toLocaleString('pt-BR')}</TableCell>
                    <TableCell className="text-right font-semibold text-green-600">{c.totalConversoes}</TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant={c.taxaConversao >= 2 ? 'default' : 'destructive'}
                        className={c.taxaConversao >= 2 ? 'bg-green-500 hover:bg-green-500/80' : ''}
                      >
                        {c.taxaConversao.toFixed(2)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
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
          {criativosAgrupados.length > 0 ? (
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

      {/* Table - Todos os Registros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Todos os Registros Diarios</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Criativo</TableHead>
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
                    Nenhum registro
                  </TableCell>
                </TableRow>
              ) : (
                sortedCriativos.map((criativo) => (
                  <TableRow key={criativo.id}>
                    <TableCell>{formatDate(criativo.data)}</TableCell>
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
