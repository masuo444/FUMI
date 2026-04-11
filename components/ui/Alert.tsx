import { cn } from '@/lib/utils'

type AlertVariant = 'info' | 'warning' | 'danger' | 'success'

const styles: Record<AlertVariant, string> = {
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  danger: 'bg-red-50 border-red-200 text-red-800',
  success: 'bg-green-50 border-green-200 text-green-800',
}

export function Alert({ children, variant = 'info', className }: {
  children: React.ReactNode
  variant?: AlertVariant
  className?: string
}) {
  return (
    <div className={cn('rounded-md border px-4 py-3 text-sm', styles[variant], className)}>
      {children}
    </div>
  )
}
