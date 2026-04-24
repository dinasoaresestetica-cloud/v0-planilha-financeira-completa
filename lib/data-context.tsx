"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { Receita, Gasto, TrafegoPago, Parceiro, VendaParceiro, Cliente, Ferramenta } from './types'

interface DataContextType {
  receitas: Receita[]
  gastos: Gasto[]
  trafego: TrafegoPago[]
  parceiros: Parceiro[]
  vendasParceiros: VendaParceiro[]
  clientes: Cliente[]
  ferramentas: Ferramenta[]
  addReceita: (receita: Omit<Receita, 'id'>) => void
  updateReceita: (id: string, receita: Omit<Receita, 'id'>) => void
  deleteReceita: (id: string) => void
  addGasto: (gasto: Omit<Gasto, 'id'>) => void
  updateGasto: (id: string, gasto: Omit<Gasto, 'id'>) => void
  deleteGasto: (id: string) => void
  addTrafego: (trafego: Omit<TrafegoPago, 'id' | 'custoConversa'>) => void
  updateTrafego: (id: string, trafego: Omit<TrafegoPago, 'id' | 'custoConversa'>) => void
  deleteTrafego: (id: string) => void
  addParceiro: (parceiro: Omit<Parceiro, 'id'>) => void
  updateParceiro: (id: string, parceiro: Omit<Parceiro, 'id'>) => void
  deleteParceiro: (id: string) => void
  addVendaParceiro: (venda: Omit<VendaParceiro, 'id' | 'valorPagar'>) => void
  updateVendaParceiro: (id: string, venda: Omit<VendaParceiro, 'id' | 'valorPagar'>) => void
  deleteVendaParceiro: (id: string) => void
  addCliente: (cliente: Omit<Cliente, 'id'>) => void
  updateCliente: (id: string, cliente: Omit<Cliente, 'id'>) => void
  deleteCliente: (id: string) => void
  addFerramenta: (ferramenta: Omit<Ferramenta, 'id'>) => void
  updateFerramenta: (id: string, ferramenta: Omit<Ferramenta, 'id'>) => void
  deleteFerramenta: (id: string) => void
  getTotalReceitas: (mes?: number, ano?: number) => number
  getTotalGastos: (mes?: number, ano?: number) => number
  getLucro: (mes?: number, ano?: number) => number
  getTotalTrafego: (mes?: number, ano?: number) => number
  getTotalVendasTrafego: (mes?: number, ano?: number) => number
}

const DataContext = createContext<DataContextType | undefined>(undefined)

function generateId() {
  return Math.random().toString(36).substring(2, 15)
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [receitas, setReceitas] = useState<Receita[]>([])
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [trafego, setTrafego] = useState<TrafegoPago[]>([])
  const [parceiros, setParceiros] = useState<Parceiro[]>([])
  const [vendasParceiros, setVendasParceiros] = useState<VendaParceiro[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [ferramentas, setFerramentas] = useState<Ferramenta[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('financeiro-data')
    if (stored) {
      const data = JSON.parse(stored)
      setReceitas(data.receitas || [])
      setGastos(data.gastos || [])
      setTrafego(data.trafego || [])
      setParceiros(data.parceiros || [])
      setVendasParceiros(data.vendasParceiros || [])
      setClientes(data.clientes || [])
      setFerramentas(data.ferramentas || [])
    }
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('financeiro-data', JSON.stringify({
        receitas,
        gastos,
        trafego,
        parceiros,
        vendasParceiros,
        clientes,
        ferramentas,
      }))
    }
  }, [receitas, gastos, trafego, parceiros, vendasParceiros, clientes, ferramentas, isLoaded])

  const addReceita = (receita: Omit<Receita, 'id'>) => {
    setReceitas(prev => [...prev, { ...receita, id: generateId() }])
  }

  const updateReceita = (id: string, receita: Omit<Receita, 'id'>) => {
    setReceitas(prev => prev.map(r => r.id === id ? { ...receita, id } : r))
  }

  const deleteReceita = (id: string) => {
    setReceitas(prev => prev.filter(r => r.id !== id))
  }

  const addGasto = (gasto: Omit<Gasto, 'id'>) => {
    setGastos(prev => [...prev, { ...gasto, id: generateId() }])
  }

  const updateGasto = (id: string, gasto: Omit<Gasto, 'id'>) => {
    setGastos(prev => prev.map(g => g.id === id ? { ...gasto, id } : g))
  }

  const deleteGasto = (id: string) => {
    setGastos(prev => prev.filter(g => g.id !== id))
  }

  const addTrafego = (t: Omit<TrafegoPago, 'id' | 'custoConversa'>) => {
    const custoConversa = t.conversas > 0 ? t.valorInvestido / t.conversas : 0
    setTrafego(prev => [...prev, { ...t, custoConversa, id: generateId() }])
  }

  const updateTrafego = (id: string, t: Omit<TrafegoPago, 'id' | 'custoConversa'>) => {
    const custoConversa = t.conversas > 0 ? t.valorInvestido / t.conversas : 0
    setTrafego(prev => prev.map(tr => tr.id === id ? { ...t, custoConversa, id } : tr))
  }

  const deleteTrafego = (id: string) => {
    setTrafego(prev => prev.filter(t => t.id !== id))
  }

  const addParceiro = (parceiro: Omit<Parceiro, 'id'>) => {
    setParceiros(prev => [...prev, { ...parceiro, id: generateId() }])
  }

  const updateParceiro = (id: string, parceiro: Omit<Parceiro, 'id'>) => {
    setParceiros(prev => prev.map(p => p.id === id ? { ...parceiro, id } : p))
  }

  const deleteParceiro = (id: string) => {
    setParceiros(prev => prev.filter(p => p.id !== id))
  }

  const addVendaParceiro = (venda: Omit<VendaParceiro, 'id' | 'valorPagar'>) => {
    const parceiro = parceiros.find(p => p.id === venda.parceiroId)
    const valorPagar = parceiro ? venda.valorTotal * (parceiro.porcentagem / 100) : 0
    setVendasParceiros(prev => [...prev, { ...venda, valorPagar, id: generateId() }])
  }

  const updateVendaParceiro = (id: string, venda: Omit<VendaParceiro, 'id' | 'valorPagar'>) => {
    const parceiro = parceiros.find(p => p.id === venda.parceiroId)
    const valorPagar = parceiro ? venda.valorTotal * (parceiro.porcentagem / 100) : 0
    setVendasParceiros(prev => prev.map(v => v.id === id ? { ...venda, valorPagar, id } : v))
  }

  const deleteVendaParceiro = (id: string) => {
    setVendasParceiros(prev => prev.filter(v => v.id !== id))
  }

  const addCliente = (cliente: Omit<Cliente, 'id'>) => {
    setClientes(prev => [...prev, { ...cliente, id: generateId() }])
  }

  const updateCliente = (id: string, cliente: Omit<Cliente, 'id'>) => {
    setClientes(prev => prev.map(c => c.id === id ? { ...cliente, id } : c))
  }

  const deleteCliente = (id: string) => {
    setClientes(prev => prev.filter(c => c.id !== id))
  }

  const addFerramenta = (ferramenta: Omit<Ferramenta, 'id'>) => {
    setFerramentas(prev => [...prev, { ...ferramenta, id: generateId() }])
  }

  const updateFerramenta = (id: string, ferramenta: Omit<Ferramenta, 'id'>) => {
    setFerramentas(prev => prev.map(f => f.id === id ? { ...ferramenta, id } : f))
  }

  const deleteFerramenta = (id: string) => {
    setFerramentas(prev => prev.filter(f => f.id !== id))
  }

  const filterByDate = <T extends { data: string }>(items: T[], mes?: number, ano?: number) => {
    if (!mes && !ano) return items
    return items.filter(item => {
      const date = new Date(item.data)
      const matchMonth = mes ? date.getMonth() + 1 === mes : true
      const matchYear = ano ? date.getFullYear() === ano : true
      return matchMonth && matchYear
    })
  }

  const getTotalReceitas = (mes?: number, ano?: number) => {
    return filterByDate(receitas, mes, ano).reduce((sum, r) => sum + r.valor, 0)
  }

  const getTotalGastos = (mes?: number, ano?: number) => {
    return filterByDate(gastos, mes, ano).reduce((sum, g) => sum + g.valor, 0)
  }

  const getLucro = (mes?: number, ano?: number) => {
    return getTotalReceitas(mes, ano) - getTotalGastos(mes, ano)
  }

  const getTotalTrafego = (mes?: number, ano?: number) => {
    return filterByDate(trafego, mes, ano).reduce((sum, t) => sum + t.valorInvestido, 0)
  }

  const getTotalVendasTrafego = (mes?: number, ano?: number) => {
    return filterByDate(trafego, mes, ano).reduce((sum, t) => sum + t.faturamento, 0)
  }

  return (
    <DataContext.Provider value={{
      receitas,
      gastos,
      trafego,
      parceiros,
      vendasParceiros,
      clientes,
      ferramentas,
      addReceita,
      updateReceita,
      deleteReceita,
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
      addCliente,
      updateCliente,
      deleteCliente,
      addFerramenta,
      updateFerramenta,
      deleteFerramenta,
      getTotalReceitas,
      getTotalGastos,
      getLucro,
      getTotalTrafego,
      getTotalVendasTrafego,
    }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}
