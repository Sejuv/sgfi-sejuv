import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { useKV } from "@/hooks/useKV"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Setor, Secretaria } from "@/lib/cadastros-types"

interface SetorFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  setor?: Setor
  onSave: (data: Omit<Setor, "id"> & { id?: string }) => void
  secretariaIdInicial?: string
}

export function SetorForm({ open, onOpenChange, setor, onSave, secretariaIdInicial }: SetorFormProps) {
  const [secretarias] = useKV<Secretaria[]>("cadastro-secretarias", [])
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<Omit<Setor, "id"> & { id?: string }>({
    defaultValues: { nome: "", secretariaId: "", descricao: "", ativo: true },
  })

  useEffect(() => {
    if (setor) {
      setValue("id", setor.id)
      setValue("nome", setor.nome)
      setValue("secretariaId", setor.secretariaId)
      setValue("descricao", setor.descricao || "")
      setValue("ativo", setor.ativo)
      setValue("ordem", setor.ordem || 0)
    } else {
      reset({ 
        nome: "", 
        secretariaId: secretariaIdInicial || "", 
        descricao: "", 
        ativo: true,
        ordem: 0
      })
    }
  }, [setor, secretariaIdInicial, setValue, reset])

  const ativo = watch("ativo", setor?.ativo ?? true)
  const secretariaId = watch("secretariaId", setor?.secretariaId ?? "")

  const onSubmit = (data: Omit<Setor, "id"> & { id?: string }) => {
    if (!data.secretariaId) {
      return
    }
    onSave(data)
    reset()
    onOpenChange(false)
  }

  const secretariasAtivas = (secretarias || []).filter(s => s.ativo)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{setor ? "Editar Setor" : "Novo Setor"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register("id")} value={setor?.id} />
          <input type="hidden" {...register("ordem")} value={setor?.ordem || 0} />
          
          <div className="space-y-2">
            <Label htmlFor="secretaria">Secretaria *</Label>
            <Select
              value={secretariaId}
              onValueChange={(value) => setValue("secretariaId", value)}
            >
              <SelectTrigger id="secretaria">
                <SelectValue placeholder="Selecione uma secretaria" />
              </SelectTrigger>
              <SelectContent>
                {secretariasAtivas.map((sec) => (
                  <SelectItem key={sec.id} value={sec.id}>
                    {sec.nome} ({sec.sigla})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.secretariaId && <p className="text-sm text-destructive">{errors.secretariaId.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              {...register("nome", { required: "Nome é obrigatório" })}
            />
            {errors.nome && <p className="text-sm text-destructive">{errors.nome.message}</p>}
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
