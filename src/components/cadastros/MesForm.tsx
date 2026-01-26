import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mes } from "@/lib/cadastros-types"

interface MesFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mes?: Mes
  onSave: (data: Omit<Mes, "id"> & { id?: string }) => void
}

const MESES_LISTA = [
  { numero: 1, nome: "Janeiro" },
  { numero: 2, nome: "Fevereiro" },
  { numero: 3, nome: "Março" },
  { numero: 4, nome: "Abril" },
  { numero: 5, nome: "Maio" },
  { numero: 6, nome: "Junho" },
  { numero: 7, nome: "Julho" },
  { numero: 8, nome: "Agosto" },
  { numero: 9, nome: "Setembro" },
  { numero: 10, nome: "Outubro" },
  { numero: 11, nome: "Novembro" },
  { numero: 12, nome: "Dezembro" },
]

export function MesForm({ open, onOpenChange, mes, onSave }: MesFormProps) {
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<Omit<Mes, "id"> & { id?: string }>({
    defaultValues: { nome: "Janeiro", numero: 1, ativo: true },
  })

  useEffect(() => {
    if (mes) {
      setValue("id", mes.id)
      setValue("nome", mes.nome)
      setValue("numero", mes.numero)
      setValue("ativo", mes.ativo)
    } else {
      reset({ nome: "Janeiro", numero: 1, ativo: true })
    }
  }, [mes, setValue, reset])

  const ativo = watch("ativo", mes?.ativo ?? true)
  const nome = watch("nome", mes?.nome ?? "Janeiro")

  const handleMesChange = (mesNome: string) => {
    const mesSelecionado = MESES_LISTA.find(m => m.nome === mesNome)
    if (mesSelecionado) {
      setValue("nome", mesSelecionado.nome)
      setValue("numero", mesSelecionado.numero)
    }
  }

  const onSubmit = (data: Omit<Mes, "id"> & { id?: string }) => {
    onSave(data)
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mes ? "Editar Mês" : "Novo Mês"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register("id")} value={mes?.id} />
          <input type="hidden" {...register("numero")} />
          
          <div className="space-y-2">
            <Label htmlFor="nome">Mês *</Label>
            <Select value={nome} onValueChange={handleMesChange}>
              <SelectTrigger id="nome">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MESES_LISTA.map((m) => (
                  <SelectItem key={m.numero} value={m.nome}>
                    {m.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
