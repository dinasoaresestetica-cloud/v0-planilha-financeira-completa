"use client"

import { useState } from 'react'
import { DataProvider } from '@/lib/data-context'
import { Sidebar } from '@/components/dashboard/sidebar'
import { DashboardHome } from '@/components/dashboard/dashboard-home'
import { Receitas } from '@/components/dashboard/receitas'
import { Gastos } from '@/components/dashboard/gastos'
import { Trafego } from '@/components/dashboard/trafego'
import { Parceiros } from '@/components/dashboard/parceiros'
import { Clientes } from '@/components/dashboard/clientes'
import { Ferramentas } from '@/components/dashboard/ferramentas'

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
      case 'parceiros':
        return <Parceiros />
      case 'clientes':
        return <Clientes />
      case 'ferramentas':
        return <Ferramentas />
      default:
        return <DashboardHome />
    }
  }

  return (
    <DataProvider>
      <div className="min-h-screen bg-background">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="lg:pl-64">
          <div className="container max-w-7xl mx-auto px-4 py-6 pt-16 lg:pt-6">
            {renderContent()}
          </div>
        </main>
      </div>
    </DataProvider>
  )
}
