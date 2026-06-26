import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'flex h-11 w-full rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200',
        'bg-[#141020] border border-white/[0.08] text-white',
        'placeholder:text-[#55556A]',
        'focus:outline-none focus:border-[rgba(157,78,221,0.6)] focus:shadow-[0_0_0_3px_rgba(157,78,221,0.1)]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = 'Input'

export { Input }
