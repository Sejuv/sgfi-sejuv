import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/auth-context'
import { useLocalStorage } from '@/hooks/use-local-storage'
import { toast } from 'sonner'
import { User } from '@phosphor-icons/react'

export function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const { login, register } = useAuth()
  const [loginBackground] = useLocalStorage<string>('login-background', '')
  const [loginLogo] = useLocalStorage<string>('login-logo', '')
  const [loginCardBgColor] = useLocalStorage<string>('login-card-bg', '#ffffff')
  const [loginCardTextColor] = useLocalStorage<string>('login-card-text', '#1a1a1a')
  const [loginButtonBgColor] = useLocalStorage<string>('login-button-bg', '#4c4faf')
  const [loginButtonTextColor] = useLocalStorage<string>('login-button-text', '#ffffff')
  const [loginBackgroundOverlay] = useLocalStorage<string>('login-bg-overlay', 'dark')
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    if (loginBackground) {
      console.log('Background image loaded:', loginBackground.substring(0, 50) + '...')
    }
  }, [loginBackground])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isLogin) {
      const success = await login(email, password)
      if (success) {
        toast.success('Login realizado com sucesso!')
      } else {
        toast.error('Email ou senha incorretos')
      }
    } else {
      if (!name.trim()) {
        toast.error('Por favor, insira seu nome')
        return
      }
      const success = await register({
        name,
        email,
        password,
        role: 'viewer',
      })
      if (success) {
        toast.success('Conta criada! Agora faça login.')
        setIsLogin(true)
        setName('')
      } else {
        toast.error('Este email já está cadastrado')
      }
    }
  }

  const hasBackgroundImage = loginBackground && loginBackground.length > 0 && !imageError
  
  const backgroundStyle = hasBackgroundImage
    ? {
        backgroundImage: `url("${loginBackground}")`,
        backgroundSize: '100% 100%',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }
    : {}

  const overlayClass = hasBackgroundImage
    ? loginBackgroundOverlay === 'light'
      ? 'bg-white/40'
      : loginBackgroundOverlay === 'dark'
      ? 'bg-black/40'
      : loginBackgroundOverlay === 'gradient'
      ? 'bg-gradient-to-br from-black/40 via-black/20 to-black/40'
      : ''
    : 'bg-gradient-to-br from-primary/5 via-background to-accent/5'

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={backgroundStyle}
    >
      <div className={`absolute inset-0 ${overlayClass}`} />
      <Card 
        className="w-full max-w-xs shadow-2xl relative z-10 backdrop-blur-sm border-2"
        style={{
          backgroundColor: `${loginCardBgColor}f2`,
          color: loginCardTextColor,
          borderColor: `${loginCardBgColor}`,
        }}
      >
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            {loginLogo ? (
              <img
                src={loginLogo}
                alt="Logo"
                className="w-16 h-16 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            ) : (
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: loginButtonBgColor }}
              >
                <User size={32} weight="bold" style={{ color: loginButtonTextColor }} />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl font-bold font-display" style={{ color: loginCardTextColor }}>
            {isLogin ? 'Bem-vindo ao SGFI' : 'Criar Conta'}
          </CardTitle>
          <CardDescription style={{ color: `${loginCardTextColor}cc` }}>
            {isLogin
              ? 'Entre com suas credenciais para acessar o sistema'
              : 'Preencha os dados para criar sua conta'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name" style={{ color: loginCardTextColor }}>Nome Completo</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  required={!isLogin}
                  style={{
                    backgroundColor: `${loginCardBgColor}`,
                    color: loginCardTextColor,
                    borderColor: `${loginCardTextColor}40`,
                  }}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" style={{ color: loginCardTextColor }}>Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                style={{
                  backgroundColor: `${loginCardBgColor}`,
                  color: loginCardTextColor,
                  borderColor: `${loginCardTextColor}40`,
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" style={{ color: loginCardTextColor }}>Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  backgroundColor: `${loginCardBgColor}`,
                  color: loginCardTextColor,
                  borderColor: `${loginCardTextColor}40`,
                }}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full transition-opacity hover:opacity-90"
              style={{
                backgroundColor: loginButtonBgColor,
                color: loginButtonTextColor,
              }}
            >
              {isLogin ? 'Entrar' : 'Criar Conta'}
            </Button>
          </form>
          <div className="mt-6 space-y-3">
            <div className="text-center text-sm">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="hover:underline font-medium"
                style={{ color: loginButtonBgColor }}
              >
                {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça login'}
              </button>
            </div>

          </div>
        </CardContent>
      </Card>
    </div>
  )
}
