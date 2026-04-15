import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center font-semibold rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none min-h-[48px] min-w-[48px]'

  const variants = {
    primary: 'bg-nutreco-blue text-white hover:bg-blue-800 focus:ring-nutreco-blue',
    secondary: 'bg-nutreco-teal text-white hover:bg-teal-700 focus:ring-nutreco-teal',
    danger: 'bg-nutreco-red text-white hover:bg-red-700 focus:ring-nutreco-red',
    ghost: 'bg-transparent text-nutreco-blue border border-nutreco-blue hover:bg-blue-50 focus:ring-nutreco-blue',
  }

  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-5 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }

  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  )
}
