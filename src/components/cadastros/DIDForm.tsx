import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

type DID = {
  id: string
  numero: string
  descricao?: string
  ano: number
  ativo: boolean
}

interface DIDFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  did?: DID
  onSave: (data: Omit<DID, "id"> & { id?: string }) => void
}

export function DIDForm({ open, onOpenChange, did, onSave }: DIDFormProps) {
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<Omit<DID, "id"> & { id?: string }>({
    defaultValues: { numero: "", descricao: "", ano: new Date().getFullYear(), ativo: true },
  })

  useEffect(() => {
    if (did) {
      setValue("id", did.id)
      setValue("numero", did.numero)
      setValue("descricao", did.descricao || "")
      setValue("ano", did.ano)
      setValue("ativo", did.ativo)
    } else {
      reset({ numero: "", descricao: "", ano: new Date().getFullYear(), ativo: true })
    }
  }, [did, setValue, reset])

  const ativo = watch("ativo", did?.ativo ?? true)

  const onSubmit = (data: Omit<DID, "id"> & { id?: string }) => {
    onSave(data)
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{did ? "Editar DID" : "Novo DID"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register("id")} value={did?.id} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numero">Número *</Label>
              <Input
                id="numero"
                {...register("numero", { required: "Número é obrigatório" })}
              />
              {errors.numero && <p className="text-sm text-destructive">{errors.numero.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ano">Ano *</Label>
              <Input
                id="ano"
                type="number"
                {...register("ano", { 
                  required: "Ano é obrigatório",
                  valueAsNumber: true,
                  min: { value: 2000, message: "Ano deve ser maior que 2000" }
                })}
              />
              {errors.ano && <p className="text-sm text-destructive">{errors.ano.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              {...register("descricao")}
              rows={3}
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
