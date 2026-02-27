import { useState, ReactNode } from 'react'
import { X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'

interface FloatingWindowProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  className?: string
  /** Quando true, exibe confirmação antes de fechar */
  confirmClose?: boolean
  /** Texto de confirmação customizado */
  confirmMessage?: string
}

export function FloatingWindow({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  confirmClose = false,
  confirmMessage,
}: FloatingWindowProps) {
  const [showConfirm, setShowConfirm] = useState(false)

  if (!open) return null

  const requestClose = () => {
    if (confirmClose) {
      setShowConfirm(true)
    } else {
      onOpenChange(false)
    }
  }

  const confirmAndClose = () => {
    setShowConfirm(false)
    onOpenChange(false)
  }

  return (
    <>
      {/* Overlay — NÃO fecha ao clicar */}
      <div
        className="fixed z-40 bg-background/60 backdrop-blur-sm"
        style={{ left: 'var(--sidebar-width, 0)', right: 0, top: 0, bottom: 0 }}
      />

      {/* Painel fixo — mesmo padrão dos módulos */}
      <div
        className={cn(
          'fixed z-50 bg-card shadow-2xl flex flex-col rounded-xl border',
          className
        )}
        style={{
          left: 'calc(var(--sidebar-width, 0px) + 1.5rem)',
          right: '1.5rem',
          top: '1.5rem',
          bottom: '1.5rem',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/30 rounded-t-xl">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold font-display truncate">{title}</h2>
            {description && (
              <p className="text-sm text-muted-foreground truncate">{description}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={requestClose}
            title="Fechar"
          >
            <X size={18} weight="bold" />
          </Button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </div>

      {/* Modal de confirmação */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="z-[60]">
          <AlertDialogHeader>
            <AlertDialogTitle>Deseja sair sem salvar?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmMessage || 'Você tem alterações não salvas. Se sair agora, elas serão perdidas.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar editando</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmAndClose}
            >
              Sair sem salvar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
