import { useState, useEffect, ReactNode } from 'react'
import { X, Minus, ArrowsOut, ArrowsIn } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FloatingWindowProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  className?: string
}

export function FloatingWindow({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: FloatingWindowProps) {
  const [isMaximized, setIsMaximized] = useState(true)
  const [isMinimized, setIsMinimized] = useState(false)

  useEffect(() => {
    if (open) {
      setIsMaximized(true)
      setIsMinimized(false)
    }
  }, [open])

  if (!open) return null

  const handleClose = () => {
    onOpenChange(false)
    setIsMaximized(true)
    setIsMinimized(false)
  }

  const handleMinimize = () => {
    setIsMinimized(!isMinimized)
  }

  const handleMaximize = () => {
    setIsMaximized(!isMaximized)
  }

  return (
    <>
      <div
        className="fixed z-40 bg-background/80 backdrop-blur-sm"
        style={{
          left: 'var(--sidebar-width, 0)',
          right: 0,
          top: 0,
          bottom: 0,
        }}
        onClick={handleClose}
      />
      
      <div
        className={cn(
          "fixed z-40 bg-card shadow-2xl flex flex-col transition-all duration-300 ease-in-out",
          isMinimized
            ? "bottom-0 h-14 rounded-t-lg"
            : "rounded-lg",
          className
        )}
        style={{
          left: isMinimized 
            ? 'calc(var(--sidebar-width, 0px) + (100vw - var(--sidebar-width, 0px)) / 2 - 10rem)'
            : 'calc(var(--sidebar-width, 0px) + 1rem)',
          right: isMinimized ? 'auto' : '1rem',
          top: isMinimized ? 'auto' : '1rem',
          bottom: isMinimized ? '0' : '1rem',
          width: isMinimized ? '20rem' : 'auto',
          height: isMinimized ? '3.5rem' : 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/30">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold font-display truncate">{title}</h2>
            {description && !isMinimized && (
              <p className="text-sm text-muted-foreground truncate">{description}</p>
            )}
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleMinimize}
              title={isMinimized ? "Restaurar" : "Minimizar"}
            >
              <Minus size={18} weight="bold" />
            </Button>
            
            {!isMinimized && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleMaximize}
                title={isMaximized ? "Restaurar" : "Maximizar"}
              >
                {isMaximized ? (
                  <ArrowsIn size={18} weight="bold" />
                ) : (
                  <ArrowsOut size={18} weight="bold" />
                )}
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={handleClose}
              title="Fechar"
            >
              <X size={18} weight="bold" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <div className="flex-1 overflow-auto p-6">
            {children}
          </div>
        )}
      </div>
    </>
  )
}
