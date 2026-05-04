"use client"

import { useState } from 'react'
import { useData } from '@/lib/data-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Calendar, TrendingUp, TrendingDown, DollarSign, Users, ArrowUpRight, ArrowDownRight, Minus, History, BarChart3 } from 'lucide-react'
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

export function Historico() {
  const { historico, mesAtual, anoAtual } = useData()
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [activeTab, setActiveTab] = useState('comparativo')

  // Ordenar historico do mais recente ao mais antigo
  const historicoOrdenado = [...historico].sort((a, b) => {
    if (a.ano !== b.ano) return b.ano - a.ano
    return b.mes - a.mes
  })

  const selectedHistorico = historicoOrdenado.find(h => h.id === selectedMonth)

  // Dados para comparativo
  const getComparativoData = () => {
    return historicoOrdenado.slice(0, 12).reverse().map(h => ({
      name: h.label.split(' ')[0].substring(0, 3),
      faturamento: h.resumo.faturamentoTotal + h.resumo.vendasTrafego,
      gastos: h.resumo.gastosTotal + h.resumo.investimentoTrafego,
      lucro: h.resumo.lucroLiquido,
    }))
  }

  // Calcular variacao entre meses
  const getVariacao = (atual: number, anterior: number) => {
    if (anterior === 0) return { valor: atual > 0 ? 100 : 0, tipo: atual > 0 ? 'up' : 'neutral' }
    const variacao = ((atual - anterior) / Math.abs(anterior)) * 100
    return {
      valor: Math.abs(variacao),
      tipo: variacao > 0 ? 'up' : variacao < 0 ? 'down' : 'neutral'
    }
  }

  // Comparativo entre os dois ultimos meses
  const ultimoMes = historicoOrdenado[0]
  const penultimoMes = historicoOrdenado[1]

  const variacaoFaturamento = ultimoMes && penultimoMes 
    ? getVariacao(ultimoMes.resumo.faturamentoTotal + ultimoMes.resumo.vendasTrafego, penultimoMes.resumo.faturamentoTotal + penultimoMes.resumo.vendasTrafego)
    : null

  const variacaoGastos = ultimoMes && penultimoMes 
    ? getVariacao(ultimoMes.resumo.gastosTotal + ultimoMes.resumo.investimentoTrafego, penultimoMes.resumo.gastosTotal + penultimoMes.resumo.investimentoTrafego)
    : null

  const variacaoLucro = ultimoMes && penultimoMes 
    ? getVariacao(ultimoMes.resumo.lucroLiquido, penultimoMes.resumo.lucroLiquido)
    : null

  const variacaoConversao = ultimoMes && penultimoMes 
    ? getVariacao(ultimoMes.resumo.taxaConversao, penultimoMes.resumo.taxaConversao)
    : null

  // Dados de evolucao da taxa de conversao
  const getEvolucaoConversao = () => {
    return historicoOrdenado.slice(0, 12).reverse().map(h => ({
      name: h.label.split(' ')[0].substring(0, 3),
      taxa: h.resumo.taxaConversao,
      contatos: h.resumo.totalContatos,
      fechados: h.resumo.totalFechados,
    }))
  }

  // Comparativo de criativos entre meses
  const getComparativoCriativos = () => {
    return historicoOrdenado.slice(0, 6).reverse().map(h => {
      const totalPessoas = h.criativos.reduce((sum, c) => sum + c.pessoasAlcancadas, 0)
      const totalConversoes = h.criativos.reduce((sum, c) => sum + c.conversoes, 0)
      return {
        name: h.label.split(' ')[0].substring(0, 3),
        pessoas: totalPessoas,
        conversoes: totalConversoes,
        taxa: totalPessoas > 0 ? (totalConversoes / totalPessoas) * 100 : 0,
      }
    })
  }

  const VariacaoIndicator = ({ variacao, invertColors = false }: { variacao: { valor: number, tipo: string } | null, invertColors?: boolean }) => {
    if (!variacao) return <Minus className="h-4 w-4 text-muted-foreground" />
    
    const isPositive = invertColors ? variacao.tipo === 'down' : variacao.tipo === 'up'
    const isNegative = invertColors ? variacao.tipo === 'up' : variacao.tipo === 'down'
    
    return (
      <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-green-600' : isNegative ? 'text-red-500' : 'text-muted-foreground'}`}>
        {variacao.tipo === 'up' ? (
          <ArrowUpRight className="h-4 w-4" />
        ) : variacao.tipo === 'down' ? (
          <ArrowDownRight className="h-4 w-4" />
        ) : (
          <Minus className="h-4 w-4" />
        )}
        {variacao.valor.toFixed(1)}%
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Historico e Comparativo</h1>
        <p className="text-muted-foreground mt-1">Analise o desempenho ao longo dos meses</p>
      </div>

      {historico.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <History className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum historico disponivel</h3>
            <p className="text-muted-foreground text-center max-w-md">
              O historico sera gerado automaticamente ao virar o mes. Todos os dados do mes atual serao arquivados e o sistema comecara zerado.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="comparativo">Comparativo</TabsTrigger>
              <TabsTrigger value="detalhes">Detalhes por Mes</TabsTrigger>
            </TabsList>

            {/* Tab Comparativo */}
            <TabsContent value="comparativo" className="space-y-8 mt-6">
              {/* Cards de variacao */}
              {ultimoMes && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Faturamento</p>
                          <p className="text-2xl font-bold">{formatCurrency(ultimoMes.resumo.faturamentoTotal + ultimoMes.resumo.vendasTrafego)}</p>
                          <p className="text-xs text-muted-foreground mt-1">{ultimoMes.label}</p>
                        </div>
                        <VariacaoIndicator variacao={variacaoFaturamento} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Gastos</p>
                          <p className="text-2xl font-bold">{formatCurrency(ultimoMes.resumo.gastosTotal + ultimoMes.resumo.investimentoTrafego)}</p>
                          <p className="text-xs text-muted-foreground mt-1">{ultimoMes.label}</p>
                        </div>
                        <VariacaoIndicator variacao={variacaoGastos} invertColors />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Lucro Liquido</p>
                          <p className={`text-2xl font-bold ${ultimoMes.resumo.lucroLiquido >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {formatCurrency(ultimoMes.resumo.lucroLiquido)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">{ultimoMes.label}</p>
                        </div>
                        <VariacaoIndicator variacao={variacaoLucro} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Taxa Conversao</p>
                          <p className="text-2xl font-bold">{ultimoMes.resumo.taxaConversao.toFixed(1)}%</p>
                          <p className="text-xs text-muted-foreground mt-1">{ultimoMes.label}</p>
                        </div>
                        <VariacaoIndicator variacao={variacaoConversao} />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Graficos Comparativos */}
              <div className="grid gap-6 lg:grid-cols-2 xl:gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-semibold">Evolucao Financeira</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {getComparativoData().length > 0 ? (
                      <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={getComparativoData()}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="name" className="text-xs" />
                          <YAxis className="text-xs" tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                            }}
                            formatter={(value: number) => formatCurrency(value)}
                          />
                          <Legend />
                          <Bar dataKey="faturamento" name="Faturamento" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="gastos" name="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                        <p>Dados insuficientes</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-semibold">Evolucao do Lucro</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {getComparativoData().length > 0 ? (
                      <ResponsiveContainer width="100%" height={350}>
                        <LineChart data={getComparativoData()}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="name" className="text-xs" />
                          <YAxis className="text-xs" tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                            }}
                            formatter={(value: number) => formatCurrency(value)}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="lucro" 
                            name="Lucro"
                            stroke="#22c55e" 
                            strokeWidth={3}
                            dot={{ fill: '#22c55e', strokeWidth: 2, r: 5 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                        <p>Dados insuficientes</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Graficos de Conversao e Criativos */}
              <div className="grid gap-6 lg:grid-cols-2 xl:gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-semibold">Evolucao da Taxa de Conversao</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {getEvolucaoConversao().length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={getEvolucaoConversao()}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="name" className="text-xs" />
                          <YAxis className="text-xs" tickFormatter={(value) => `${value}%`} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                            }}
                            formatter={(value: number, name: string) => [
                              name === 'taxa' ? `${value.toFixed(1)}%` : value,
                              name === 'taxa' ? 'Taxa' : name === 'contatos' ? 'Contatos' : 'Fechados'
                            ]}
                          />
                          <Legend />
                          <Line type="monotone" dataKey="taxa" name="taxa" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        <p>Dados insuficientes</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-semibold">Desempenho dos Criativos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {getComparativoCriativos().length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={getComparativoCriativos()}>
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
                          <Legend />
                          <Bar dataKey="pessoas" name="Alcance" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="conversoes" name="Conversoes" fill="#22c55e" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        <p>Dados insuficientes</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Tabela Comparativa */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Resumo por Mes</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mes</TableHead>
                        <TableHead className="text-right">Faturamento</TableHead>
                        <TableHead className="text-right">Gastos</TableHead>
                        <TableHead className="text-right">Lucro</TableHead>
                        <TableHead className="text-center">Contatos</TableHead>
                        <TableHead className="text-center">Fechados</TableHead>
                        <TableHead className="text-center">Conversao</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historicoOrdenado.map((h) => (
                        <TableRow key={h.id}>
                          <TableCell className="font-medium">{h.label}</TableCell>
                          <TableCell className="text-right">{formatCurrency(h.resumo.faturamentoTotal + h.resumo.vendasTrafego)}</TableCell>
                          <TableCell className="text-right text-red-500">{formatCurrency(h.resumo.gastosTotal + h.resumo.investimentoTrafego)}</TableCell>
                          <TableCell className={`text-right font-semibold ${h.resumo.lucroLiquido >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {formatCurrency(h.resumo.lucroLiquido)}
                          </TableCell>
                          <TableCell className="text-center">{h.resumo.totalContatos}</TableCell>
                          <TableCell className="text-center">{h.resumo.totalFechados}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={h.resumo.taxaConversao >= 30 ? 'default' : 'secondary'}>
                              {h.resumo.taxaConversao.toFixed(1)}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Detalhes por Mes */}
            <TabsContent value="detalhes" className="space-y-6 mt-6">
              <div className="flex items-center gap-4">
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-[250px]">
                    <SelectValue placeholder="Selecione um mes" />
                  </SelectTrigger>
                  <SelectContent>
                    {historicoOrdenado.map(h => (
                      <SelectItem key={h.id} value={h.id}>{h.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedHistorico ? (
                <div className="space-y-6">
                  {/* Stats do mes selecionado */}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatsCard
                      title="Faturamento"
                      value={formatCurrency(selectedHistorico.resumo.faturamentoTotal + selectedHistorico.resumo.vendasTrafego)}
                      icon={DollarSign}
                      variant="default"
                    />
                    <StatsCard
                      title="Gastos"
                      value={formatCurrency(selectedHistorico.resumo.gastosTotal + selectedHistorico.resumo.investimentoTrafego)}
                      icon={TrendingDown}
                      variant="danger"
                    />
                    <StatsCard
                      title="Lucro"
                      value={formatCurrency(selectedHistorico.resumo.lucroLiquido)}
                      icon={TrendingUp}
                      variant={selectedHistorico.resumo.lucroLiquido >= 0 ? 'success' : 'danger'}
                    />
                    <StatsCard
                      title="Taxa Conversao"
                      value={`${selectedHistorico.resumo.taxaConversao.toFixed(1)}%`}
                      subtitle={`${selectedHistorico.resumo.totalFechados}/${selectedHistorico.resumo.totalContatos} contatos`}
                      icon={Users}
                      variant="default"
                    />
                  </div>

                  {/* Detalhes das transacoes */}
                  <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Receitas ({selectedHistorico.receitas.length})</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0 max-h-[300px] overflow-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Data</TableHead>
                              <TableHead>Cliente</TableHead>
                              <TableHead className="text-right">Valor</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedHistorico.receitas.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                                  Nenhuma receita
                                </TableCell>
                              </TableRow>
                            ) : (
                              selectedHistorico.receitas.map((r) => (
                                <TableRow key={r.id}>
                                  <TableCell>{formatDate(r.data)}</TableCell>
                                  <TableCell>{r.cliente}</TableCell>
                                  <TableCell className="text-right font-semibold">{formatCurrency(r.valor)}</TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Gastos ({selectedHistorico.gastos.length})</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0 max-h-[300px] overflow-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Data</TableHead>
                              <TableHead>Descricao</TableHead>
                              <TableHead className="text-right">Valor</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedHistorico.gastos.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                                  Nenhum gasto
                                </TableCell>
                              </TableRow>
                            ) : (
                              selectedHistorico.gastos.map((g) => (
                                <TableRow key={g.id}>
                                  <TableCell>{formatDate(g.data)}</TableCell>
                                  <TableCell>{g.descricao}</TableCell>
                                  <TableCell className="text-right font-semibold text-red-500">{formatCurrency(g.valor)}</TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Criativos do mes */}
                  {selectedHistorico.criativos.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Criativos ({selectedHistorico.criativos.length})</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Nome</TableHead>
                              <TableHead>Plataforma</TableHead>
                              <TableHead className="text-right">Alcance</TableHead>
                              <TableHead className="text-right">Conversoes</TableHead>
                              <TableHead className="text-center">Taxa</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedHistorico.criativos.map((c) => (
                              <TableRow key={c.id}>
                                <TableCell className="font-medium">{c.nome}</TableCell>
                                <TableCell>{c.plataforma}</TableCell>
                                <TableCell className="text-right">{c.pessoasAlcancadas.toLocaleString('pt-BR')}</TableCell>
                                <TableCell className="text-right">{c.conversoes}</TableCell>
                                <TableCell className="text-center">
                                  <Badge variant={c.taxaConversao >= 2 ? 'default' : 'secondary'}>
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
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">Selecione um mes para ver os detalhes</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
