import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LockKey, EnvelopeSimple, Buildings, Info } from "@phosphor-icons/react"

interface LoginProps {
  onLogin: (email: string, senha: string) => Promise<boolean>
  erro?: string
}

export function Login({ onLogin, erro }: LoginProps) {
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [carregando, setCarregando] = useState(false)
  const [mostrarInfo, setMostrarInfo] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCarregando(true)
    await onLogin(email, senha)
    setCarregando(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-accent/10 p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/80 mb-4 shadow-lg">
            <Buildings className="w-10 h-10 text-primary-foreground" weight="bold" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Sistema de Gestão
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
                onClick={() => setMostrarInfo(!mostrarInfo)}
              >
                <Info size={16} weight="bold" />
                {mostrarInfo ? "Ocultar informações" : "Informações de acesso"}
              </Button>

              {mostrarInfo && (
                <div className="mt-4 p-4 bg-muted/50 rounded-lg space-y-2 text-sm animate-in fade-in slide-in-from-top-2">
                  <p className="font-semibold text-foreground">Acesso inicial do sistema:</p>
                  <div className="space-y-1 text-muted-foreground">
                    <p><span className="font-medium">Email:</span> admin@iraucuba.ce.gov.br</p>
                    <p><span className="font-medium">Senha:</span> admin123</p>
                  </div>
                  <p className="text-xs text-amber-600 font-medium mt-3">
                    ⚠️ Altere a senha após o primeiro acesso
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          © {new Date().getFullYear()} JEOS Sistemas - Taylan Itallo
        </p>
      </div>
    </div>
  );
}
