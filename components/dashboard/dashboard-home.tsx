"use client"

import { useData } from '@/lib/cloud-data-context'
import { StatsCard } from './stats-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DollarSign, TrendingUp, TrendingDown, Users, Megaphone, UserPlus, UserCheck, Calendar } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { categoriasGasto } from '@/lib/types'

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

const mesesNomes = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

export function DashboardHome() {
  const { 
    gastos, 
    trafego,
    vendasParceiros,
    analiseClientes,
    getTotalGastos, 
    getTotalTrafego,
    getTotalVendasTrafego,
    mesSelecionado,
    anoSelecionado,
    setMesSelecionado,
    setAnoSelecionado,
    anoAtual,
  } = useData()

  // Usar mes/ano selecionado
  const currentMonth = mesSelecionado
  const currentYear = anoSelecionado

  // Filtrar clientes do mes atual (do contexto cloud)
  const clientesMesAtual = analiseClientes.filter(c => {
    const { year, month } = getDateParts(c.data)
    return month === currentMonth && year === currentYear
  })

  // Calculos de clientes
  const clientesNovos = clientesMesAtual.filter(c => c.tipo === 'novo')
  const clientesAntigos = clientesMesAtual.filter(c => c.tipo === 'antigo')
  const vendasNovos = clientesNovos.reduce((sum, c) => sum + c.quantidadeCompras, 0)
  const vendasAntigos = clientesAntigos.reduce((sum, c) => sum + c.quantidadeCompras, 0)
  const totalVendasClientes = vendasNovos + vendasAntigos
  const valorClientesNovos = clientesNovos.reduce((sum, c) => sum + c.valorTotal, 0)
  const valorClientesAntigos = clientesAntigos.reduce((sum, c) => sum + c.valorTotal, 0)

  // Calculos automaticos baseados em todos os dados
  const totalVendasTrafego = getTotalVendasTrafego(currentMonth, currentYear)
  
  // Faturamento total = Vendas Trafego
  const faturamentoTotal = totalVendasTrafego
  
  // Gastos totais incluindo trafego pago
  const totalGastos = getTotalGastos(currentMonth, currentYear)
  const totalTrafego = getTotalTrafego(currentMonth, currentYear)
  // Soma total de todos os gastos do mes (gastos operacionais + investimento em trafego)
  const gastosTotal = totalGastos + totalTrafego
  
  // Calculo de comissao dos parceiros - APENAS sobre vendas que eles fizeram
  // Filtrar vendas do mes atual
  const vendasParceirosMes = vendasParceiros.filter(v => {
    const { year, month } = getDateParts(v.data)
    return month === currentMonth && year === currentYear
  })
  // Total de comissoes a pagar = soma do valorPagar de cada venda
  const totalComissoesParceiros = vendasParceirosMes.reduce((sum, v) => sum + v.valorPagar, 0)
  // Vendas realizadas por parceiros (para mostrar separado)
  const totalVendasParceiros = vendasParceirosMes.reduce((sum, v) => sum + v.valorTotal, 0)
  
  // LUCRO REAL:
  // Lucro = Faturamento - Custos Operacionais - Investimento em Trafego
  const lucroLiquido = faturamentoTotal - gastosTotal
  
  // Lucro das vendas dos parceiros: a parte que fica com voce apos pagar a comissao deles.
  // A comissao NAO e um custo do seu negocio, e apenas a divisao do lucro das vendas DELES.
  const lucroParceiros = totalVendasParceiros - totalComissoesParceiros
  
  // Seu lucro final = seu lucro proprio + sua parte do lucro das vendas dos parceiros.
  // A comissao nunca reduz o seu lucro proprio (nunca gera prejuizo ficticio).
  const seuLucroReal = lucroLiquido + lucroParceiros
  
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
      
      // Gastos do mes (da aba gastos)
      const gastosMes = gastos
        .filter(g => {
          const { year, month } = getDateParts(g.data)
          return month === mes && year === currentYear
        })
        .reduce((sum, g) => sum + g.valor, 0)
      
      // Investimento em trafego do mes
      const trafegoMes = trafego
        .filter(t => {
          const { year, month } = getDateParts(t.data)
          return month === mes && year === currentYear
        })
        .reduce((sum, t) => sum + t.valorInvestido, 0)
      
      // Total de gastos do mes = gastos operacionais + trafego (apenas gastos reais)
      // Comissao de parceiro NAO e gasto, e divisao de lucro
      const gastosTotalMes = gastosMes + trafegoMes
      
      return {
        name: month,
        faturamento: faturamentoMes,
        gastos: gastosTotalMes,
        lucro: faturamentoMes - gastosTotalMes,
      }
    })
  }

  // Dados para grafico de gastos por categoria
  const getGastosPorCategoria = () => {
    const gastosMes = gastos.filter(g => {
      const { year, month } = getDateParts(g.data)
      return month === currentMonth && year === currentYear
    })

    const categoriasDados = categoriasGasto.map(cat => ({
      name: cat.label,
      value: gastosMes.filter(g => g.categoria === cat.value).reduce((sum, g) => sum + g.valor, 0),
    }))
    
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
      {/* Header com Seletor de Mes */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Visao geral do seu negocio</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select 
            value={`${currentMonth}-${currentYear}`} 
            onValueChange={(v) => {
              const [mes, ano] = v.split('-').map(Number)
              setMesSelecionado(mes)
              setAnoSelecionado(ano)
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {/* Gerar opcoes para os ultimos 12 meses */}
              {Array.from({ length: 12 }, (_, i) => {
                const date = new Date(anoAtual, new Date().getMonth() - i, 1)
                const mes = date.getMonth() + 1
                const ano = date.getFullYear()
                return (
                  <SelectItem key={`${mes}-${ano}`} value={`${mes}-${ano}`}>
                    {mesesNomes[mes - 1]} {ano}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Faturamento Total"
          value={formatCurrency(faturamentoTotal)}
          subtitle="Vendas do trafego pago"
          icon={DollarSign}
          variant="default"
        />
        <StatsCard
          title="Custos Totais"
          value={formatCurrency(gastosTotal)}
          subtitle={`Operacionais: ${formatCurrency(totalGastos)} | Trafego: ${formatCurrency(totalTrafego)}`}
          icon={TrendingDown}
          variant="danger"
        />
        <StatsCard
          title="Lucro Liquido"
          value={formatCurrency(lucroLiquido)}
          subtitle="Faturamento - Custos"
          icon={TrendingUp}
          variant={lucroLiquido >= 0 ? 'success' : 'danger'}
        />
      </div>

      {/* Segunda linha de stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Trafego Pago"
          value={formatCurrency(totalTrafego)}
          subtitle={`${totalVendasTrafegoCount} vendas | ${totalConversas} conversas`}
          icon={Megaphone}
          variant="warning"
        />
        <StatsCard
          title="ROI Trafego"
          value={totalTrafego > 0 ? `${(totalVendasTrafego / totalTrafego).toFixed(2)}x` : '0.00x'}
          subtitle={`Investido: ${formatCurrency(totalTrafego)} | Retorno: ${formatCurrency(totalVendasTrafego)}`}
          icon={TrendingUp}
          variant={totalVendasTrafego > totalTrafego ? 'success' : 'danger'}
        />
        <StatsCard
          title="Comissao Parceiros"
          value={formatCurrency(totalComissoesParceiros)}
          subtitle={totalVendasParceiros > 0 ? `De ${formatCurrency(totalVendasParceiros)} em vendas deles` : 'Nenhuma venda de parceiro'}
          icon={Users}
          variant="warning"
        />
        <StatsCard
          title="Seu Lucro Final"
          value={formatCurrency(seuLucroReal)}
          subtitle="Lucro + sua parte das vendas dos parceiros"
          icon={DollarSign}
          variant={seuLucroReal >= 0 ? 'success' : 'danger'}
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
                      {totalTrafego > 0 ? `${(totalVendasTrafego / totalTrafego).toFixed(2)}x` : '0.00x'}
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
      {totalVendasClientes > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-blue-500/30 bg-blue-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <UserPlus className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Vendas Novos</p>
                  <p className="text-xl font-bold">{vendasNovos}</p>
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {formatCurrency(valorClientesNovos)} em receita
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
                  <p className="text-xs text-muted-foreground">Vendas Antigos</p>
                  <p className="text-xl font-bold">{vendasAntigos}</p>
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {formatCurrency(valorClientesAntigos)} em receita
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
                  <p className="text-xs text-muted-foreground">Total Vendas</p>
                  <p className="text-xl font-bold">{totalVendasClientes}</p>
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Novos + Antigos
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
                  <p className="text-xs text-muted-foreground">Receita Total</p>
                  <p className="text-xl font-bold">{formatCurrency(valorClientesNovos + valorClientesAntigos)}</p>
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {totalVendasClientes > 0 ? formatCurrency((valorClientesNovos + valorClientesAntigos) / totalVendasClientes) : 'R$ 0'} ticket medio
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
              <span className="text-sm">(-) Custos (Operacional + Trafego)</span>
              <span className="font-semibold text-sm text-destructive">{formatCurrency(gastosTotal)}</span>
            </div>
            <div className={`flex justify-between items-center p-3 rounded border ${lucroLiquido >= 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
              <span className="font-medium">= Lucro</span>
              <span className={`font-bold ${lucroLiquido >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {formatCurrency(lucroLiquido)}
              </span>
            </div>
            {totalComissoesParceiros > 0 && (
              <>
                <div className="flex justify-between items-center p-2 bg-orange-500/10 rounded">
                  <span className="text-sm">(-) Comissao Parceiros</span>
                  <span className="font-semibold text-sm text-orange-600">{formatCurrency(totalComissoesParceiros)}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  *Comissao sobre {formatCurrency(totalVendasParceiros)} em vendas realizadas por parceiros
                </p>
              </>
            )}
            <div className={`flex justify-between items-center p-4 rounded border mt-4 ${seuLucroReal >= 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
              <span className="font-bold">Seu Lucro Final</span>
              <span className={`font-bold text-xl ${seuLucroReal >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {formatCurrency(seuLucroReal)}
              </span>
            </div>
            <div className="text-center text-xs text-muted-foreground mt-2">
              {seuLucroReal >= 0 ? 'Voce esta no positivo!' : 'Atencao: resultado negativo'}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
