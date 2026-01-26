import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { useKV } from "@/hooks/useKV"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Recurso, Secretaria } from "@/lib/cadastros-types"

interface RecursoFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recurso?: Recurso
  onSave: (data: Omit<Recurso, "id"> & { id?: string }) => void
  recursosExistentes: Recurso[]
}

export function RecursoForm({ open, onOpenChange, recurso, onSave, recursosExistentes }: RecursoFormProps) {
  const [secretarias] = useKV<Secretaria[]>("cadastro-secretarias", [])
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch, setError, clearErrors } = useForm<Omit<Recurso, "id"> & { id?: string }>({
    defaultValues: { nome: "", secretariaId: "", ativo: true },
  })

  useEffect(() => {
    if (recurso) {
      setValue("id", recurso.id)
      setValue("nome", recurso.nome)
      setValue("secretariaId", recurso.secretariaId)
      setValue("ativo", recurso.ativo)
    } else {
      reset({ nome: "", secretariaId: "", ativo: true })
    }
  }, [recurso, setValue, reset])

  useEffect(() => {
    console.log('Secretarias carregadas no RecursoForm:', secretarias)
  }, [secretarias])

  const ativo = watch("ativo", recurso?.ativo ?? true)
  const secretariaId = watch("secretariaId", recurso?.secretariaId ?? "")

  const secretariasAtivas = (secretarias || []).filter((s) => s.ativo)
  console.log('Secretarias ativas:', secretariasAtivas)

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
    
    if (!data.secretariaId) {
      setError("secretariaId", {
        type: "manual",
        message: "Secretaria é obrigatória",
      })
      return
    }
    
    onSave(data)
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
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

          <div className="space-y-2">
            <Label htmlFor="secretariaId">Secretaria *</Label>
            <Select
              value={secretariaId}
              onValueChange={(value) => {
                setValue("secretariaId", value)
                clearErrors("secretariaId")
              }}
            >
              <SelectTrigger id="secretariaId">
                <SelectValue placeholder="Selecione uma secretaria" />
              </SelectTrigger>
              <SelectContent>
                {secretariasAtivas.map((secretaria) => (
                  <SelectItem key={secretaria.id} value={secretaria.id}>
                    {secretaria.sigla} - {secretaria.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.secretariaId && <p className="text-sm text-destructive">{errors.secretariaId.message}</p>}
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
