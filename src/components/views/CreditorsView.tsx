import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Plus, Users, Trash, PencilSimple } from '@phosphor-icons/react'
import { Creditor } from '@/lib/types'

interface DeleteConfirm {
  type: 'expense' | 'creditor' | 'contract'
  id: string
  label: string
}

interface CreditorsViewProps {
  creditors: Creditor[]
  onNewCreditor: () => void
  onEditCreditor: (creditor: Creditor) => void
  onDeleteConfirm: (confirm: DeleteConfirm) => void
}

export function CreditorsView({
  creditors,
  onNewCreditor,
  onEditCreditor,
  onDeleteConfirm,
}: CreditorsViewProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-display">Gerenciar Credores</CardTitle>
            <CardDescription>Fornecedores e prestadores de serviço</CardDescription>
          </div>
          <Button onClick={onNewCreditor}>
            <Plus className="mr-2" size={18} weight="bold" />
            Novo Credor
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {creditors.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users size={48} className="mx-auto mb-4 opacity-50" />
            <p>Nenhum credor cadastrado.</p>
            <p className="text-sm">Adicione fornecedores para vincular às despesas.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {creditors.map((creditor) => (
              <Card key={creditor.id} className="py-0">
                <CardHeader className="px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold whitespace-normal break-words leading-snug">{creditor.name}</p>
                      {creditor.documentNumber && (
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">{creditor.documentNumber}</p>
                      )}
                    </div>
                    <div className="flex gap-0.5 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEditCreditor(creditor)}>
                        <PencilSimple size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() =>
                          onDeleteConfirm({ type: 'creditor', id: creditor.id, label: creditor.name })
                        }
                      >
                        <Trash size={14} className="text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
