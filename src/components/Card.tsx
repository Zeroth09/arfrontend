import React from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'elevated'
  hover?: boolean
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', hover = false, children, ...props }, ref) => {
    const baseClasses = 'rounded-xl p-6 transition-all duration-300'
    
    const variants = {
      default: 'bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl',
      glass: 'bg-white/5 backdrop-blur-sm border border-white/10',
      elevated: 'bg-gray-800 border border-gray-700 shadow-lg'
    }
    
    const hoverClasses = hover ? 'hover:scale-105 hover:shadow-xl' : ''

    return (
      <div
        ref={ref}
        className={cn(
          baseClasses,
          variants[variant],
          hoverClasses,
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card' 