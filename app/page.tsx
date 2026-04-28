"use client"

import { useState } from 'react'
import { DataProvider } from '@/lib/data-context'
import { Sidebar } from '@/components/dashboard/sidebar'
import { DashboardHome } from '@/components/dashboard/dashboard-home'
import { Receitas } from '@/components/dashboard/receitas'
import { Gastos } from '@/components/dashboard/gastos'
import { Trafego } from '@/components/dashboard/trafego'
import { Criativos } from '@/components/dashboard/criativos'
import { Parceiros } from '@/components/dashboard/parceiros'
import { Clientes } from '@/components/dashboard/clientes'
import { Ferramentas } from '@/components/dashboard/ferramentas'
import { Historico } from '@/components/dashboard/historico'

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard')

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardHome />
      case 'receitas':
        return <Receitas />
      case 'gastos':
        return <Gastos />
      case 'trafego':
        return <Trafego />
      case 'criativos':
        return <Criativos />
      case 'parceiros':
        return <Parceiros />
      case 'clientes':
        return <Clientes />
      case 'ferramentas':
        return <Ferramentas />
      case 'historico':
        return <Historico />
      default:
        return <DashboardHome />
    }
  }

  return (
    <DataProvider>
      <div className="min-h-screen bg-background">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="lg:pl-72">
          <div className="w-full px-4 py-6 pt-16 lg:pt-8 lg:px-8 xl:px-12 2xl:px-16">
            <div className="max-w-[1600px] mx-auto">
              {renderContent()}
            </div>
          </div>
        </main>
      </div>
    </DataProvider>
  )
}
