"use client"

import { createContext, useContext, useState, useCallback, useTransition, type ReactNode } from 'react'
import type { Gasto, TrafegoPago, Parceiro, VendaParceiro, Criativo } from './types'
import * as actions from '@/app/actions/data-actions'

// Tipo para analise de clientes
interface AnaliseCliente {
  id: string
  data: string
  quantidadeCompras: number
  tipo: 'novo' | 'antigo'
  valorTotal: number
}

interface CloudDataContextType {
  gastos: Gasto[]
  trafego: TrafegoPago[]
  parceiros: Parceiro[]
  vendasParceiros: VendaParceiro[]
  criativos: Criativo[]
  analiseClientes: AnaliseCliente[]
  mesAtual: number
  anoAtual: number
  isSaving: boolean
  workspaceId: string
  addGasto: (gasto: Omit<Gasto, 'id'>) => Promise<void>
  updateGasto: (id: string, gasto: Omit<Gasto, 'id'>) => Promise<void>
  deleteGasto: (id: string) => Promise<void>
  addTrafego: (trafego: Omit<TrafegoPago, 'id' | 'custoConversa'>) => Promise<void>
  updateTrafego: (id: string, trafego: Omit<TrafegoPago, 'id' | 'custoConversa'>) => Promise<void>
  deleteTrafego: (id: string) => Promise<void>
  addParceiro: (parceiro: Omit<Parceiro, 'id'>) => Promise<void>
  updateParceiro: (id: string, parceiro: Omit<Parceiro, 'id'>) => Promise<void>
  deleteParceiro: (id: string) => Promise<void>
  addVendaParceiro: (venda: Omit<VendaParceiro, 'id' | 'valorPagar'>) => Promise<void>
  updateVendaParceiro: (id: string, venda: Omit<VendaParceiro, 'id' | 'valorPagar'>) => Promise<void>
  deleteVendaParceiro: (id: string) => Promise<void>
  addCriativo: (criativo: Omit<Criativo, 'id' | 'taxaConversao'>) => Promise<void>
  updateCriativo: (id: string, criativo: Omit<Criativo, 'id' | 'taxaConversao'>) => Promise<void>
  deleteCriativo: (id: string) => Promise<void>
  addAnaliseCliente: (cliente: Omit<AnaliseCliente, 'id'>) => Promise<void>
  updateAnaliseCliente: (id: string, cliente: Omit<AnaliseCliente, 'id'>) => Promise<void>
  deleteAnaliseCliente: (id: string) => Promise<void>
  getTotalGastos: (mes?: number, ano?: number) => number
  getTotalTrafego: (mes?: number, ano?: number) => number
  getTotalVendasTrafego: (mes?: number, ano?: number) => number
}

const CloudDataContext = createContext<CloudDataContextType | undefined>(undefined)

function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

interface CloudDataProviderProps {
  children: ReactNode
  workspaceId: string
  initialData: {
    gastos: any[]
    trafego: any[]
    parceiros: any[]
    vendasParceiros: any[]
    criativos: any[]
    analiseClientes: any[]
  }
}

export function CloudDataProvider({ children, workspaceId, initialData }: CloudDataProviderProps) {
  const [isPending, startTransition] = useTransition()
  
  // Transformar dados iniciais para o formato esperado
  const [gastos, setGastos] = useState<Gasto[]>(
    initialData.gastos.map(g => ({
      id: g.id,
      descricao: g.descricao,
      valor: Number(g.valor),
      categoria: g.categoria,
      data: g.data,
      fixo: g.fixo || false,
    }))
  )
  
  const [trafego, setTrafego] = useState<TrafegoPago[]>(
    initialData.trafego.map(t => ({
      id: t.id,
      data: t.data,
      plataforma: t.plataforma,
      valorInvestido: Number(t.valorInvestido),
      conversas: t.conversas || 0,
      vendas: t.vendas || 0,
      faturamento: Number(t.faturamento),
      custoConversa: t.conversas > 0 ? Number(t.valorInvestido) / t.conversas : 0,
    }))
  )
  
  const [parceiros, setParceiros] = useState<Parceiro[]>(
    initialData.parceiros.map(p => ({
      id: p.id,
      nome: p.nome,
      porcentagem: Number(p.porcentagem),
    }))
  )
  
  const [vendasParceiros, setVendasParceiros] = useState<VendaParceiro[]>(
    initialData.vendasParceiros.map(v => ({
      id: v.id,
      parceiroId: v.parceiroId,
      data: v.data,
      mensagens: 0,
      vendas: 1,
      valorTotal: Number(v.valorTotal),
      valorPagar: Number(v.valorPagar),
      status: 'pendente' as const,
    }))
  )
  
  const [criativos, setCriativos] = useState<Criativo[]>(
    initialData.criativos.map(c => ({
      id: c.id,
      nome: c.nome,
      data: c.data,
      plataforma: 'instagram' as const,
      pessoasAlcancadas: c.alcance || 0,
      conversoes: c.conversoes || 0,
      taxaConversao: c.alcance > 0 ? (c.conversoes / c.alcance) * 100 : 0,
    }))
  )
  
  const [analiseClientes, setAnaliseClientes] = useState<AnaliseCliente[]>(
    initialData.analiseClientes.map(a => ({
      id: a.id,
      data: a.data,
      quantidadeCompras: a.quantidadeCompras || 0,
      tipo: a.tipo as 'novo' | 'antigo',
      valorTotal: Number(a.valorTotal),
    }))
  )

  const now = new Date()
  const mesAtual = now.getMonth() + 1
  const anoAtual = now.getFullYear()

  // ==================== GASTOS ====================
  
  const addGasto = useCallback(async (gasto: Omit<Gasto, 'id'>) => {
    const id = generateId()
    const newGasto = { ...gasto, id }
    setGastos(prev => [...prev, newGasto])
    
    startTransition(async () => {
      await actions.addGasto(workspaceId, {
        descricao: gasto.descricao,
        valor: gasto.valor,
        categoria: gasto.categoria,
        data: gasto.data,
        fixo: gasto.fixo,
      })
    })
  }, [workspaceId])

  const updateGasto = useCallback(async (id: string, gasto: Omit<Gasto, 'id'>) => {
    setGastos(prev => prev.map(g => g.id === id ? { ...gasto, id } : g))
    
    startTransition(async () => {
      await actions.updateGasto(workspaceId, id, {
        descricao: gasto.descricao,
        valor: gasto.valor,
        categoria: gasto.categoria,
        data: gasto.data,
        fixo: gasto.fixo,
      })
    })
  }, [workspaceId])

  const deleteGasto = useCallback(async (id: string) => {
    setGastos(prev => prev.filter(g => g.id !== id))
    
    startTransition(async () => {
      await actions.deleteGasto(workspaceId, id)
    })
  }, [workspaceId])

  // ==================== TRAFEGO ====================
  
  const addTrafego = useCallback(async (t: Omit<TrafegoPago, 'id' | 'custoConversa'>) => {
    const id = generateId()
    const custoConversa = t.conversas > 0 ? t.valorInvestido / t.conversas : 0
    const newTrafego = { ...t, custoConversa, id }
    setTrafego(prev => [...prev, newTrafego])
    
    startTransition(async () => {
      await actions.addTrafego(workspaceId, {
        data: t.data,
        plataforma: t.plataforma,
        valorInvestido: t.valorInvestido,
        conversas: t.conversas,
        vendas: t.vendas,
        faturamento: t.faturamento,
      })
    })
  }, [workspaceId])

  const updateTrafego = useCallback(async (id: string, t: Omit<TrafegoPago, 'id' | 'custoConversa'>) => {
    const custoConversa = t.conversas > 0 ? t.valorInvestido / t.conversas : 0
    setTrafego(prev => prev.map(tr => tr.id === id ? { ...t, custoConversa, id } : tr))
    
    startTransition(async () => {
      await actions.updateTrafego(workspaceId, id, {
        data: t.data,
        plataforma: t.plataforma,
        valorInvestido: t.valorInvestido,
        conversas: t.conversas,
        vendas: t.vendas,
        faturamento: t.faturamento,
      })
    })
  }, [workspaceId])

  const deleteTrafego = useCallback(async (id: string) => {
    setTrafego(prev => prev.filter(t => t.id !== id))
    
    startTransition(async () => {
      await actions.deleteTrafego(workspaceId, id)
    })
  }, [workspaceId])

  // ==================== PARCEIROS ====================
  
  const addParceiro = useCallback(async (parceiro: Omit<Parceiro, 'id'>) => {
    const id = generateId()
    const newParceiro = { ...parceiro, id }
    setParceiros(prev => [...prev, newParceiro])
    
    startTransition(async () => {
      await actions.addParceiro(workspaceId, {
        nome: parceiro.nome,
        porcentagem: parceiro.porcentagem,
      })
    })
  }, [workspaceId])

  const updateParceiro = useCallback(async (id: string, parceiro: Omit<Parceiro, 'id'>) => {
    setParceiros(prev => prev.map(p => p.id === id ? { ...parceiro, id } : p))
    
    startTransition(async () => {
      await actions.updateParceiro(workspaceId, id, {
        nome: parceiro.nome,
        porcentagem: parceiro.porcentagem,
      })
    })
  }, [workspaceId])

  const deleteParceiro = useCallback(async (id: string) => {
    setParceiros(prev => prev.filter(p => p.id !== id))
    setVendasParceiros(prev => prev.filter(v => v.parceiroId !== id))
    
    startTransition(async () => {
      await actions.deleteParceiro(workspaceId, id)
    })
  }, [workspaceId])

  // ==================== VENDAS PARCEIROS ====================
  
  const addVendaParceiro = useCallback(async (venda: Omit<VendaParceiro, 'id' | 'valorPagar'>) => {
    const parceiro = parceiros.find(p => p.id === venda.parceiroId)
    const valorPagar = parceiro ? venda.valorTotal * (parceiro.porcentagem / 100) : 0
    const id = generateId()
    const newVenda = { ...venda, valorPagar, id }
    setVendasParceiros(prev => [...prev, newVenda])
    
    startTransition(async () => {
      await actions.addVendaParceiro(workspaceId, {
        parceiroId: venda.parceiroId,
        data: venda.data,
        valorTotal: venda.valorTotal,
        valorPagar,
      })
    })
  }, [workspaceId, parceiros])

  const updateVendaParceiro = useCallback(async (id: string, venda: Omit<VendaParceiro, 'id' | 'valorPagar'>) => {
    const parceiro = parceiros.find(p => p.id === venda.parceiroId)
    const valorPagar = parceiro ? venda.valorTotal * (parceiro.porcentagem / 100) : 0
    setVendasParceiros(prev => prev.map(v => v.id === id ? { ...venda, valorPagar, id } : v))
    
    startTransition(async () => {
      await actions.updateVendaParceiro(workspaceId, id, {
        parceiroId: venda.parceiroId,
        data: venda.data,
        valorTotal: venda.valorTotal,
        valorPagar,
      })
    })
  }, [workspaceId, parceiros])

  const deleteVendaParceiro = useCallback(async (id: string) => {
    setVendasParceiros(prev => prev.filter(v => v.id !== id))
    
    startTransition(async () => {
      await actions.deleteVendaParceiro(workspaceId, id)
    })
  }, [workspaceId])

  // ==================== CRIATIVOS ====================
  
  const addCriativo = useCallback(async (criativo: Omit<Criativo, 'id' | 'taxaConversao'>) => {
    const taxaConversao = criativo.pessoasAlcancadas > 0 
      ? (criativo.conversoes / criativo.pessoasAlcancadas) * 100 
      : 0
    const id = generateId()
    const newCriativo = { ...criativo, taxaConversao, id }
    setCriativos(prev => [...prev, newCriativo])
    
    startTransition(async () => {
      await actions.addCriativo(workspaceId, {
        nome: criativo.nome,
        data: criativo.data,
        alcance: criativo.pessoasAlcancadas,
        conversoes: criativo.conversoes,
      })
    })
  }, [workspaceId])

  const updateCriativo = useCallback(async (id: string, criativo: Omit<Criativo, 'id' | 'taxaConversao'>) => {
    const taxaConversao = criativo.pessoasAlcancadas > 0 
      ? (criativo.conversoes / criativo.pessoasAlcancadas) * 100 
      : 0
    setCriativos(prev => prev.map(c => c.id === id ? { ...criativo, taxaConversao, id } : c))
    
    startTransition(async () => {
      await actions.updateCriativo(workspaceId, id, {
        nome: criativo.nome,
        data: criativo.data,
        alcance: criativo.pessoasAlcancadas,
        conversoes: criativo.conversoes,
      })
    })
  }, [workspaceId])

  const deleteCriativo = useCallback(async (id: string) => {
    setCriativos(prev => prev.filter(c => c.id !== id))
    
    startTransition(async () => {
      await actions.deleteCriativo(workspaceId, id)
    })
  }, [workspaceId])

  // ==================== ANALISE CLIENTES ====================
  
  const addAnaliseCliente = useCallback(async (cliente: Omit<AnaliseCliente, 'id'>) => {
    const id = generateId()
    const newCliente = { ...cliente, id }
    setAnaliseClientes(prev => [...prev, newCliente])
    
    startTransition(async () => {
      await actions.addAnaliseCliente(workspaceId, cliente)
    })
  }, [workspaceId])

  const updateAnaliseCliente = useCallback(async (id: string, cliente: Omit<AnaliseCliente, 'id'>) => {
    setAnaliseClientes(prev => prev.map(c => c.id === id ? { ...cliente, id } : c))
    
    startTransition(async () => {
      await actions.updateAnaliseCliente(workspaceId, id, cliente)
    })
  }, [workspaceId])

  const deleteAnaliseCliente = useCallback(async (id: string) => {
    setAnaliseClientes(prev => prev.filter(c => c.id !== id))
    
    startTransition(async () => {
      await actions.deleteAnaliseCliente(workspaceId, id)
    })
  }, [workspaceId])

  // ==================== HELPERS ====================

  const getDateParts = (dateString: string) => {
    const [year, month] = dateString.split('-').map(Number)
    return { year, month }
  }

  const filterByDate = <T extends { data: string }>(items: T[], mes?: number, ano?: number) => {
    if (!mes && !ano) return items
    return items.filter(item => {
      const { year, month } = getDateParts(item.data)
      const matchMonth = mes ? month === mes : true
      const matchYear = ano ? year === ano : true
      return matchMonth && matchYear
    })
  }

  const getTotalGastos = (mes?: number, ano?: number) => {
    return filterByDate(gastos, mes, ano).reduce((sum, g) => sum + g.valor, 0)
  }

  const getTotalTrafego = (mes?: number, ano?: number) => {
    return filterByDate(trafego, mes, ano).reduce((sum, t) => sum + t.valorInvestido, 0)
  }

  const getTotalVendasTrafego = (mes?: number, ano?: number) => {
    return filterByDate(trafego, mes, ano).reduce((sum, t) => sum + t.faturamento, 0)
  }

  return (
    <CloudDataContext.Provider value={{
      gastos,
      trafego,
      parceiros,
      vendasParceiros,
      criativos,
      analiseClientes,
      mesAtual,
      anoAtual,
      isSaving: isPending,
      workspaceId,
      addGasto,
      updateGasto,
      deleteGasto,
      addTrafego,
      updateTrafego,
      deleteTrafego,
      addParceiro,
      updateParceiro,
      deleteParceiro,
      addVendaParceiro,
      updateVendaParceiro,
      deleteVendaParceiro,
      addCriativo,
      updateCriativo,
      deleteCriativo,
      addAnaliseCliente,
      updateAnaliseCliente,
      deleteAnaliseCliente,
      getTotalGastos,
      getTotalTrafego,
      getTotalVendasTrafego,
    }}>
      {children}
    </CloudDataContext.Provider>
  )
}

export function useData() {
  const context = useContext(CloudDataContext)
  if (!context) {
    throw new Error('useData must be used within a CloudDataProvider')
  }
  return context
}
