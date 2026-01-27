import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Conta } from "@/lib/cadastros-types"
import { toast } from "sonner"

interface ContaFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  conta?: Conta
  onSave: (data: Omit<Conta, "id"> & { id?: string }) => void
  contasExistentes: Conta[]
}

export function ContaForm({ open, onOpenChange, conta, onSave, contasExistentes }: ContaFormProps) {
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<Omit<Conta, "id"> & { id?: string }>({
    defaultValues: { tipo: "", descricao: "", ativo: true },
  })

  useEffect(() => {
    if (conta) {
      setValue("id", conta.id)
      setValue("tipo", conta.tipo)
      setValue("descricao", conta.descricao || "")
      setValue("ativo", conta.ativo)
    } else {
      reset({ tipo: "", descricao: "", ativo: true })
    }
  }, [conta, setValue, reset])

  const ativo = watch("ativo", conta?.ativo ?? true)

  const onSubmit = (data: Omit<Conta, "id"> & { id?: string }) => {
    const tipoLowerCase = data.tipo.trim().toLowerCase()
    const duplicata = contasExistentes.find(
      (c) => c.tipo.toLowerCase() === tipoLowerCase && c.id !== data.id
    )

    if (duplicata) {
      toast.error("Já existe uma conta com este tipo cadastrado")
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
          <DialogTitle>{conta ? "Editar Conta" : "Nova Conta"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register("id")} value={conta?.id} />
          
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo *</Label>
            <Input
              id="tipo"
              {...register("tipo", { required: "Tipo é obrigatório" })}
              placeholder="Ex: Diária, Fixa, Variável, Restos a Pagar"
            />
            {errors.tipo && <p className="text-sm text-destructive">{errors.tipo.message}</p>}
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
