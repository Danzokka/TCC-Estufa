import { cn } from '@/lib/utils'
import { Leaf } from 'lucide-react'
import React from 'react'

const Logo = ({className, showTitle}: {className?: string, showTitle?: boolean}) => {
  return (
    <div className={cn('flex items-center gap-2 w-full h-full', className)}>
      <Leaf className='w-8 h-8 text-foreground dark:text-background' fill='var(--primary)' />
      <span className={`text-lg font-bold text-foreground ${showTitle ?  "" : "hidden"}`}>Estufa Inteligente</span>
    </div>
  )
}

export default Logo