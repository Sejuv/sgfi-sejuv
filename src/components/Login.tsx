import { useState } from "react"
import { Usuario } from "@/lib/types"
import { hashSenha } from "@/lib/auth-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { LockKey, EnvelopeSimple, Buildings, Info, Moon, Sun } from "@phosphor-icons/react"
import { toast } from "sonner"
import { useEffect } from "react"

interface LoginProps {
  onLogin: (email: string, senha: string) => Promise<boolean>
  erro?: string
  usuarios: Usuario[]
  onAtualizarUsuario: (usuario: Usuario) => void
}

export function Login({ onLogin, erro, usuarios, onAtualizarUsuario }: LoginProps) {
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [carregando, setCarregando] = useState(false)
  const [mostrarRecuperacao, setMostrarRecuperacao] = useState(false)
  const [emailRecuperacao, setEmailRecuperacao] = useState("")
  const [novaSenha, setNovaSenha] = useState("")
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState("")
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode')
      return saved === 'true'
    }
    return false
  })

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('darkMode', darkMode.toString())
  }, [darkMode])

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCarregando(true)
    await onLogin(email, senha)
    setCarregando(false)
  }

  const handleRecuperarSenha = async () => {
    if (!emailRecuperacao) {
      toast.error("Digite o email do usuário")
      return
    }

    const usuario = usuarios.find(u => u.email === emailRecuperacao && u.ativo)
    
    if (!usuario) {
      toast.error("Usuário não encontrado ou inativo")
      return
    }

    if (!novaSenha || novaSenha.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres")
      return
    }

    if (novaSenha !== confirmarNovaSenha) {
      toast.error("As senhas não coincidem")
      return
    }

    try {
      const senhaHash = await hashSenha(novaSenha)
      const usuarioAtualizado: Usuario = {
        ...usuario,
        senha: senhaHash
      }
      
      onAtualizarUsuario(usuarioAtualizado)
      
      toast.success("Senha alterada com sucesso! Faça login com a nova senha.")
      setMostrarRecuperacao(false)
      setEmailRecuperacao("")
      setNovaSenha("")
      setConfirmarNovaSenha("")
    } catch (error) {
      toast.error("Erro ao alterar senha")
      console.error(error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-accent/10 p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />
      
      <Button
        variant="outline"
        size="icon"
        className="absolute top-4 right-4 z-20 rounded-full shadow-lg"
        onClick={toggleDarkMode}
        title={darkMode ? "Modo claro" : "Modo escuro"}
      >
        {darkMode ? <Sun size={20} weight="duotone" /> : <Moon size={20} weight="duotone" />}
      </Button>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/80 mb-4 shadow-lg">
            <Buildings className="w-10 h-10 text-primary-foreground" weight="bold" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Sistema de Gestão de Despesas
          </h1>
          <p className="text-muted-foreground text-lg">Prefeitura de Irauçuba</p>
        </div>

        <Card className="shadow-2xl border-2">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Acesso ao Sistema</CardTitle>
            <CardDescription className="text-center">
              Entre com suas credenciais para acessar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold">
                  Email
                </Label>
                <div className="relative">
                  <EnvelopeSimple 
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" 
                    size={20} 
                    weight="duotone"
                  />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu.email@iraucuba.ce.gov.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-11 h-11"
                    required
                    autoComplete="email"
                    disabled={carregando}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="senha" className="text-sm font-semibold">
                  Senha
                </Label>
                <div className="relative">
                  <LockKey 
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" 
                    size={20} 
                    weight="duotone"
                  />
                  <Input
                    id="senha"
                    type="password"
                    placeholder="••••••••"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="pl-11 h-11"
                    required
                    autoComplete="current-password"
                    disabled={carregando}
                  />
                </div>
              </div>

              {erro && (
                <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2">
                  <AlertDescription className="text-sm">
                    {erro}
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full h-11 text-base font-semibold shadow-lg" 
                disabled={carregando}
              >
                {carregando ? "Entrando..." : "Entrar no Sistema"}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full gap-2 text-muted-foreground hover:text-foreground"
                onClick={() => setMostrarRecuperacao(true)}
              >
                <Info size={16} weight="bold" />
                Esqueceu sua senha?
              </Button>
            </div>
          </CardContent>
        </Card>

        <Dialog open={mostrarRecuperacao} onOpenChange={setMostrarRecuperacao}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Recuperar Senha</DialogTitle>
              <DialogDescription>
                Digite o email do usuário cadastrado e defina uma nova senha
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email-recuperacao">Email do Usuário</Label>
                <Input
                  id="email-recuperacao"
                  type="email"
                  placeholder="usuario@iraucuba.ce.gov.br"
                  value={emailRecuperacao}
                  onChange={(e) => setEmailRecuperacao(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nova-senha">Nova Senha</Label>
                <Input
                  id="nova-senha"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmar-nova-senha">Confirmar Nova Senha</Label>
                <Input
                  id="confirmar-nova-senha"
                  type="password"
                  placeholder="Digite novamente"
                  value={confirmarNovaSenha}
                  onChange={(e) => setConfirmarNovaSenha(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setMostrarRecuperacao(false)}>
                Cancelar
              </Button>
              <Button onClick={handleRecuperarSenha}>
                Alterar Senha
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <p className="text-center text-sm text-muted-foreground mt-6">
          © {new Date().getFullYear()} JEOS Sistemas - Taylan Itallo
        </p>
      </div>
    </div>
  );
}
