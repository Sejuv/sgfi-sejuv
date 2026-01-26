import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Credor } from "@/lib/cadastros-types"

interface CredorFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  credor?: Credor
  onSave: (data: Omit<Credor, "id"> & { id?: string }) => void
  credoresExistentes: Credor[]
}

export function CredorForm({ open, onOpenChange, credor, onSave, credoresExistentes }: CredorFormProps) {
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch, setError } = useForm<Omit<Credor, "id"> & { id?: string }>({
    defaultValues: { nome: "", cpfCnpj: "", tipo: "Pessoa Jurídica", ativo: true },
  })

  useEffect(() => {
    if (credor) {
      setValue("id", credor.id)
      setValue("nome", credor.nome)
      setValue("cpfCnpj", credor.cpfCnpj)
      setValue("tipo", credor.tipo)
      setValue("telefone", credor.telefone || "")
      setValue("email", credor.email || "")
      setValue("endereco", credor.endereco || "")
      setValue("ativo", credor.ativo)
    } else {
      reset({ nome: "", cpfCnpj: "", tipo: "Pessoa Jurídica", ativo: true })
    }
  }, [credor, setValue, reset])

  const ativo = watch("ativo", credor?.ativo ?? true)
  const tipo = watch("tipo", credor?.tipo ?? "Pessoa Jurídica")

  const onSubmit = (data: Omit<Credor, "id"> & { id?: string }) => {
    const cpfCnpjLimpo = data.cpfCnpj.replace(/\D/g, '')
    
    const duplicadoCpfCnpj = credoresExistentes.find(
      (c) => c.cpfCnpj.replace(/\D/g, '') === cpfCnpjLimpo && c.id !== data.id
    )
    
    if (duplicadoCpfCnpj) {
      setError("cpfCnpj", {
        type: "manual",
        message: "Já existe um credor com este CPF/CNPJ",
      })
      return
    }
    
    onSave(data)
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{credor ? "Editar Credor" : "Novo Credor"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register("id")} value={credor?.id} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="nome">Nome / Razão Social *</Label>
              <Input
                id="nome"
                {...register("nome", { required: "Nome é obrigatório" })}
              />
              {errors.nome && <p className="text-sm text-destructive">{errors.nome.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo *</Label>
              <Select value={tipo} onValueChange={(value) => setValue("tipo", value as Credor["tipo"])}>
                <SelectTrigger id="tipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pessoa Física">Pessoa Física</SelectItem>
                  <SelectItem value="Pessoa Jurídica">Pessoa Jurídica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpfCnpj">CPF / CNPJ *</Label>
              <Input
                id="cpfCnpj"
                {...register("cpfCnpj", { required: "CPF/CNPJ é obrigatório" })}
              />
              {errors.cpfCnpj && <p className="text-sm text-destructive">{errors.cpfCnpj.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                {...register("telefone")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Textarea
                id="endereco"
                {...register("endereco")}
                rows={2}
              />
            </div>
          </div>

          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="ativo" className="cursor-pointer">Ativo</Label>
            <Switch
              id="ativo"
              checked={ativo}
              onCheckedChange={(checked) => setValue("ativo", checked)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
