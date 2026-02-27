import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {creditors.map((creditor) => (
              <Card key={creditor.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{creditor.name}</CardTitle>
                      {creditor.documentNumber && (
                        <p className="text-sm text-muted-foreground mt-1">{creditor.documentNumber}</p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => onEditCreditor(creditor)}>
                        <PencilSimple size={15} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          onDeleteConfirm({ type: 'creditor', id: creditor.id, label: creditor.name })
                        }
                      >
                        <Trash size={15} className="text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-1">
                  {creditor.contact && <p className="text-sm text-muted-foreground">{creditor.contact}</p>}
                  {creditor.email && <p className="text-sm text-muted-foreground">{creditor.email}</p>}
                  {(creditor.street || creditor.city) && (
                    <p className="text-xs text-muted-foreground">
                      {[creditor.street, creditor.neighborhood, creditor.city, creditor.uf]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  )}
                  {creditor.cep && <p className="text-xs text-muted-foreground">CEP: {creditor.cep}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
