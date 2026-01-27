import { useState, useEffect } from "react"
import { Usuario, Permissao, PermissaoModulo, NivelAcesso } from "@/lib/types"
import { hashSenha } from "@/lib/auth-service"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface UsuarioFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  usuario?: Usuario
  onSave: (usuario: Omit<Usuario, "id"> & { id?: string }) => void
}

const MODULOS: { value: PermissaoModulo; label: string }[] = [
  { value: "processos", label: "Processos" },
  { value: "metricas", label: "Métricas" },
  { value: "previsoes", label: "Previsões" },
  { value: "resumo", label: "Resumo Financeiro" },
  { value: "cadastros", label: "Cadastros" },
  { value: "sincronizacao", label: "Sincronização" },
  { value: "usuarios", label: "Usuários" },
]

const NIVEIS: { value: NivelAcesso; label: string; description: string }[] = [
  { value: "leitura", label: "Leitura", description: "Visualizar apenas" },
  { value: "escrita", label: "Escrita", description: "Criar e editar" },
  { value: "admin", label: "Admin", description: "Acesso total" },
]

export function UsuarioForm({ open, onOpenChange, usuario, onSave }: UsuarioFormProps) {
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [confirmarSenha, setConfirmarSenha] = useState("")
  const [cargo, setCargo] = useState("")
  const [ativo, setAtivo] = useState(true)
  const [permissoes, setPermissoes] = useState<Permissao[]>([])

  useEffect(() => {
    if (usuario) {
      setNome(usuario.nome)
      setEmail(usuario.email)
      setSenha("")
      setConfirmarSenha("")
      setCargo(usuario.cargo)
      setAtivo(usuario.ativo)
      setPermissoes(usuario.permissoes)
    } else {
      setNome("")
      setEmail("")
      setSenha("")
      setConfirmarSenha("")
      setCargo("")
      setAtivo(true)
      setPermissoes([])
    }
  }, [usuario, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (senha && senha !== confirmarSenha) {
      alert("As senhas não coincidem!")
      return
    }

    if (!usuario && !senha) {
      alert("Por favor, defina uma senha para o novo usuário")
      return
    }

    const senhaHash = senha ? await hashSenha(senha) : usuario?.senha || ""

    const usuarioData: Omit<Usuario, "id"> & { id?: string } = {
      nome,
      email,
      senha: senhaHash,
      cargo,
      ativo,
      permissoes,
      dataCriacao: usuario?.dataCriacao || new Date().toISOString(),
      ultimoAcesso: usuario?.ultimoAcesso,
    }

    if (usuario) {
      usuarioData.id = usuario.id
    }

    onSave(usuarioData)
    onOpenChange(false)
  }

  const handleAddPermissao = (modulo: PermissaoModulo, nivel: NivelAcesso) => {
    const existe = permissoes.find((p) => p.modulo === modulo)
    
    if (existe) {
      setPermissoes(permissoes.map((p) => (p.modulo === modulo ? { modulo, nivel } : p)))
    } else {
      setPermissoes([...permissoes, { modulo, nivel }])
    }
  }

  const handleRemovePermissao = (modulo: PermissaoModulo) => {
    setPermissoes(permissoes.filter((p) => p.modulo !== modulo))
  }

  const getPermissaoNivel = (modulo: PermissaoModulo): NivelAcesso | null => {
    const permissao = permissoes.find((p) => p.modulo === modulo)
    return permissao ? permissao.nivel : null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{usuario ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo *</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="João da Silva"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="joao@prefeitura.gov.br"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cargo">Cargo *</Label>
              <Input
                id="cargo"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                placeholder="Analista Administrativo"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="senha">
                Senha {usuario ? "(deixe vazio para manter atual)" : "*"}
              </Label>
              <Input
                id="senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder={usuario ? "Nova senha (opcional)" : "Digite a senha"}
                required={!usuario}
                autoComplete="new-password"
                minLength={6}
              />
              {!usuario && (
                <p className="text-xs text-muted-foreground">
                  Mínimo de 6 caracteres
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmar-senha">
                Confirmar Senha {!usuario || senha ? "*" : ""}
              </Label>
              <Input
                id="confirmar-senha"
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder={usuario ? "Confirme a nova senha" : "Digite novamente"}
                required={!usuario || !!senha}
                autoComplete="new-password"
                minLength={6}
              />
              {senha && senha !== confirmarSenha && confirmarSenha && (
                <p className="text-xs text-destructive">
                  As senhas não coincidem
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ativo">Status</Label>
              <div className="flex items-center gap-3 h-10">
                <Switch id="ativo" checked={ativo} onCheckedChange={setAtivo} />
                <span className="text-sm font-medium">
                  {ativo ? "Ativo" : "Inativo"}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold mb-2">Permissões de Acesso</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Defina quais módulos o usuário pode acessar e seu nível de permissão
              </p>
            </div>

            <div className="space-y-3">
              {MODULOS.map((modulo) => {
                const nivelAtual = getPermissaoNivel(modulo.value)
                const temPermissao = nivelAtual !== null

                return (
                  <Card key={modulo.value} className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1">
                        <Switch
                          checked={temPermissao}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              handleAddPermissao(modulo.value, "leitura")
                            } else {
                              handleRemovePermissao(modulo.value)
                            }
                          }}
                        />
                        <Label className="font-medium cursor-pointer">
                          {modulo.label}
                        </Label>
                      </div>

                      {temPermissao && (
                        <Select
                          value={nivelAtual}
                          onValueChange={(value) =>
                            handleAddPermissao(modulo.value, value as NivelAcesso)
                          }
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {NIVEIS.map((nivel) => (
                              <SelectItem key={nivel.value} value={nivel.value}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{nivel.label}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {nivel.description}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>

            {permissoes.length > 0 && (
              <div className="pt-2">
                <p className="text-xs text-muted-foreground mb-2">Resumo de Permissões:</p>
                <div className="flex flex-wrap gap-2">
                  {permissoes.map((p) => {
                    const moduloInfo = MODULOS.find((m) => m.value === p.modulo)
                    const nivelInfo = NIVEIS.find((n) => n.value === p.nivel)
                    return (
                      <Badge key={p.modulo} variant="secondary">
                        {moduloInfo?.label}: {nivelInfo?.label}
                      </Badge>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={permissoes.length === 0 || (!!senha && senha !== confirmarSenha)}
            >
              {usuario ? "Atualizar" : "Criar"} Usuário
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
