import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { type LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string
  subtitle?: string
  icon: LucideIcon
  variant?: 'default' | 'success' | 'danger' | 'warning'
  trend?: {
    value: number
    label: string
  }
}

export function StatsCard({ title, value, subtitle, icon: Icon, variant = 'default', trend }: StatsCardProps) {
  const variantStyles = {
    default: {
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    success: {
      iconBg: 'bg-success/10',
      iconColor: 'text-success',
    },
    danger: {
      iconBg: 'bg-destructive/10',
      iconColor: 'text-destructive',
    },
    warning: {
      iconBg: 'bg-warning/10',
      iconColor: 'text-warning',
    },
  }

  const styles = variantStyles[variant]

  return (
    <Card className="relative overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-4 lg:p-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-xs lg:text-sm font-medium text-muted-foreground">{title}</p>
            <div className={cn(
              "w-8 h-8 lg:w-11 lg:h-11 rounded-lg lg:rounded-xl flex items-center justify-center flex-shrink-0",
              styles.iconBg
            )}>
              <Icon className={cn("h-4 w-4 lg:h-5 lg:w-5", styles.iconColor)} />
            </div>
          </div>
          <p className="text-lg lg:text-2xl font-bold text-foreground break-words">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1">
              <span className={cn(
                "text-xs font-medium",
                trend.value >= 0 ? "text-success" : "text-destructive"
              )}>
                {trend.value >= 0 ? '+' : ''}{trend.value}%
              </span>
              <span className="text-xs text-muted-foreground">{trend.label}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
