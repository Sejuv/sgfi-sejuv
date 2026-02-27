import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FloatingWindow } from '@/components/FloatingWindow'
import { Creditor } from '@/lib/types'
import { creditorsApi } from '@/lib/api'
import { toast } from 'sonner'

interface CreditorFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingCreditor: Creditor | null
  onSaved: (creditor: Creditor, isEdit: boolean) => void
}

export function CreditorFormDialog({
  open,
  onOpenChange,
  editingCreditor,
  onSaved,
}: CreditorFormDialogProps) {
  const [name, setName]               = useState('')
  const [doc, setDoc]                 = useState('')
  const [contact, setContact]         = useState('')
  const [email, setEmail]             = useState('')
  const [cep, setCep]                 = useState('')
  const [street, setStreet]           = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [city, setCity]               = useState('')
  const [uf, setUf]                   = useState('')

  useEffect(() => {
    if (editingCreditor) {
      setName(editingCreditor.name)
      setDoc(editingCreditor.documentNumber || '')
      setContact(editingCreditor.contact || '')
      setEmail(editingCreditor.email || '')
      setCep(editingCreditor.cep || '')
      setStreet(editingCreditor.street || '')
      setNeighborhood(editingCreditor.neighborhood || '')
      setCity(editingCreditor.city || '')
      setUf(editingCreditor.uf || '')
    } else {
      resetForm()
    }
  }, [editingCreditor, open])

  const resetForm = () => {
    setName(''); setDoc(''); setContact(''); setEmail('')
    setCep(''); setStreet(''); setNeighborhood(''); setCity(''); setUf('')
  }

  const handleClose = () => {
    resetForm()
    onOpenChange(false)
  }

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Nome é obrigatório'); return }

    const data: Creditor = {
      id: editingCreditor ? editingCreditor.id : `creditor_${Date.now()}`,
      name,
      documentNumber: doc,
      contact,
      email,
      cep,
      street,
      neighborhood,
      city,
      uf,
    }

    try {
      if (editingCreditor) {
        const saved = await creditorsApi.update(data.id, data)
        toast.success('Credor atualizado!')
        onSaved(saved, true)
      } else {
        const saved = await creditorsApi.create(data)
        toast.success('Credor cadastrado!')
        onSaved(saved, false)
      }
      handleClose()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  return (
    <FloatingWindow
      open={open}
      onOpenChange={(v) => { if (!v) handleClose(); else onOpenChange(true) }}
      title={editingCreditor ? 'Editar Credor' : 'Novo Credor'}
      description="Cadastre ou edite um fornecedor / prestador de serviço"
    >
      <div className="h-full flex flex-col">
        <div className="flex-1 overflow-auto space-y-4 pr-1">
          {/* Dados principais */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="creditor-name">Nome / Razão Social <span className="text-destructive">*</span></Label>
              <Input
                id="creditor-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Empresa XYZ Ltda"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="creditor-doc">CNPJ / CPF</Label>
              <Input
                id="creditor-doc"
                value={doc}
                onChange={(e) => setDoc(e.target.value)}
                placeholder="00.000.000/0000-00"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="creditor-contact">Telefone</Label>
              <Input
                id="creditor-contact"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="creditor-email">E-mail</Label>
              <Input
                id="creditor-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contato@empresa.com"
              />
            </div>
          </div>

          {/* Endereço */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Endereço</p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="creditor-cep">CEP</Label>
                <Input
                  id="creditor-cep"
                  value={cep}
                  onChange={(e) => setCep(e.target.value)}
                  placeholder="00000-000"
                />
              </div>
              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="creditor-street">Logradouro (Rua / Av.)</Label>
                <Input
                  id="creditor-street"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Ex: Rua das Flores, 123"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="creditor-neighborhood">Bairro</Label>
                <Input
                  id="creditor-neighborhood"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="Ex: Centro"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="creditor-city">Cidade</Label>
                <Input
                  id="creditor-city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ex: São Paulo"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="creditor-uf">UF</Label>
                <Input
                  id="creditor-uf"
                  value={uf}
                  onChange={(e) => setUf(e.target.value)}
                  placeholder="SP"
                  maxLength={2}
                  className="uppercase"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-6 border-t mt-6">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            {editingCreditor ? 'Salvar Alterações' : 'Cadastrar'}
          </Button>
        </div>
      </div>
    </FloatingWindow>
  )
}
