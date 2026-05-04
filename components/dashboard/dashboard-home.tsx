"use client"

import { useData } from '@/lib/data-context'
import { StatsCard } from './stats-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, TrendingUp, TrendingDown, Users, Megaphone, ShoppingCart, UserPlus, UserCheck } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { categoriasGasto } from '@/lib/types'
import { useState, useEffect } from 'react'

// Tipo para cliente na analise
interface ClienteAnalise {
  id: string
  data: string
  quantidadeClientes: number
  quantidadeCompras: number
  tipo: 'novo' | 'antigo'
  valorTotal: number
}

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

export function DashboardHome() {
  const { 
    gastos, 
    trafego,
    parceiros,
    ferramentas,
    getTotalGastos, 
    getTotalTrafego,
    getTotalVendasTrafego,
  } = useData()

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  // Carregar dados de clientes da aba de analise
  const [clientesAnalise, setClientesAnalise] = useState<ClienteAnalise[]>([])
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('analise-clientes-v2')
      if (stored) {
        setClientesAnalise(JSON.parse(stored))
      }
    }
  }, [])

  // Filtrar clientes do mes atual
  const clientesMesAtual = clientesAnalise.filter(c => {
    const { year, month } = getDateParts(c.data)
    return month === currentMonth && year === currentYear
  })

  // Calculos de clientes
  const clientesNovos = clientesMesAtual.filter(c => c.tipo === 'novo')
  const clientesAntigos = clientesMesAtual.filter(c => c.tipo === 'antigo')
  const totalClientesNovos = clientesNovos.reduce((sum, c) => sum + c.quantidadeClientes, 0)
  const totalClientesAntigos = clientesAntigos.reduce((sum, c) => sum + c.quantidadeClientes, 0)
  const totalClientes = totalClientesNovos + totalClientesAntigos
  const valorClientesNovos = clientesNovos.reduce((sum, c) => sum + c.valorTotal, 0)
  const valorClientesAntigos = clientesAntigos.reduce((sum, c) => sum + c.valorTotal, 0)
  const totalVendasClientes = clientesNovos.reduce((sum, c) => sum + c.quantidadeCompras, 0) + 
    clientesAntigos.reduce((sum, c) => sum + c.quantidadeCompras, 0)

  // Calculos automaticos baseados em todos os dados
  const totalVendasTrafego = getTotalVendasTrafego(currentMonth, currentYear)
  
  // Faturamento total = Vendas Trafego
  const faturamentoTotal = totalVendasTrafego
  
  // Gastos totais incluindo trafego pago e ferramentas
  const totalGastos = getTotalGastos(currentMonth, currentYear)
  const totalTrafego = getTotalTrafego(currentMonth, currentYear)
  const totalFerramentas = ferramentas.reduce((sum, f) => sum + f.valor, 0)
  const gastosTotal = totalGastos + totalTrafego + totalFerramentas
  
  // Calculo de lucro dos parceiros (participacao no faturamento)
  const totalPorcentagemParceiros = parceiros.reduce((sum, p) => sum + p.porcentagem, 0)
  const lucroParceiros = faturamentoTotal * (totalPorcentagemParceiros / 100)
  
  // Lucro liquido real (faturamento - gastos - participacao parceiros)
  const lucroLiquido = faturamentoTotal - gastosTotal - lucroParceiros
  
  const totalConversas = trafego.filter(t => {
    const { year, month } = getDateParts(t.data)
    return month === currentMonth && year === currentYear
  }).reduce((sum, t) => sum + t.conversas, 0)
  const totalVendasTrafegoCount = trafego.filter(t => {
    const { year, month } = getDateParts(t.data)
    return month === currentMonth && year === currentYear
  }).reduce((sum, t) => sum + t.vendas, 0)

  // Dados para grafico de faturamento por mes
  const getMonthlyData = () => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    return months.map((month, index) => {
      const mes = index + 1
      
      // Vendas do trafego pago
      const vendasTrafegoMes = trafego
        .filter(t => {
          const { year, month } = getDateParts(t.data)
          return month === mes && year === currentYear
        })
        .reduce((sum, t) => sum + t.faturamento, 0)
      
      const faturamentoMes = vendasTrafegoMes
      
      // Gastos do mes
      const gastosMes = gastos
        .filter(g => {
          const { year, month } = getDateParts(g.data)
          return month === mes && year === currentYear
        })
        .reduce((sum, g) => sum + g.valor, 0)
      
      // Investimento em trafego
      const trafegoMes = trafego
        .filter(t => {
          const { year, month } = getDateParts(t.data)
          return month === mes && year === currentYear
        })
        .reduce((sum, t) => sum + t.valorInvestido, 0)
      
      // Lucro parceiros do mes
      const lucroParcMes = faturamentoMes * (totalPorcentagemParceiros / 100)
      
      const gastosTotalMes = gastosMes + trafegoMes
      
      return {
        name: month,
        faturamento: faturamentoMes,
        gastos: gastosTotalMes,
        lucro: faturamentoMes - gastosTotalMes - lucroParcMes,
      }
    })
  }

  // Dados para grafico de gastos por categoria (inclui ferramentas)
  const getGastosPorCategoria = () => {
    const gastosMes = gastos.filter(g => {
      const { year, month } = getDateParts(g.data)
      return month === currentMonth && year === currentYear
    })

    const categoriasDados = categoriasGasto.map(cat => ({
      name: cat.label,
      value: gastosMes.filter(g => g.categoria === cat.value).reduce((sum, g) => sum + g.valor, 0),
    }))
    
    // Adicionar ferramentas como categoria separada se houver
    if (totalFerramentas > 0) {
      // Verificar se ja existe categoria ferramentas nos gastos
      const ferramentasIndex = categoriasDados.findIndex(c => c.name === 'Ferramentas')
      if (ferramentasIndex >= 0) {
        categoriasDados[ferramentasIndex].value += totalFerramentas
      } else {
        categoriasDados.push({ name: 'Ferramentas/Softwares', value: totalFerramentas })
      }
    }
    
    // Adicionar investimento em trafego como categoria
    if (totalTrafego > 0) {
      categoriasDados.push({ name: 'Trafego Pago', value: totalTrafego })
    }
    
    return categoriasDados.filter(item => item.value > 0)
  }

  const monthlyData = getMonthlyData()
  const gastosPorCategoria = getGastosPorCategoria()

  const COLORS = ['#3b82f6', '#22c55e', '#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16']

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-2">
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Visao geral do seu negocio</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        <StatsCard
          title="Faturamento Total"
          value={formatCurrency(faturamentoTotal)}
          subtitle="Receitas + Vendas"
          icon={DollarSign}
          variant="default"
        />
        <StatsCard
          title="Gastos Totais"
          value={formatCurrency(gastosTotal)}
          subtitle="Fixos + Variaveis + Trafego"
          icon={TrendingDown}
          variant="danger"
        />
        <StatsCard
          title="Lucro Liquido"
          value={formatCurrency(lucroLiquido)}
          subtitle="Faturamento - Gastos"
          icon={TrendingUp}
          variant={lucroLiquido >= 0 ? 'success' : 'danger'}
        />
        <StatsCard
          title="Trafego Pago"
          value={formatCurrency(totalTrafego)}
          subtitle={`${totalVendasTrafegoCount} vendas | ${totalConversas} conversas`}
          icon={Megaphone}
          variant="warning"
        />
        <StatsCard
          title="Lucro Parceiros"
          value={formatCurrency(lucroParceiros)}
          subtitle={`${totalPorcentagemParceiros}% do faturamento`}
          icon={Users}
          variant="warning"
        />
        <StatsCard
          title="Taxa Conversao"
          value={totalConversas > 0 ? `${Math.round((totalVendasTrafegoCount / totalConversas) * 100)}%` : '0%'}
          subtitle="Vendas / Conversas"
          icon={ShoppingCart}
          variant="success"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2 xl:gap-8">
        {/* Grafico de Faturamento x Gastos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Faturamento vs Gastos</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.some(d => d.faturamento > 0 || d.gastos > 0) ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(value) => `R$${value}`} />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="faturamento" name="Faturamento" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="gastos" name="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                <p>Nenhum dado disponivel. Adicione receitas ou gastos.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Grafico de Lucro */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Evolucao do Lucro</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.some(d => d.lucro !== 0) ? (
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(value) => `R$${value}`} />
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
                    dataKey="lucro" 
                    name="Lucro"
                    stroke="#22c55e" 
                    strokeWidth={2}
                    dot={{ fill: '#22c55e', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                <p>Nenhum dado disponivel. Adicione receitas ou gastos.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Grafico de Gastos por Categoria */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Gastos por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {gastosPorCategoria.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={gastosPorCategoria}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {gastosPorCategoria.map((_, index) => (
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
              <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                <p>Nenhum gasto registrado este mes.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resumo de Trafego com ROI */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Resumo de Trafego Pago</CardTitle>
          </CardHeader>
          <CardContent>
            {trafego.length > 0 ? (
              <div className="space-y-4">
                {/* ROI Geral */}
                <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">ROI do Mes</span>
                    <span className={`font-bold ${totalVendasTrafego > totalTrafego ? 'text-green-600' : 'text-red-500'}`}>
                      {totalTrafego > 0 ? `${Math.round(((totalVendasTrafego - totalTrafego) / totalTrafego) * 100)}%` : '0%'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Investido: {formatCurrency(totalTrafego)}</span>
                    <span>Retorno: {formatCurrency(totalVendasTrafego)}</span>
                  </div>
                </div>
                
                {trafego.slice(0, 4).map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{t.plataforma}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(t.data)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm text-green-600">{formatCurrency(t.faturamento)}</p>
                      <p className="text-xs text-muted-foreground">Investido: {formatCurrency(t.valorInvestido)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                <p>Nenhum dado de trafego registrado.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Resumo de Clientes */}
      {totalClientes > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-blue-500/30 bg-blue-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <UserPlus className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Clientes Novos</p>
                  <p className="text-xl font-bold">{totalClientesNovos}</p>
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {formatCurrency(valorClientesNovos)} em vendas
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-500/30 bg-green-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <UserCheck className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Clientes Antigos</p>
                  <p className="text-xl font-bold">{totalClientesAntigos}</p>
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {formatCurrency(valorClientesAntigos)} em vendas
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Clientes</p>
                  <p className="text-xl font-bold">{totalClientes}</p>
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {totalVendasClientes} vendas realizadas
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Receita Clientes</p>
                  <p className="text-xl font-bold">{formatCurrency(valorClientesNovos + valorClientesAntigos)}</p>
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {totalClientes > 0 ? formatCurrency((valorClientesNovos + valorClientesAntigos) / totalVendasClientes) : 'R$ 0'} ticket medio
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Resumos Adicionais */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 xl:gap-8">
        {/* Resumo Faturamento */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Detalhamento Faturamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center p-2 bg-accent/30 rounded">
              <span className="text-sm">Vendas Trafego Pago</span>
              <span className="font-semibold text-sm">{formatCurrency(totalVendasTrafego)}</span>
            </div>
            {(valorClientesNovos + valorClientesAntigos) > 0 && (
              <div className="flex justify-between items-center p-2 bg-accent/30 rounded">
                <span className="text-sm">Vendas Clientes</span>
                <span className="font-semibold text-sm">{formatCurrency(valorClientesNovos + valorClientesAntigos)}</span>
              </div>
            )}
            <div className="flex justify-between items-center p-3 bg-primary/10 rounded border border-primary/20 mt-2">
              <span className="font-medium">Total Faturamento</span>
              <span className="font-bold text-primary">{formatCurrency(faturamentoTotal)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Resumo Gastos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Detalhamento Gastos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center p-2 bg-accent/30 rounded">
              <span className="text-sm">Gastos Operacionais</span>
              <span className="font-semibold text-sm">{formatCurrency(totalGastos)}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-accent/30 rounded">
              <span className="text-sm">Investimento Trafego</span>
              <span className="font-semibold text-sm">{formatCurrency(totalTrafego)}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-accent/30 rounded">
              <span className="text-sm">Ferramentas/Softwares</span>
              <span className="font-semibold text-sm">{formatCurrency(totalFerramentas)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-destructive/10 rounded border border-destructive/20 mt-2">
              <span className="font-medium">Total Gastos</span>
              <span className="font-bold text-destructive">{formatCurrency(gastosTotal)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Resultado Final */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Resultado do Mes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center p-2 bg-accent/30 rounded">
              <span className="text-sm">Faturamento</span>
              <span className="font-semibold text-sm text-primary">{formatCurrency(faturamentoTotal)}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-accent/30 rounded">
              <span className="text-sm">(-) Gastos</span>
              <span className="font-semibold text-sm text-destructive">{formatCurrency(gastosTotal)}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-accent/30 rounded">
              <span className="text-sm">(-) Lucro Parceiros</span>
              <span className="font-semibold text-sm text-warning">{formatCurrency(lucroParceiros)}</span>
            </div>
            <div className={`flex justify-between items-center p-4 rounded border mt-4 ${lucroLiquido >= 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
              <span className="font-bold">Lucro Liquido</span>
              <span className={`font-bold text-xl ${lucroLiquido >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {formatCurrency(lucroLiquido)}
              </span>
            </div>
            <div className="text-center text-xs text-muted-foreground mt-2">
              {lucroLiquido >= 0 ? 'Voce esta no positivo!' : 'Atencao: resultado negativo'}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
