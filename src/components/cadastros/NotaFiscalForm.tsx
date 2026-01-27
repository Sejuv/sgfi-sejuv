import { useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { CurrencyInput } from "@/components/CurrencyInput"

type NotaFiscal = {
  id: string
  numero: string
  serie?: string
  dataEmissao: string
  valor: number
  credor: string
  ativo: boolean
}

interface NotaFiscalFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  notaFiscal?: NotaFiscal
  onSave: (data: Omit<NotaFiscal, "id"> & { id?: string }) => void
}

export function NotaFiscalForm({ open, onOpenChange, notaFiscal, onSave }: NotaFiscalFormProps) {
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch, control } = useForm<Omit<NotaFiscal, "id"> & { id?: string }>({
    defaultValues: { 
      numero: "", 
      serie: "", 
      dataEmissao: new Date().toISOString().split('T')[0], 
      valor: 0, 
      credor: "",
      ativo: true 
    },
  })

  useEffect(() => {
    if (notaFiscal) {
      setValue("id", notaFiscal.id)
      setValue("numero", notaFiscal.numero)
      setValue("serie", notaFiscal.serie || "")
      setValue("dataEmissao", notaFiscal.dataEmissao)
      setValue("valor", notaFiscal.valor)
      setValue("credor", notaFiscal.credor)
      setValue("ativo", notaFiscal.ativo)
    } else {
      reset({ 
        numero: "", 
        serie: "", 
        dataEmissao: new Date().toISOString().split('T')[0], 
        valor: 0, 
        credor: "",
        ativo: true 
      })
    }
  }, [notaFiscal, setValue, reset])

  const ativo = watch("ativo", notaFiscal?.ativo ?? true)

  const onSubmit = (data: Omit<NotaFiscal, "id"> & { id?: string }) => {
    onSave(data)
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{notaFiscal ? "Editar Nota Fiscal" : "Nova Nota Fiscal"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register("id")} value={notaFiscal?.id} />
          
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
              <Label htmlFor="serie">Série</Label>
              <Input
                id="serie"
                {...register("serie")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataEmissao">Data de Emissão *</Label>
              <Input
                id="dataEmissao"
                type="date"
                {...register("dataEmissao", { required: "Data de emissão é obrigatória" })}
              />
              {errors.dataEmissao && <p className="text-sm text-destructive">{errors.dataEmissao.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor">Valor *</Label>
              <Controller
                name="valor"
                control={control}
                rules={{ required: "Valor é obrigatório" }}
                render={({ field }) => (
                  <CurrencyInput
                    id="valor"
                    value={field.value || 0}
                    onChange={field.onChange}
                  />
                )}
              />
              {errors.valor && <p className="text-sm text-destructive">{errors.valor.message}</p>}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="credor">Credor *</Label>
              <Input
                id="credor"
                {...register("credor", { required: "Credor é obrigatório" })}
              />
              {errors.credor && <p className="text-sm text-destructive">{errors.credor.message}</p>}
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
