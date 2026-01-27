import { useState, useRef } from "react"
import { useFirebaseKV } from "@/hooks/useFirebaseKV"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { UploadSimple, Image as ImageIcon, Trash } from "@phosphor-icons/react"

interface ConfiguracoesSistemaData {
  logoTopo?: string
  imagemLogin?: string
}

export function ConfiguracoesSistema() {
  const [config, setConfig] = useFirebaseKV<ConfiguracoesSistemaData>("configuracoes-sistema", {})
  const logoInputRef = useRef<HTMLInputElement>(null)
  const loginInputRef = useRef<HTMLInputElement>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingLogin, setUploadingLogin] = useState(false)

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida')
      return
    }

    // Validar tamanho (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 2MB')
      return
    }

    setUploadingLogo(true)
    try {
      const reader = new FileReader()
      reader.onload = (e) => {
        const base64 = e.target?.result as string
        setConfig({ ...config, logoTopo: base64 })
        toast.success('Logo do topo atualizada com sucesso')
        setUploadingLogo(false)
      }
      reader.onerror = () => {
        toast.error('Erro ao ler a imagem')
        setUploadingLogo(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Erro ao fazer upload da logo:', error)
      toast.error('Erro ao fazer upload da logo')
      setUploadingLogo(false)
    }
  }

  const handleLoginImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida')
      return
    }

    // Validar tamanho (máximo 5MB para imagem de fundo)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB')
      return
    }

    setUploadingLogin(true)
    try {
      const reader = new FileReader()
      reader.onload = (e) => {
        const base64 = e.target?.result as string
        setConfig({ ...config, imagemLogin: base64 })
        toast.success('Imagem de login atualizada com sucesso')
        setUploadingLogin(false)
      }
      reader.onerror = () => {
        toast.error('Erro ao ler a imagem')
        setUploadingLogin(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error)
      toast.error('Erro ao fazer upload da imagem')
      setUploadingLogin(false)
    }
  }

  const handleRemoveLogo = () => {
    setConfig({ ...config, logoTopo: undefined })
    toast.success('Logo do topo removida')
  }

  const handleRemoveLoginImage = () => {
    setConfig({ ...config, imagemLogin: undefined })
    toast.success('Imagem de login removida')
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Configurações do Sistema</h2>
        <p className="text-muted-foreground">
          Configure as imagens e personalizações do sistema
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Logo do Topo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Logo do Topo
            </CardTitle>
            <CardDescription>
              Imagem exibida no cabeçalho da barra lateral (recomendado: PNG ou SVG, máx. 2MB)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {config.logoTopo ? (
              <div className="space-y-3">
                <div className="flex items-center justify-center p-4 bg-muted rounded-lg">
                  <img 
                    src={config.logoTopo} 
                    alt="Logo do topo" 
                    className="max-h-32 w-auto object-contain"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo}
                  >
                    <UploadSimple className="mr-2 h-4 w-4" />
                    Alterar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleRemoveLogo}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-center p-8 border-2 border-dashed rounded-lg">
                  <div className="text-center">
                    <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Nenhuma logo selecionada
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploadingLogo}
                >
                  <UploadSimple className="mr-2 h-4 w-4" />
                  {uploadingLogo ? 'Enviando...' : 'Selecionar Logo'}
                </Button>
              </div>
            )}
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
            />
          </CardContent>
        </Card>

        {/* Imagem de Login */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Imagem de Fundo - Login
            </CardTitle>
            <CardDescription>
              Imagem exibida como marca d'água na tela de login (recomendado: PNG ou JPG, máx. 5MB)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {config.imagemLogin ? (
              <div className="space-y-3">
                <div className="flex items-center justify-center p-4 bg-muted rounded-lg">
                  <img 
                    src={config.imagemLogin} 
                    alt="Imagem de login" 
                    className="max-h-32 w-auto object-contain opacity-30"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => loginInputRef.current?.click()}
                    disabled={uploadingLogin}
                  >
                    <UploadSimple className="mr-2 h-4 w-4" />
                    Alterar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleRemoveLoginImage}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-center p-8 border-2 border-dashed rounded-lg">
                  <div className="text-center">
                    <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Nenhuma imagem selecionada
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => loginInputRef.current?.click()}
                  disabled={uploadingLogin}
                >
                  <UploadSimple className="mr-2 h-4 w-4" />
                  {uploadingLogin ? 'Enviando...' : 'Selecionar Imagem'}
                </Button>
              </div>
            )}
            <input
              ref={loginInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLoginImageUpload}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Hook para usar as configurações em outros componentes
export function useConfigSistema() {
  const [config] = useFirebaseKV<ConfiguracoesSistemaData>("configuracoes-sistema", {})
  return config
}
