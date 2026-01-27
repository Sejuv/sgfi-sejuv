import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Secretaria } from "@/lib/cadastros-types"

interface SecretariaFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  secretaria?: Secretaria
  onSave: (data: Omit<Secretaria, "id"> & { id?: string }) => void
  secretariasExistentes: Secretaria[]
}

export function SecretariaForm({ open, onOpenChange, secretaria, onSave, secretariasExistentes }: SecretariaFormProps) {
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch, setError } = useForm<Omit<Secretaria, "id"> & { id?: string }>({
    defaultValues: { nome: "", sigla: "", responsavel: "", ativo: true },
  })

  useEffect(() => {
    if (secretaria) {
      setValue("id", secretaria.id)
      setValue("nome", secretaria.nome)
      setValue("sigla", secretaria.sigla)
      setValue("responsavel", secretaria.responsavel || "")
      setValue("ativo", secretaria.ativo)
    } else {
      reset({ nome: "", sigla: "", responsavel: "", ativo: true })
    }
  }, [secretaria, setValue, reset])

  const ativo = watch("ativo", secretaria?.ativo ?? true)

  const onSubmit = (data: Omit<Secretaria, "id"> & { id?: string }) => {
    const nomeNormalizado = data.nome.trim().toLowerCase()
    const siglaNormalizada = data.sigla.trim().toLowerCase()
    
    const duplicadoNome = secretariasExistentes.find(
      (s) => s.nome.trim().toLowerCase() === nomeNormalizado && s.id !== data.id
    )
    
    if (duplicadoNome) {
      setError("nome", {
        type: "manual",
        message: "Já existe uma secretaria com este nome",
      })
      return
    }
    
    const duplicadoSigla = secretariasExistentes.find(
      (s) => s.sigla.trim().toLowerCase() === siglaNormalizada && s.id !== data.id
    )
    
    if (duplicadoSigla) {
      setError("sigla", {
        type: "manual",
        message: "Já existe uma secretaria com esta sigla",
      })
      return
    }
    
    onSave(data)
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{secretaria ? "Editar Secretaria" : "Nova Secretaria"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register("id")} value={secretaria?.id} />
          
          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              {...register("nome", { required: "Nome é obrigatório" })}
            />
            {errors.nome && <p className="text-sm text-destructive">{errors.nome.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="sigla">Sigla *</Label>
            <Input
              id="sigla"
              {...register("sigla", { required: "Sigla é obrigatória" })}
              maxLength={10}
            />
            {errors.sigla && <p className="text-sm text-destructive">{errors.sigla.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="responsavel">Responsável</Label>
            <Input
              id="responsavel"
              {...register("responsavel")}
            />
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
