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
      {/* Painel fixo — ocupa exatamente a área de conteúdo (direita da sidebar, abaixo do header) */}
      <div
        className={cn(
          'fixed z-30 bg-background flex flex-col',
          className
        )}
        style={{
          left: 'var(--sidebar-width, 0px)',
          right: 0,
          top: '4rem',   /* altura do header (h-16) */
          bottom: 0,
        }}
      >
        {/* Header da página — mesmo estilo dos módulos */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-background/95 backdrop-blur">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold font-display truncate">{title}</h2>
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

        {/* Conteúdo com mesmo padding dos módulos */}
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
