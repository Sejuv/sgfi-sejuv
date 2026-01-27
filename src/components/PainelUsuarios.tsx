import { useState, useMemo } from "react"
import { useFirebaseKV } from "@/hooks/useFirebaseKV"
import { Usuario } from "@/lib/types"
import { UsuarioForm } from "@/components/UsuarioForm"
import { UsuariosTable } from "@/components/UsuariosTable"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { MagnifyingGlass, User, CheckCircle, XCircle, ShieldCheck, Plus } from "@phosphor-icons/react"
import { toast } from "sonner"

export function PainelUsuarios() {
  const [usuarios, setUsuarios] = useFirebaseKV<Usuario[]>("usuarios", [])
  const [formOpen, setFormOpen] = useState(false)
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | undefined>()
  const [busca, setBusca] = useState("")
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "ativo" | "inativo">("todos")

  const usuariosArray = usuarios || []

  const usuariosFiltrados = useMemo(() => {
    return usuariosArray.filter((usuario) => {
      if (busca) {
        const buscaLower = busca.toLowerCase()
        const matchNome = usuario.nome.toLowerCase().includes(buscaLower)
        const matchEmail = usuario.email.toLowerCase().includes(buscaLower)
        const matchCargo = usuario.cargo.toLowerCase().includes(buscaLower)
        if (!matchNome && !matchEmail && !matchCargo) return false
      }

      if (filtroStatus === "ativo" && !usuario.ativo) return false
      if (filtroStatus === "inativo" && usuario.ativo) return false

      return true
    })
  }, [usuariosArray, busca, filtroStatus])

  const estatisticas = useMemo(() => {
    const total = usuariosArray.length
    const ativos = usuariosArray.filter((u) => u.ativo).length
    const inativos = total - ativos
    const comPermissaoAdmin = usuariosArray.filter((u) =>
      u.permissoes.some((p) => p.nivel === "admin")
    ).length

    return { total, ativos, inativos, comPermissaoAdmin }
  }, [usuariosArray])

  const handleSaveUsuario = (usuarioData: Omit<Usuario, "id"> & { id?: string }) => {
    setUsuarios((current) => {
      const currentArray = current || []
      if (usuarioData.id) {
        return currentArray.map((u) => (u.id === usuarioData.id ? (usuarioData as Usuario) : u))
      } else {
        const novoUsuario: Usuario = {
          ...usuarioData,
          id: Date.now().toString(),
        }
        return [...currentArray, novoUsuario]
      }
    })
    toast.success(usuarioData.id ? "Usuário atualizado com sucesso" : "Usuário criado com sucesso")
    setUsuarioEditando(undefined)
  }

  const handleDeleteUsuario = (id: string) => {
    setUsuarios((current) => (current || []).filter((u) => u.id !== id))
    toast.success("Usuário excluído com sucesso")
  }

  const handleEditUsuario = (usuario: Usuario) => {
    setUsuarioEditando(usuario)
    setFormOpen(true)
  }

  const handleNovoUsuario = () => {
    setUsuarioEditando(undefined)
    setFormOpen(true)
  }

  return (
    <div className="space-y-6 overflow-y-scroll h-full" style={{scrollBehavior: 'smooth'}}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gerenciamento de Usuários</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie usuários e suas permissões de acesso ao sistema
          </p>
        </div>
        <Button onClick={handleNovoUsuario} size="default" className="gap-2">
          <Plus className="h-4 w-4" weight="bold" />
          Novo Usuário
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <div className="flex items-center gap-3">
            <User className="h-8 w-8 text-primary" weight="bold" />
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Total de Usuários
              </p>
              <p className="text-2xl font-bold text-primary mt-1 tabular-nums">
                {estatisticas.total}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-emerald-100/50 to-emerald-50/50 border-emerald-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-emerald-600" weight="fill" />
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Ativos
              </p>
              <p className="text-2xl font-bold text-emerald-700 mt-1 tabular-nums">
                {estatisticas.ativos}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-gray-100/50 to-gray-50/50 border-gray-200">
          <div className="flex items-center gap-3">
            <XCircle className="h-8 w-8 text-gray-400" weight="fill" />
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Inativos
              </p>
              <p className="text-2xl font-bold text-gray-600 mt-1 tabular-nums">
                {estatisticas.inativos}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-100/50 to-purple-50/50 border-purple-200">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-purple-600" weight="fill" />
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Administradores
              </p>
              <p className="text-2xl font-bold text-purple-700 mt-1 tabular-nums">
                {estatisticas.comPermissaoAdmin}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="busca">Buscar Usuário</Label>
            <div className="relative">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="busca"
                placeholder="Nome, e-mail ou cargo..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Filtrar por Status</Label>
            <Select value={filtroStatus} onValueChange={(v) => setFiltroStatus(v as typeof filtroStatus)}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ativo">Apenas Ativos</SelectItem>
                <SelectItem value="inativo">Apenas Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <UsuariosTable
        usuarios={usuariosFiltrados}
        onEdit={handleEditUsuario}
        onDelete={handleDeleteUsuario}
      />

      <UsuarioForm
        open={formOpen}
        onOpenChange={setFormOpen}
        usuario={usuarioEditando}
        onSave={handleSaveUsuario}
      />
    </div>
  )
}
