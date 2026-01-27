import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Objeto } from "@/lib/cadastros-types"

interface ObjetoFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  objeto?: Objeto
  onSave: (data: Omit<Objeto, "id"> & { id?: string }) => void
  objetosExistentes: Objeto[]
}

export function ObjetoForm({ open, onOpenChange, objeto, onSave, objetosExistentes }: ObjetoFormProps) {
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch, setError } = useForm<Omit<Objeto, "id"> & { id?: string }>({
    defaultValues: { descricao: "", categoria: "", ativo: true },
  })

  useEffect(() => {
    if (objeto) {
      setValue("id", objeto.id)
      setValue("descricao", objeto.descricao)
      setValue("categoria", objeto.categoria || "")
      setValue("ativo", objeto.ativo)
    } else {
      reset({ descricao: "", categoria: "", ativo: true })
    }
  }, [objeto, setValue, reset])

  const ativo = watch("ativo", objeto?.ativo ?? true)

  const onSubmit = (data: Omit<Objeto, "id"> & { id?: string }) => {
    const descricaoNormalizada = data.descricao.trim().toLowerCase()
    
    const duplicado = objetosExistentes.find(
      (o) => o.descricao.trim().toLowerCase() === descricaoNormalizada && o.id !== data.id
    )
    
    if (duplicado) {
      setError("descricao", {
        type: "manual",
        message: "Já existe um objeto com esta descrição",
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
          <DialogTitle>{objeto ? "Editar Objeto" : "Novo Objeto"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register("id")} value={objeto?.id} />
          
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição *</Label>
            <Textarea
              id="descricao"
              {...register("descricao", { required: "Descrição é obrigatória" })}
              rows={3}
            />
            {errors.descricao && <p className="text-sm text-destructive">{errors.descricao.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria</Label>
            <Input
              id="categoria"
              {...register("categoria")}
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
