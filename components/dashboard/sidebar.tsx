"use client"

import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  TrendingDown, 
  TrendingUp,
  Megaphone, 
  Users, 
  UserCheck,
  Menu,
  X,
  Image,
  History,
  Link2,
  Check,
  Plus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { usePathname } from 'next/navigation'

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'gastos', label: 'Gastos', icon: TrendingDown },
  { id: 'trafego', label: 'Trafego Pago', icon: Megaphone },
  { id: 'criativos', label: 'Criativos', icon: Image },
  { id: 'parceiros', label: 'Parceiros', icon: Users },
  { id: 'analise-clientes', label: 'Analise Clientes', icon: UserCheck },
  { id: 'historico', label: 'Historico', icon: History },
]

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const pathname = usePathname()

  const handleCopyLink = async () => {
    const url = window.location.href
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleNewWorkspace = () => {
    window.open('/', '_blank')
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 z-40 h-screen w-64 lg:w-72 bg-card border-r border-border transition-transform duration-300",
        "lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold text-foreground">Financeiro</h1>
              <p className="text-xs text-muted-foreground">Controle Completo</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4">
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        onTabChange(item.id)
                        setMobileOpen(false)
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                        isActive 
                          ? "bg-primary text-primary-foreground shadow-sm" 
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 border-t border-border space-y-3">
            {/* Botao Copiar Link */}
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={handleCopyLink}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-green-500">Link Copiado!</span>
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4" />
                  Copiar Link do Cliente
                </>
              )}
            </Button>

            {/* Botao Nova Planilha */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-muted-foreground"
              onClick={handleNewWorkspace}
            >
              <Plus className="h-4 w-4" />
              Criar Nova Planilha
            </Button>

            <p className="text-xs text-muted-foreground text-center pt-2">
              Planilha Financeira v1.0
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}
