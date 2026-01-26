import { Usuario } from "@/lib/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Pencil, Trash, User, EnvelopeSimple, Briefcase, CheckCircle, XCircle } from "@phosphor-icons/react"
import { formatDate } from "@/lib/utils"

interface UsuariosTableProps {
  usuarios: Usuario[]
  onEdit: (usuario: Usuario) => void
  onDelete: (id: string) => void
}

export function UsuariosTable({ usuarios, onEdit, onDelete }: UsuariosTableProps) {
  if (usuarios.length === 0) {
    return (
      <Card className="p-12 text-center">
        <User className="h-16 w-16 mx-auto mb-4 text-muted-foreground" weight="thin" />
        <h3 className="text-lg font-semibold mb-2">Nenhum usuário cadastrado</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Comece adicionando o primeiro usuário ao sistema
        </p>
      </Card>
    )
  }

  const getNivelBadgeColor = (nivel: string) => {
    switch (nivel) {
      case "admin":
        return "bg-purple-100 text-purple-700 border-purple-200"
      case "escrita":
        return "bg-blue-100 text-blue-700 border-blue-200"
      case "leitura":
        return "bg-gray-100 text-gray-700 border-gray-200"
      default:
        return ""
    }
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Permissões</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Último Acesso</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.map((usuario) => (
              <TableRow key={usuario.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-5 w-5 text-primary" weight="bold" />
                    </div>
                    <div>
                      <p className="font-medium">{usuario.nome}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        {usuario.cargo}
                      </p>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <EnvelopeSimple className="h-4 w-4" />
                    {usuario.email}
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {usuario.permissoes.slice(0, 3).map((p) => (
                      <Badge
                        key={p.modulo}
                        variant="outline"
                        className={`text-xs ${getNivelBadgeColor(p.nivel)}`}
                      >
                        {p.modulo}
                      </Badge>
                    ))}
                    {usuario.permissoes.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{usuario.permissoes.length - 3}
                      </Badge>
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-2">
                    {usuario.ativo ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-emerald-600" weight="fill" />
                        <span className="text-sm font-medium text-emerald-700">Ativo</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-gray-400" weight="fill" />
                        <span className="text-sm font-medium text-gray-500">Inativo</span>
                      </>
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {usuario.ultimoAcesso ? formatDate(usuario.ultimoAcesso) : "Nunca"}
                  </span>
                </TableCell>

                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(usuario)}
                      className="gap-2"
                    >
                      <Pencil className="h-4 w-4" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Deseja realmente excluir o usuário ${usuario.nome}?`)) {
                          onDelete(usuario.id)
                        }
                      }}
                      className="gap-2 text-destructive hover:bg-destructive/10"
                    >
                      <Trash className="h-4 w-4" />
                      Excluir
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}
