"use client"

import { useData } from '@/lib/data-context'
import { StatsCard } from './stats-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, TrendingUp, TrendingDown, Users, Megaphone, ShoppingCart } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { categoriasGasto } from '@/lib/types'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function DashboardHome() {
  const { 
    receitas, 
    gastos, 
    clientes,
    trafego,
    vendasParceiros,
    ferramentas,
    getTotalReceitas, 
    getTotalGastos, 
    getTotalTrafego,
    getTotalVendasTrafego,
  } = useData()

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  // Calculos automaticos baseados em todos os dados
  const totalReceitas = getTotalReceitas(currentMonth, currentYear)
  const totalVendasTrafego = getTotalVendasTrafego(currentMonth, currentYear)
  
  // Vendas dos parceiros do mes
  const vendasParceirosMes = vendasParceiros.filter(v => {
    const date = new Date(v.data)
    return date.getMonth() + 1 === currentMonth && date.getFullYear() === currentYear
  })
  const totalVendasParceiros = vendasParceirosMes.reduce((sum, v) => sum + v.valorTotal, 0)
  const totalRepasseParceiros = vendasParceirosMes.reduce((sum, v) => sum + v.valorPagar, 0)
  
  // Faturamento total = Receitas + Vendas Trafego + Vendas Parceiros (parte que fica)
  const faturamentoTotal = totalReceitas + totalVendasTrafego + (totalVendasParceiros - totalRepasseParceiros)
  
  // Gastos totais incluindo trafego pago e ferramentas
  const totalGastos = getTotalGastos(currentMonth, currentYear)
  const totalTrafego = getTotalTrafego(currentMonth, currentYear)
  const totalFerramentas = ferramentas.reduce((sum, f) => sum + f.valor, 0)
  const gastosTotal = totalGastos + totalTrafego + totalFerramentas + totalRepasseParceiros
  
  // Lucro liquido real (faturamento - todos os gastos)
  const lucroLiquido = faturamentoTotal - gastosTotal
  
  const clientesPagos = clientes.filter(c => c.status === 'pago').length
  const totalConversas = trafego.filter(t => {
    const date = new Date(t.data)
    return date.getMonth() + 1 === currentMonth && date.getFullYear() === currentYear
  }).reduce((sum, t) => sum + t.conversas, 0)
  const totalVendasTrafegoCount = trafego.filter(t => {
    const date = new Date(t.data)
    return date.getMonth() + 1 === currentMonth && date.getFullYear() === currentYear
  }).reduce((sum, t) => sum + t.vendas, 0)

  // Dados para grafico de faturamento por mes (inclui todas as fontes de receita)
  const getMonthlyData = () => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    return months.map((month, index) => {
      const mes = index + 1
      
      // Receitas diretas
      const receitasMes = receitas
        .filter(r => {
          const date = new Date(r.data)
          return date.getMonth() + 1 === mes && date.getFullYear() === currentYear
        })
        .reduce((sum, r) => sum + r.valor, 0)
      
      // Vendas do trafego pago
      const vendasTrafegoMes = trafego
        .filter(t => {
          const date = new Date(t.data)
          return date.getMonth() + 1 === mes && date.getFullYear() === currentYear
        })
        .reduce((sum, t) => sum + t.faturamento, 0)
      
      // Vendas dos parceiros (valor liquido)
      const vendasParcMes = vendasParceiros
        .filter(v => {
          const date = new Date(v.data)
          return date.getMonth() + 1 === mes && date.getFullYear() === currentYear
        })
      const totalVendasParcMes = vendasParcMes.reduce((sum, v) => sum + v.valorTotal, 0)
      const repasseParcMes = vendasParcMes.reduce((sum, v) => sum + v.valorPagar, 0)
      
      const faturamentoMes = receitasMes + vendasTrafegoMes + (totalVendasParcMes - repasseParcMes)
      
      // Gastos do mes
      const gastosMes = gastos
        .filter(g => {
          const date = new Date(g.data)
          return date.getMonth() + 1 === mes && date.getFullYear() === currentYear
        })
        .reduce((sum, g) => sum + g.valor, 0)
      
      // Investimento em trafego
      const trafegoMes = trafego
        .filter(t => {
          const date = new Date(t.data)
          return date.getMonth() + 1 === mes && date.getFullYear() === currentYear
        })
        .reduce((sum, t) => sum + t.valorInvestido, 0)
      
      const gastosTotal = gastosMes + trafegoMes + repasseParcMes
      
      return {
        name: month,
        faturamento: faturamentoMes,
        gastos: gastosTotal,
        lucro: faturamentoMes - gastosTotal,
      }
    })
  }

  // Dados para grafico de gastos por categoria
  const getGastosPorCategoria = () => {
    const gastosMes = gastos.filter(g => {
      const date = new Date(g.data)
      return date.getMonth() + 1 === currentMonth && date.getFullYear() === currentYear
    })

    return categoriasGasto.map(cat => ({
      name: cat.label,
      value: gastosMes.filter(g => g.categoria === cat.value).reduce((sum, g) => sum + g.valor, 0),
    })).filter(item => item.value > 0)
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
          title="Clientes"
          value={clientes.length.toString()}
          subtitle={`${clientesPagos} pagos | ${clientes.length - clientesPagos} pendentes`}
          icon={Users}
          variant="default"
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
                      <p className="text-xs text-muted-foreground">{new Date(t.data).toLocaleDateString('pt-BR')}</p>
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

      {/* Resumos Adicionais */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 xl:gap-8">
        {/* Resumo Receitas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Detalhamento Receitas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center p-2 bg-accent/30 rounded">
              <span className="text-sm">Receitas Diretas</span>
              <span className="font-semibold text-sm">{formatCurrency(totalReceitas)}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-accent/30 rounded">
              <span className="text-sm">Vendas Trafego</span>
              <span className="font-semibold text-sm">{formatCurrency(totalVendasTrafego)}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-accent/30 rounded">
              <span className="text-sm">Vendas Parceiros (liquido)</span>
              <span className="font-semibold text-sm">{formatCurrency(totalVendasParceiros - totalRepasseParceiros)}</span>
            </div>
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
            <div className="flex justify-between items-center p-2 bg-accent/30 rounded">
              <span className="text-sm">Repasse Parceiros</span>
              <span className="font-semibold text-sm">{formatCurrency(totalRepasseParceiros)}</span>
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
