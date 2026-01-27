import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Recurso } from "@/lib/cadastros-types"

interface RecursoFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recurso?: Recurso
  onSave: (data: Omit<Recurso, "id"> & { id?: string }) => void
  recursosExistentes: Recurso[]
}

export function RecursoForm({ open, onOpenChange, recurso, onSave, recursosExistentes }: RecursoFormProps) {
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch, setError } = useForm<Omit<Recurso, "id"> & { id?: string }>({
    defaultValues: { nome: "", ativo: true },
  })

  useEffect(() => {
    if (recurso) {
      setValue("id", recurso.id)
      setValue("nome", recurso.nome)
      setValue("ativo", recurso.ativo)
    } else {
      reset({ nome: "", ativo: true })
    }
  }, [recurso, setValue, reset])

  const ativo = watch("ativo", recurso?.ativo ?? true)

  const onSubmit = (data: Omit<Recurso, "id"> & { id?: string }) => {
    const nomeNormalizado = data.nome.trim().toLowerCase()
    
    const duplicado = recursosExistentes.find(
      (r) => r.nome.trim().toLowerCase() === nomeNormalizado && r.id !== data.id
    )
    
    if (duplicado) {
      setError("nome", {
        type: "manual",
        message: "Já existe um recurso com este nome",
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
          <DialogTitle>{recurso ? "Editar Recurso" : "Novo Recurso"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register("id")} value={recurso?.id} />
          
          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              {...register("nome", { required: "Nome é obrigatório" })}
            />
            {errors.nome && <p className="text-sm text-destructive">{errors.nome.message}</p>}
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
