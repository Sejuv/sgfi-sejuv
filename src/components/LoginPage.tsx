import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/auth-context'
import { useLocalStorage } from '@/hooks/use-local-storage'
import { toast } from 'sonner'
import { Sun, Moon, Eye, EyeSlash, CircleNotch } from '@phosphor-icons/react'
import { useTheme } from '@/lib/theme-context'

export function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { login, register } = useAuth()
  const { toggleTheme, isDark } = useTheme()
  const [loginBackground] = useLocalStorage<string>('login-background', '')
  const [loginLogo] = useLocalStorage<string>('login-logo', '')
  const [loginCardBgColor] = useLocalStorage<string>('login-card-bg', '#ffffff')
  const [loginCardTextColor] = useLocalStorage<string>('login-card-text', '#1a1a1a')
  const [loginButtonBgColor] = useLocalStorage<string>('login-button-bg', '#4c4faf')
  const [loginButtonTextColor] = useLocalStorage<string>('login-button-text', '#ffffff')
  const [loginBackgroundOverlay] = useLocalStorage<string>('login-bg-overlay', 'dark')
  const [imageError, setImageError] = useState(false)



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
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
    } finally {
      setIsLoading(false)
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
    : isDark
      ? 'bg-gradient-to-br from-[oklch(0.10_0.03_260)] via-[oklch(0.13_0.025_255)] to-[oklch(0.11_0.02_220)]'
      : 'bg-gradient-to-br from-[oklch(0.92_0.04_255)] via-[oklch(0.97_0.01_240)] to-[oklch(0.93_0.05_195)]'

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={backgroundStyle}
    >
      <div className={`absolute inset-0 ${overlayClass}`} />

      {/* Decorative blobs */}
      {!hasBackgroundImage && (
        <>
          <div className="absolute top-[-10%] left-[-5%] w-72 h-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
        </>
      )}

      {/* Botão de tema */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        title={isDark ? 'Modo claro' : 'Modo escuro'}
        className="absolute top-4 right-4 z-20 rounded-full text-foreground/60 hover:text-foreground hover:bg-foreground/10"
      >
        {isDark ? <Sun size={20} weight="bold" /> : <Moon size={20} weight="bold" />}
      </Button>

      <Card 
        className="w-full max-w-sm shadow-2xl relative z-10 backdrop-blur-md border animate-fade-in-up"
        style={{
          backgroundColor: `${loginCardBgColor}f0`,
          color: loginCardTextColor,
          borderColor: `${loginCardBgColor}80`,
        }}
      >
        <CardHeader className="space-y-1 text-center pb-4">
          <div className="flex justify-center mb-2">
            {loginLogo ? (
              <img
                src={loginLogo}
                alt="Logo"
                className="w-full max-h-36 object-contain"
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
            ) : (
              <img
                src="/logo-iraucuba.svg"
                alt="Logo Iraucuba"
                className="w-full max-h-36 object-contain"
              />
            )}
          </div>
          <CardTitle className="text-2xl font-bold font-display" style={{ color: loginCardTextColor }}>
            {isLogin ? 'Bem-vindo ao SGFI' : 'Criar Conta'}
          </CardTitle>
          <CardDescription style={{ color: `${loginCardTextColor}99` }}>
            {isLogin
              ? 'Entre com suas credenciais para acessar o sistema'
              : 'Preencha os dados para criar sua conta'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1.5">
                <Label htmlFor="name" style={{ color: loginCardTextColor }}>Nome Completo</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  required={!isLogin}
                  disabled={isLoading}
                  style={{
                    backgroundColor: `${loginCardBgColor}`,
                    color: loginCardTextColor,
                    borderColor: `${loginCardTextColor}30`,
                  }}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" style={{ color: loginCardTextColor }}>Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                disabled={isLoading}
                autoComplete="email"
                style={{
                  backgroundColor: `${loginCardBgColor}`,
                  color: loginCardTextColor,
                  borderColor: `${loginCardTextColor}30`,
                }}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" style={{ color: loginCardTextColor }}>Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  className="pr-10"
                  style={{
                    backgroundColor: `${loginCardBgColor}`,
                    color: loginCardTextColor,
                    borderColor: `${loginCardTextColor}30`,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-current/50 hover:text-current/80 transition-colors"
                  style={{ color: loginCardTextColor }}
                  tabIndex={-1}
                >
                  {showPassword
                    ? <EyeSlash size={16} weight="bold" />
                    : <Eye size={16} weight="bold" />
                  }
                </button>
              </div>
            </div>

            <Button 
              type="submit"
              className="w-full gap-2 font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
              disabled={isLoading}
              style={{
                backgroundColor: loginButtonBgColor,
                color: loginButtonTextColor,
              }}
            >
              {isLoading && <CircleNotch size={16} weight="bold" className="animate-spin" />}
              {isLogin ? 'Entrar' : 'Criar Conta'}
            </Button>
          </form>

          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setShowPassword(false) }}
              className="text-sm hover:underline font-medium transition-colors"
              style={{ color: loginButtonBgColor }}
            >
              {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça login'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
