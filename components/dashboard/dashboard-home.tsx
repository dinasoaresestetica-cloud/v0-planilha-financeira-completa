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
    getTotalReceitas, 
    getTotalGastos, 
    getLucro,
    getTotalTrafego,
  } = useData()

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  const totalReceitas = getTotalReceitas(currentMonth, currentYear)
  const totalGastos = getTotalGastos(currentMonth, currentYear)
  const lucro = getLucro(currentMonth, currentYear)
  const totalTrafego = getTotalTrafego(currentMonth, currentYear)
  const clientesPagos = clientes.filter(c => c.status === 'pago').length

  // Dados para grafico de faturamento por mes
  const getMonthlyData = () => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    return months.map((month, index) => {
      const mes = index + 1
      const receitasMes = receitas
        .filter(r => {
          const date = new Date(r.data)
          return date.getMonth() + 1 === mes && date.getFullYear() === currentYear
        })
        .reduce((sum, r) => sum + r.valor, 0)
      const gastosMes = gastos
        .filter(g => {
          const date = new Date(g.data)
          return date.getMonth() + 1 === mes && date.getFullYear() === currentYear
        })
        .reduce((sum, g) => sum + g.valor, 0)
      
      return {
        name: month,
        receitas: receitasMes,
        gastos: gastosMes,
        lucro: receitasMes - gastosMes,
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Visao geral do seu negocio</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatsCard
          title="Faturamento"
          value={formatCurrency(totalReceitas)}
          subtitle="Este mes"
          icon={DollarSign}
          variant="default"
        />
        <StatsCard
          title="Gastos"
          value={formatCurrency(totalGastos)}
          subtitle="Este mes"
          icon={TrendingDown}
          variant="danger"
        />
        <StatsCard
          title="Lucro Liquido"
          value={formatCurrency(lucro)}
          subtitle="Este mes"
          icon={TrendingUp}
          variant={lucro >= 0 ? 'success' : 'danger'}
        />
        <StatsCard
          title="Trafego Pago"
          value={formatCurrency(totalTrafego)}
          subtitle="Investido"
          icon={Megaphone}
          variant="warning"
        />
        <StatsCard
          title="Clientes"
          value={clientes.length.toString()}
          subtitle={`${clientesPagos} pagos`}
          icon={Users}
          variant="default"
        />
        <StatsCard
          title="Conversao"
          value={clientes.length > 0 ? `${Math.round((clientesPagos / clientes.length) * 100)}%` : '0%'}
          subtitle="Taxa de pagamento"
          icon={ShoppingCart}
          variant="success"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Grafico de Faturamento x Gastos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Faturamento vs Gastos</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.some(d => d.receitas > 0 || d.gastos > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
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
                  <Bar dataKey="receitas" name="Receitas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="gastos" name="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
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
              <ResponsiveContainer width="100%" height={300}>
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
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
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
              <ResponsiveContainer width="100%" height={300}>
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
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <p>Nenhum gasto registrado este mes.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resumo de Trafego */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Resumo de Trafego Pago</CardTitle>
          </CardHeader>
          <CardContent>
            {trafego.length > 0 ? (
              <div className="space-y-4">
                {trafego.slice(0, 5).map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{t.plataforma}</p>
                      <p className="text-xs text-muted-foreground">{new Date(t.data).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">{formatCurrency(t.faturamento)}</p>
                      <p className="text-xs text-muted-foreground">Investido: {formatCurrency(t.valorInvestido)}</p>
                    </div>
                  </div>
                ))}
                {trafego.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">Nenhum registro de trafego</p>
                )}
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                <p>Nenhum dado de trafego registrado.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
