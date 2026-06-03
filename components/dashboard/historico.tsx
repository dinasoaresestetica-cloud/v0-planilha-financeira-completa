"use client"

import { useState } from 'react'
import { useData } from '@/lib/cloud-data-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TrendingUp, TrendingDown, DollarSign, Megaphone, Users, Calendar } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function getDateParts(dateString: string) {
  const [year, month] = dateString.split('-').map(Number)
  return { year, month }
}

const mesesNomes = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

export function Historico() {
  const { gastos, trafego, vendasParceiros, anoAtual } = useData()
  const [selectedYear, setSelectedYear] = useState(anoAtual.toString())

  // Gerar lista de anos disponiveis baseado nos dados
  const getAvailableYears = () => {
    const years = new Set<number>()
    years.add(anoAtual)
    
    gastos.forEach(g => {
      const { year } = getDateParts(g.data)
      years.add(year)
    })
    trafego.forEach(t => {
      const { year } = getDateParts(t.data)
      years.add(year)
    })
    
    return Array.from(years).sort((a, b) => b - a)
  }

  // Calcular dados por mes
  const getMonthlyData = () => {
    const year = parseInt(selectedYear)
    
    return mesesNomes.map((mesNome, index) => {
      const mes = index + 1
      
      // Faturamento do mes (vendas do trafego)
      const faturamentoMes = trafego
        .filter(t => {
          const { year: y, month } = getDateParts(t.data)
          return month === mes && y === year
        })
        .reduce((sum, t) => sum + t.faturamento, 0)
      
      // Investimento em trafego do mes
      const investimentoTrafegoMes = trafego
        .filter(t => {
          const { year: y, month } = getDateParts(t.data)
          return month === mes && y === year
        })
        .reduce((sum, t) => sum + t.valorInvestido, 0)
      
      // Gastos operacionais do mes (ferramentas/programas)
      const gastosOperacionaisMes = gastos
        .filter(g => {
          const { year: y, month } = getDateParts(g.data)
          return month === mes && y === year
        })
        .reduce((sum, g) => sum + g.valor, 0)
      
      // Comissao de parceiros do mes
      const comissaoParceirosMes = vendasParceiros
        .filter(v => {
          const { year: y, month } = getDateParts(v.data)
          return month === mes && y === year
        })
        .reduce((sum, v) => sum + v.valorPagar, 0)
      
      // Custos totais = trafego + operacional
      const custosTotais = investimentoTrafegoMes + gastosOperacionaisMes
      
      // Lucro = faturamento - custos
      const lucro = faturamentoMes - custosTotais
      
      // Seu lucro = lucro - comissao parceiros
      const seuLucro = lucro - comissaoParceirosMes
      
      // ROI do trafego
      const roiTrafego = investimentoTrafegoMes > 0 
        ? ((faturamentoMes - investimentoTrafegoMes) / investimentoTrafegoMes) * 100 
        : 0
      
      // Conversas e vendas do mes
      const conversasMes = trafego
        .filter(t => {
          const { year: y, month } = getDateParts(t.data)
          return month === mes && y === year
        })
        .reduce((sum, t) => sum + t.conversas, 0)
      
      const vendasMes = trafego
        .filter(t => {
          const { year: y, month } = getDateParts(t.data)
          return month === mes && y === year
        })
        .reduce((sum, t) => sum + t.vendas, 0)
      
      return {
        mes: mesNome.substring(0, 3),
        mesCompleto: mesNome,
        faturamento: faturamentoMes,
        custos: custosTotais,
        trafego: investimentoTrafegoMes,
        operacional: gastosOperacionaisMes,
        comissao: comissaoParceirosMes,
        lucro,
        seuLucro,
        roi: roiTrafego,
        conversas: conversasMes,
        vendas: vendasMes,
      }
    })
  }

  const monthlyData = getMonthlyData()
  
  // Totais do ano
  const totaisAno = {
    faturamento: monthlyData.reduce((sum, m) => sum + m.faturamento, 0),
    custos: monthlyData.reduce((sum, m) => sum + m.custos, 0),
    trafego: monthlyData.reduce((sum, m) => sum + m.trafego, 0),
    operacional: monthlyData.reduce((sum, m) => sum + m.operacional, 0),
    comissao: monthlyData.reduce((sum, m) => sum + m.comissao, 0),
    lucro: monthlyData.reduce((sum, m) => sum + m.lucro, 0),
    seuLucro: monthlyData.reduce((sum, m) => sum + m.seuLucro, 0),
    conversas: monthlyData.reduce((sum, m) => sum + m.conversas, 0),
    vendas: monthlyData.reduce((sum, m) => sum + m.vendas, 0),
  }
  
  const roiAnual = totaisAno.trafego > 0 
    ? ((totaisAno.faturamento - totaisAno.trafego) / totaisAno.trafego) * 100 
    : 0

  const hasData = monthlyData.some(m => m.faturamento > 0 || m.custos > 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Historico e Comparativo</h1>
          <p className="text-muted-foreground mt-1">Analise o desempenho ao longo dos meses</p>
        </div>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[140px]">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {getAvailableYears().map(year => (
              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Cards de Totais do Ano */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Faturamento {selectedYear}</p>
                <p className="text-lg font-bold">{formatCurrency(totaisAno.faturamento)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Custos {selectedYear}</p>
                <p className="text-lg font-bold">{formatCurrency(totaisAno.custos)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${totaisAno.seuLucro >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'} flex items-center justify-center`}>
                <TrendingUp className={`h-5 w-5 ${totaisAno.seuLucro >= 0 ? 'text-green-500' : 'text-red-500'}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Seu Lucro {selectedYear}</p>
                <p className={`text-lg font-bold ${totaisAno.seuLucro >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {formatCurrency(totaisAno.seuLucro)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${roiAnual >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'} flex items-center justify-center`}>
                <Megaphone className={`h-5 w-5 ${roiAnual >= 0 ? 'text-green-500' : 'text-red-500'}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">ROI Trafego {selectedYear}</p>
                <p className={`text-lg font-bold ${roiAnual >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {roiAnual.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {hasData ? (
        <>
          {/* Graficos */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Faturamento vs Custos por Mes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Faturamento vs Custos por Mes</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="mes" className="text-xs" />
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
                    <Bar dataKey="faturamento" name="Faturamento" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="custos" name="Custos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Evolucao do Lucro */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Evolucao do Lucro</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="mes" className="text-xs" />
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
                    <Line type="monotone" dataKey="lucro" name="Lucro Bruto" stroke="#3b82f6" strokeWidth={2} />
                    <Line type="monotone" dataKey="seuLucro" name="Seu Lucro" stroke="#22c55e" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Tabela Detalhada */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detalhamento Mensal</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium">Mes</th>
                    <th className="text-right py-3 px-2 font-medium">Faturamento</th>
                    <th className="text-right py-3 px-2 font-medium">Trafego</th>
                    <th className="text-right py-3 px-2 font-medium">Operacional</th>
                    <th className="text-right py-3 px-2 font-medium">Comissao</th>
                    <th className="text-right py-3 px-2 font-medium">Lucro</th>
                    <th className="text-right py-3 px-2 font-medium">Seu Lucro</th>
                    <th className="text-right py-3 px-2 font-medium">ROI</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map((m, i) => (
                    <tr key={i} className={`border-b ${m.faturamento === 0 && m.custos === 0 ? 'opacity-40' : ''}`}>
                      <td className="py-3 px-2 font-medium">{m.mesCompleto}</td>
                      <td className="text-right py-3 px-2 text-blue-600">{formatCurrency(m.faturamento)}</td>
                      <td className="text-right py-3 px-2 text-orange-500">{formatCurrency(m.trafego)}</td>
                      <td className="text-right py-3 px-2 text-red-500">{formatCurrency(m.operacional)}</td>
                      <td className="text-right py-3 px-2 text-purple-500">{formatCurrency(m.comissao)}</td>
                      <td className={`text-right py-3 px-2 font-medium ${m.lucro >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {formatCurrency(m.lucro)}
                      </td>
                      <td className={`text-right py-3 px-2 font-bold ${m.seuLucro >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {formatCurrency(m.seuLucro)}
                      </td>
                      <td className={`text-right py-3 px-2 ${m.roi >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {m.roi.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                  {/* Linha de Totais */}
                  <tr className="bg-muted/50 font-bold">
                    <td className="py-3 px-2">TOTAL</td>
                    <td className="text-right py-3 px-2 text-blue-600">{formatCurrency(totaisAno.faturamento)}</td>
                    <td className="text-right py-3 px-2 text-orange-500">{formatCurrency(totaisAno.trafego)}</td>
                    <td className="text-right py-3 px-2 text-red-500">{formatCurrency(totaisAno.operacional)}</td>
                    <td className="text-right py-3 px-2 text-purple-500">{formatCurrency(totaisAno.comissao)}</td>
                    <td className={`text-right py-3 px-2 ${totaisAno.lucro >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {formatCurrency(totaisAno.lucro)}
                    </td>
                    <td className={`text-right py-3 px-2 ${totaisAno.seuLucro >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {formatCurrency(totaisAno.seuLucro)}
                    </td>
                    <td className={`text-right py-3 px-2 ${roiAnual >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {roiAnual.toFixed(1)}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Calendar className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum dado em {selectedYear}</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Adicione dados de faturamento, gastos ou trafego para visualizar o historico.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
