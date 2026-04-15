interface BadgeProps {
  variant?: 'synced' | 'pending' | 'error' | 'info'
  children: React.ReactNode
}

export function Badge({ variant = 'info', children }: BadgeProps) {
  const variants = {
    synced: 'bg-nutreco-teal/10 text-nutreco-teal border border-nutreco-teal/30',
    pending: 'bg-nutreco-orange/10 text-nutreco-orange border border-nutreco-orange/30',
    error: 'bg-nutreco-red/10 text-nutreco-red border border-nutreco-red/30',
    info: 'bg-nutreco-blue/10 text-nutreco-blue border border-nutreco-blue/30',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  )
}
