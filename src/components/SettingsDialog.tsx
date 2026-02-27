import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FloatingWindow } from '@/components/FloatingWindow'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useLocalStorage } from '@/hooks/use-local-storage'
import { User as UserType, UserRole } from '@/lib/types'
import { SystemEntity } from '@/lib/config-types'
import { entitiesApi, usersApi } from '@/lib/api'
import { Users, Buildings, Plus, Trash, PencilSimple, UploadSimple, User } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [users, setUsers] = useState<UserType[]>([])
  const [entities, setEntities] = useState<SystemEntity[]>([])
  const [loginBackground, setLoginBackground] = useLocalStorage<string>('login-background', '')
  const [loginLogo, setLoginLogo] = useLocalStorage<string>('login-logo', '')
  const [loginCardBgColor, setLoginCardBgColor] = useLocalStorage<string>('login-card-bg', '#ffffff')
  const [loginCardTextColor, setLoginCardTextColor] = useLocalStorage<string>('login-card-text', '#1a1a1a')
  const [loginButtonBgColor, setLoginButtonBgColor] = useLocalStorage<string>('login-button-bg', '#4c4faf')
  const [loginButtonTextColor, setLoginButtonTextColor] = useLocalStorage<string>('login-button-text', '#ffffff')
  const [loginBackgroundOverlay, setLoginBackgroundOverlay] = useLocalStorage<string>('login-bg-overlay', 'dark')

  // Carrega entidades e usuários do banco quando o dialog abre
  useEffect(() => {
    if (!open) return
    entitiesApi.list().then(setEntities).catch(() => {})
    usersApi.list().then((data) => setUsers(data as unknown as UserType[])).catch(() => {})
  }, [open])

  const [editingUser, setEditingUser] = useState<Partial<UserType> | null>(null)
  const [editingEntity, setEditingEntity] = useState<Partial<SystemEntity> | null>(null)
  const [entityLogoPreview, setEntityLogoPreview] = useState<string>('')
  const [entityBrasaoPreview, setEntityBrasaoPreview] = useState<string>('')
  const [backgroundPreview, setBackgroundPreview] = useState<string>('')
  const [logoPreview, setLogoPreview] = useState<string>('')

  const handleSaveUser = async () => {
    if (!editingUser?.name || !editingUser?.email) {
      toast.error('Preencha os campos obrigatórios')
      return
    }
    try {
      if (editingUser.id) {
        await usersApi.update(editingUser.id, {
          name: editingUser.name!,
          email: editingUser.email!,
          password: editingUser.password,
          role: (editingUser.role as string) || 'viewer',
        })
        setUsers((current) =>
          (current || []).map((u) =>
            u.id === editingUser.id ? { ...u, ...editingUser } as UserType : u
          )
        )
        toast.success('Usuário atualizado!')
      } else {
        await usersApi.create({
          name: editingUser.name!,
          email: editingUser.email!,
          password: editingUser.password || 'senha123',
          role: (editingUser.role as string) || 'viewer',
        })
        // Recarrega lista atualizada do servidor
        const updated = await usersApi.list()
        setUsers(updated as unknown as UserType[])
        toast.success('Usuário criado!')
      }
    } catch (e: any) {
      toast.error(e.message || 'Erro ao salvar usuário')
    }
    setEditingUser(null)
  }

  const handleDeleteUser = async (id: string) => {
    if ((users || []).length <= 1) {
      toast.error('Não é possível excluir o último usuário')
      return
    }
    try {
      await usersApi.remove(id)
      setUsers((current) => (current || []).filter((u) => u.id !== id))
      toast.success('Usuário excluído')
    } catch (e: any) {
      toast.error(e.message || 'Erro ao excluir usuário')
    }
  }

  const handleBackgroundUpload = (file: File) => {
    if (!file.type.match(/image\/(png|jpeg|jpg)/)) {
      toast.error('Apenas arquivos PNG ou JPEG são permitidos')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('O arquivo deve ter no máximo 10MB')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      setBackgroundPreview(base64String)
      setLoginBackground(base64String)
      toast.success('Imagem de fundo carregada!')
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveBackground = () => {
    setLoginBackground('')
    setBackgroundPreview('')
    toast.success('Imagem de fundo removida')
  }

  const handleLogoUpload = (file: File) => {
    if (!file.type.match(/image\/(png|jpeg|jpg)/)) {
      toast.error('Apenas arquivos PNG ou JPEG são permitidos')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('O arquivo deve ter no máximo 5MB')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      setLogoPreview(base64String)
      setLoginLogo(base64String)
      toast.success('Logo carregada!')
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveLogo = () => {
    setLoginLogo('')
    setLogoPreview('')
    toast.success('Logo removida')
  }

  const handleResetColors = () => {
    setLoginCardBgColor('#ffffff')
    setLoginCardTextColor('#1a1a1a')
    setLoginButtonBgColor('#4c4faf')
    setLoginButtonTextColor('#ffffff')
    setLoginBackgroundOverlay('dark')
    toast.success('Cores restauradas para padrão')
  }

  const handleImageUpload = (file: File, type: 'logo' | 'brasao') => {
    if (!file.type.match(/image\/(png|jpeg|jpg|webp|svg\+xml)/)) {
      toast.error('Apenas arquivos PNG, JPEG, WEBP ou SVG são permitidos')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('O arquivo deve ter no máximo 10MB')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const originalBase64 = reader.result as string

      // Comprime e redimensiona via canvas para caber no Firestore (limite 1MB/doc)
      const img = new Image()
      img.onload = () => {
        const MAX_SIZE = 256
        let { width, height } = img
        if (width > MAX_SIZE || height > MAX_SIZE) {
          if (width > height) { height = Math.round((height * MAX_SIZE) / width); width = MAX_SIZE }
          else { width = Math.round((width * MAX_SIZE) / height); height = MAX_SIZE }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, width, height)
        const compressed = canvas.toDataURL('image/jpeg', 0.8)

        if (type === 'logo') {
          setEntityLogoPreview(compressed)
          setEditingEntity((current) => ({ ...current, logoUrl: compressed }))
        } else {
          setEntityBrasaoPreview(compressed)
          setEditingEntity((current) => ({ ...current, brasaoUrl: compressed }))
        }
        toast.success(`${type === 'logo' ? 'Logo' : 'Brasão'} carregado!`)
      }
      img.src = originalBase64
    }
    reader.readAsDataURL(file)
  }

  const handleSaveEntity = async () => {
    if (!editingEntity?.name || !editingEntity?.fullName) {
      toast.error('Preencha os campos obrigatórios')
      return
    }
    try {
      if (editingEntity.id) {
        const saved = await entitiesApi.update(editingEntity.id, {
          name: editingEntity.name!,
          fullName: editingEntity.fullName!,
          documentNumber: editingEntity.documentNumber,
          address: editingEntity.address,
          phone: editingEntity.phone,
          email: editingEntity.email,
          website: editingEntity.website,
          logoUrl: editingEntity.logoUrl,
          brasaoUrl: editingEntity.brasaoUrl,
        })
        setEntities((current) =>
          (current || []).map((e) => (e.id === saved.id ? saved : e))
        )
        toast.success('Entidade atualizada!')
      } else {
        if ((entities || []).length >= 1) {
          toast.error('Já existe uma entidade cadastrada. O sistema permite apenas uma.')
          return
        }
        const saved = await entitiesApi.create({
          name: editingEntity.name!,
          fullName: editingEntity.fullName!,
          documentNumber: editingEntity.documentNumber,
          address: editingEntity.address,
          phone: editingEntity.phone,
          email: editingEntity.email,
          website: editingEntity.website,
          logoUrl: editingEntity.logoUrl,
          brasaoUrl: editingEntity.brasaoUrl,
        })
        setEntities([saved])
        toast.success('Entidade cadastrada com sucesso!')
      }
    } catch (e: any) {
      toast.error(e.message || 'Erro ao salvar entidade')
    }
    setEditingEntity(null)
    setEntityLogoPreview('')
    setEntityBrasaoPreview('')
  }

  const handleDeleteEntity = async (id: string) => {
    try {
      await entitiesApi.remove(id)
      setEntities((current) => (current || []).filter((e) => e.id !== id))
      toast.success('Entidade excluída')
    } catch (e: any) {
      toast.error(e.message || 'Erro ao excluir entidade')
    }
  }

  const getRoleLabel = (role: UserRole) => {
    const labels = {
      admin: 'Administrador',
      finance_manager: 'Gestor Financeiro',
      viewer: 'Visualizador',
    }
    return labels[role]
  }

  return (
    <FloatingWindow
      open={open}
      onOpenChange={onOpenChange}
      title="Configurações do Sistema"
      description="Gerencie usuários, entidades e personalize o sistema"
    >
      <div className="h-full flex flex-col">
        <Tabs defaultValue="users" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users" className="gap-2">
              <Users size={16} />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="entities" className="gap-2">
              <Buildings size={16} />
              Entidades
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2">
              <PencilSimple size={16} />
              Aparência
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4">
            <TabsContent value="users" className="m-0">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Gerenciar Usuários</CardTitle>
                      <CardDescription>Controle de acesso e permissões</CardDescription>
                    </div>
                    <Button onClick={() => setEditingUser({ role: 'viewer' })}>
                      <Plus className="mr-2" size={18} weight="bold" />
                      Novo Usuário
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {editingUser && (
                    <Card className="mb-4 border-primary">
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {editingUser.id ? 'Editar Usuário' : 'Novo Usuário'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="user-name">Nome Completo *</Label>
                          <Input
                            id="user-name"
                            value={editingUser.name || ''}
                            onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                            placeholder="Ex: João Silva"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="user-email">Email *</Label>
                          <Input
                            id="user-email"
                            type="email"
                            value={editingUser.email || ''}
                            onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                            placeholder="usuario@email.com"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="user-password">
                            Senha {editingUser.id ? '(deixe em branco para manter)' : '*'}
                          </Label>
                          <Input
                            id="user-password"
                            type="password"
                            value={editingUser.password || ''}
                            onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                            placeholder="••••••••"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="user-role">Nível de Acesso *</Label>
                          <Select
                            value={editingUser.role}
                            onValueChange={(value) => setEditingUser({ ...editingUser, role: value as UserRole })}
                          >
                            <SelectTrigger id="user-role">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Administrador</SelectItem>
                              <SelectItem value="finance_manager">Gestor Financeiro</SelectItem>
                              <SelectItem value="viewer">Visualizador</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={handleSaveUser}>Salvar</Button>
                          <Button variant="outline" onClick={() => setEditingUser(null)}>
                            Cancelar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Nível</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(users || []).map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                                {getRoleLabel(user.role)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingUser(user)}
                                >
                                  <PencilSimple size={16} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteUser(user.id)}
                                >
                                  <Trash size={16} />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="entities" className="m-0">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Cadastro da Entidade</CardTitle>
                      <CardDescription>
                        Configure a entidade principal do sistema (permitido apenas uma)
                      </CardDescription>
                    </div>
                    {(entities || []).length === 0 && (
                      <Button onClick={() => setEditingEntity({})}>
                        <Plus className="mr-2" size={18} weight="bold" />
                        Cadastrar Entidade
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {editingEntity && (
                    <Card className="mb-4 border-primary">
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {editingEntity.id ? 'Editar Entidade' : 'Nova Entidade'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="entity-name">Nome Curto *</Label>
                          <Input
                            id="entity-name"
                            value={editingEntity.name || ''}
                            onChange={(e) => setEditingEntity({ ...editingEntity, name: e.target.value })}
                            placeholder="Ex: SEFI"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="entity-fullname">Nome Completo *</Label>
                          <Input
                            id="entity-fullname"
                            value={editingEntity.fullName || ''}
                            onChange={(e) => setEditingEntity({ ...editingEntity, fullName: e.target.value })}
                            placeholder="Ex: Secretaria de Finanças"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="entity-doc">CNPJ</Label>
                          <Input
                            id="entity-doc"
                            value={editingEntity.documentNumber || ''}
                            onChange={(e) => setEditingEntity({ ...editingEntity, documentNumber: e.target.value })}
                            placeholder="00.000.000/0000-00"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="entity-address">Endereço</Label>
                          <Input
                            id="entity-address"
                            value={editingEntity.address || ''}
                            onChange={(e) => setEditingEntity({ ...editingEntity, address: e.target.value })}
                            placeholder="Rua, número, bairro, cidade"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="entity-phone">Telefone</Label>
                            <Input
                              id="entity-phone"
                              value={editingEntity.phone || ''}
                              onChange={(e) => setEditingEntity({ ...editingEntity, phone: e.target.value })}
                              placeholder="(00) 0000-0000"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="entity-email">Email</Label>
                            <Input
                              id="entity-email"
                              type="email"
                              value={editingEntity.email || ''}
                              onChange={(e) => setEditingEntity({ ...editingEntity, email: e.target.value })}
                              placeholder="contato@entidade.com"
                            />
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="entity-website">Website</Label>
                          <Input
                            id="entity-website"
                            value={editingEntity.website || ''}
                            onChange={(e) => setEditingEntity({ ...editingEntity, website: e.target.value })}
                            placeholder="https://www.entidade.com"
                          />
                        </div>
                        
                        <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
                          <div className="space-y-3">
                            <Label htmlFor="entity-logo">Logo (PNG ou JPEG)</Label>
                            <div className="flex gap-2">
                              <Input
                                id="entity-logo"
                                type="file"
                                accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) handleImageUpload(file, 'logo')
                                }}
                                className="cursor-pointer"
                              />
                            </div>
                            {(entityLogoPreview || editingEntity.logoUrl) && (
                              <div className="border rounded-lg p-4 flex items-center justify-center bg-muted/20">
                                <img
                                  src={entityLogoPreview || editingEntity.logoUrl}
                                  alt="Logo Preview"
                                  className="max-h-32 object-contain"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none'
                                  }}
                                />
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-3">
                            <Label htmlFor="entity-brasao">Brasão (PNG ou JPEG)</Label>
                            <div className="flex gap-2">
                              <Input
                                id="entity-brasao"
                                type="file"
                                accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) handleImageUpload(file, 'brasao')
                                }}
                                className="cursor-pointer"
                              />
                            </div>
                            {(entityBrasaoPreview || editingEntity.brasaoUrl) && (
                              <div className="border rounded-lg p-4 flex items-center justify-center bg-muted/20">
                                <img
                                  src={entityBrasaoPreview || editingEntity.brasaoUrl}
                                  alt="Brasão Preview"
                                  className="max-h-32 object-contain"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none'
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                          <p className="flex items-center gap-2">
                            <UploadSimple size={16} weight="bold" />
                            <span>Selecione arquivos PNG ou JPEG de até 5MB. As imagens serão armazenadas diretamente no sistema.</span>
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={handleSaveEntity}>Salvar</Button>
                          <Button variant="outline" onClick={() => setEditingEntity(null)}>
                            Cancelar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="grid gap-4">
                    {(entities || []).map((entity) => (
                      <Card key={entity.id} className="border-2 border-primary/20">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <CardTitle className="text-lg">{entity.name}</CardTitle>
                                <Badge variant="default" className="text-xs">Principal</Badge>
                              </div>
                              <CardDescription className="mt-1">{entity.fullName}</CardDescription>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingEntity(entity)
                                setEntityLogoPreview(entity.logoUrl || '')
                                setEntityBrasaoPreview(entity.brasaoUrl || '')
                              }}
                            >
                              <PencilSimple size={16} />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="text-sm space-y-2 bg-muted/30 rounded-lg p-4">
                            {entity.documentNumber && (
                              <div className="flex gap-2">
                                <span className="font-semibold min-w-[80px]">CNPJ:</span>
                                <span>{entity.documentNumber}</span>
                              </div>
                            )}
                            {entity.address && (
                              <div className="flex gap-2">
                                <span className="font-semibold min-w-[80px]">Endereço:</span>
                                <span>{entity.address}</span>
                              </div>
                            )}
                            {entity.phone && (
                              <div className="flex gap-2">
                                <span className="font-semibold min-w-[80px]">Telefone:</span>
                                <span>{entity.phone}</span>
                              </div>
                            )}
                            {entity.email && (
                              <div className="flex gap-2">
                                <span className="font-semibold min-w-[80px]">Email:</span>
                                <span>{entity.email}</span>
                              </div>
                            )}
                            {entity.website && (
                              <div className="flex gap-2">
                                <span className="font-semibold min-w-[80px]">Website:</span>
                                <span className="text-primary underline">{entity.website}</span>
                              </div>
                            )}
                          </div>
                          
                          {(entity.logoUrl || entity.brasaoUrl) && (
                            <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
                              {entity.logoUrl && (
                                <div className="space-y-2">
                                  <Label className="text-xs text-muted-foreground">Logo</Label>
                                  <div className="border rounded-lg p-4 flex items-center justify-center bg-background">
                                    <img
                                      src={entity.logoUrl}
                                      alt="Logo da Entidade"
                                      className="max-h-24 object-contain"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none'
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                              {entity.brasaoUrl && (
                                <div className="space-y-2">
                                  <Label className="text-xs text-muted-foreground">Brasão</Label>
                                  <div className="border rounded-lg p-4 flex items-center justify-center bg-background">
                                    <img
                                      src={entity.brasaoUrl}
                                      alt="Brasão da Entidade"
                                      className="max-h-24 object-contain"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none'
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {(entities || []).length === 0 && !editingEntity && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Buildings size={64} className="mx-auto mb-4 opacity-30" />
                      <p className="text-lg font-semibold mb-2">Nenhuma entidade cadastrada</p>
                      <p className="text-sm mb-6">
                        Cadastre a entidade principal do sistema para aparecer nos relatórios.
                      </p>
                      <Button onClick={() => setEditingEntity({})} size="lg">
                        <Plus className="mr-2" size={20} weight="bold" />
                        Cadastrar Entidade
                      </Button>
                    </div>
                  )}
                  
                  {(entities || []).length > 0 && (
                    <div className="mt-4 p-4 bg-accent/10 border border-accent/30 rounded-lg">
                      <p className="text-sm text-accent-foreground">
                        <strong>ℹ️ Informação:</strong> O sistema permite apenas uma entidade principal. 
                        Todos os dados e relatórios serão vinculados a esta entidade. Para alterar, edite os dados acima.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="appearance" className="m-0">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Personalização da Tela de Login</CardTitle>
                        <CardDescription>
                          Configure imagens, cores e estilo da tela de autenticação
                        </CardDescription>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleResetColors}>
                        Restaurar Padrão
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-semibold mb-3">Logo da Tela de Login</h3>
                        <div className="space-y-3">
                          <Input
                            id="login-logo"
                            type="file"
                            accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleLogoUpload(file)
                            }}
                            className="cursor-pointer"
                          />
                          <p className="text-xs text-muted-foreground">
                            Substitui o ícone padrão. Recomendado: logo quadrada, 200x200px. Máximo 5MB.
                          </p>
                          {(logoPreview || loginLogo) && (
                            <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/20">
                              <img
                                src={logoPreview || loginLogo}
                                alt="Logo Preview"
                                className="h-16 w-16 object-contain rounded-lg bg-white"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleRemoveLogo}
                              >
                                <Trash size={16} className="mr-2" />
                                Remover
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-4 border-t">
                        <h3 className="text-sm font-semibold mb-3">Imagem de Fundo</h3>
                        <div className="space-y-3">
                          <Input
                            id="login-background"
                            type="file"
                            accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleBackgroundUpload(file)
                            }}
                            className="cursor-pointer"
                          />
                          <p className="text-xs text-muted-foreground">
                            Tamanho recomendado: 1920x1080px ou superior. Máximo 10MB.
                          </p>
                          
                          {(backgroundPreview || loginBackground) && (
                            <>
                              <div className="space-y-2">
                                <Label htmlFor="overlay-style">Sobreposição da Imagem</Label>
                                <Select
                                  value={loginBackgroundOverlay}
                                  onValueChange={setLoginBackgroundOverlay}
                                >
                                  <SelectTrigger id="overlay-style">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">Sem Sobreposição</SelectItem>
                                    <SelectItem value="light">Clara (para fundos escuros)</SelectItem>
                                    <SelectItem value="dark">Escura (para fundos claros)</SelectItem>
                                    <SelectItem value="gradient">Gradiente</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleRemoveBackground}
                                className="w-full"
                              >
                                <Trash className="mr-2" size={16} />
                                Remover Imagem de Fundo
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="pt-4 border-t">
                        <h3 className="text-sm font-semibold mb-3">Cores do Card de Login</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="card-bg-color">Fundo do Card</Label>
                            <div className="flex gap-2">
                              <Input
                                id="card-bg-color"
                                type="color"
                                value={loginCardBgColor}
                                onChange={(e) => setLoginCardBgColor(e.target.value)}
                                className="w-16 h-10 cursor-pointer"
                              />
                              <Input
                                type="text"
                                value={loginCardBgColor}
                                onChange={(e) => setLoginCardBgColor(e.target.value)}
                                placeholder="#ffffff"
                                className="flex-1"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="card-text-color">Texto do Card</Label>
                            <div className="flex gap-2">
                              <Input
                                id="card-text-color"
                                type="color"
                                value={loginCardTextColor}
                                onChange={(e) => setLoginCardTextColor(e.target.value)}
                                className="w-16 h-10 cursor-pointer"
                              />
                              <Input
                                type="text"
                                value={loginCardTextColor}
                                onChange={(e) => setLoginCardTextColor(e.target.value)}
                                placeholder="#1a1a1a"
                                className="flex-1"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t">
                        <h3 className="text-sm font-semibold mb-3">Cores do Botão</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="button-bg-color">Fundo do Botão</Label>
                            <div className="flex gap-2">
                              <Input
                                id="button-bg-color"
                                type="color"
                                value={loginButtonBgColor}
                                onChange={(e) => setLoginButtonBgColor(e.target.value)}
                                className="w-16 h-10 cursor-pointer"
                              />
                              <Input
                                type="text"
                                value={loginButtonBgColor}
                                onChange={(e) => setLoginButtonBgColor(e.target.value)}
                                placeholder="#4c4faf"
                                className="flex-1"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="button-text-color">Texto do Botão</Label>
                            <div className="flex gap-2">
                              <Input
                                id="button-text-color"
                                type="color"
                                value={loginButtonTextColor}
                                onChange={(e) => setLoginButtonTextColor(e.target.value)}
                                className="w-16 h-10 cursor-pointer"
                              />
                              <Input
                                type="text"
                                value={loginButtonTextColor}
                                onChange={(e) => setLoginButtonTextColor(e.target.value)}
                                placeholder="#ffffff"
                                className="flex-1"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Pré-visualização</CardTitle>
                    <CardDescription>Veja como ficará a tela de login</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div 
                      className="relative border rounded-lg overflow-hidden bg-muted/20 min-h-[400px] flex items-center justify-center"
                      style={
                        (backgroundPreview || loginBackground)
                          ? {
                              backgroundImage: `url(${backgroundPreview || loginBackground})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                            }
                          : { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }
                      }
                    >
                      {(backgroundPreview || loginBackground) && (
                        <div 
                          className={`absolute inset-0 ${
                            loginBackgroundOverlay === 'light' 
                              ? 'bg-white/40'
                              : loginBackgroundOverlay === 'dark'
                              ? 'bg-black/40'
                              : loginBackgroundOverlay === 'gradient'
                              ? 'bg-gradient-to-br from-black/40 via-black/20 to-black/40'
                              : ''
                          }`}
                        />
                      )}
                      <div 
                        className="relative z-10 w-96 max-w-[90%] rounded-lg shadow-2xl p-8 backdrop-blur-sm"
                        style={{
                          backgroundColor: loginCardBgColor,
                          color: loginCardTextColor,
                        }}
                      >
                        <div className="flex flex-col items-center mb-6">
                          {(logoPreview || loginLogo) ? (
                            <img
                              src={logoPreview || loginLogo}
                              alt="Logo"
                              className="w-16 h-16 object-contain mb-4"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          ) : (
                            <div 
                              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                              style={{ backgroundColor: loginButtonBgColor }}
                            >
                              <User size={32} weight="bold" style={{ color: loginButtonTextColor }} />
                            </div>
                          )}
                          <h2 className="text-xl font-bold font-display">Bem-vindo ao SGFI</h2>
                          <p className="text-sm opacity-70 mt-1">Entre com suas credenciais</p>
                        </div>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Email</label>
                            <div className="h-10 px-3 rounded-md border flex items-center text-sm opacity-60">
                              seu@email.com
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Senha</label>
                            <div className="h-10 px-3 rounded-md border flex items-center text-sm opacity-60">
                              ••••••••
                            </div>
                          </div>
                          <button
                            className="w-full h-10 rounded-md font-medium transition-opacity hover:opacity-90"
                            style={{
                              backgroundColor: loginButtonBgColor,
                              color: loginButtonTextColor,
                            }}
                          >
                            Entrar
                          </button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="rounded-lg bg-accent/10 border border-accent/30 p-4 text-sm">
                  <p className="font-semibold text-accent-foreground mb-2">💡 Dicas de Personalização</p>
                  <ul className="text-muted-foreground text-xs space-y-1 list-disc list-inside">
                    <li>Use cores contrastantes para garantir legibilidade</li>
                    <li>Imagens de fundo devem ter boa iluminação e não competir com o card</li>
                    <li>A sobreposição escura funciona melhor com fundos claros e vice-versa</li>
                    <li>Teste a combinação de cores na pré-visualização antes de salvar</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </FloatingWindow>
  )
}
