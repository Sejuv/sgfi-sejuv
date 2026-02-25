import { ProcessoDespesa } from "@/lib/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { format, parse, isValid } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar as CalendarIcon, Check, X } from "@phosphor-icons/react"
import { useState, useEffect } from "react"

interface WorkflowDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  processo: ProcessoDespesa
  onSave: (processo: ProcessoDespesa, silent?: boolean) => void
}

const ETAPAS = [
  { key: "dataControladoria", label: "Controladoria" },
  { key: "dataContabilidade", label: "Contabilidade" },
  { key: "dataCompras", label: "Compras" },
  { key: "dataSefin", label: "SEFIN" },
  { key: "dataTesouraria", label: "Tesouraria" },
] as const

export function WorkflowDialog({ open, onOpenChange, processo, onSave }: WorkflowDialogProps) {
  const [datas, setDatas] = useState({
    dataControladoria: processo.dataControladoria,
    dataContabilidade: processo.dataContabilidade,
    dataCompras: processo.dataCompras,
    dataSefin: processo.dataSefin,
    dataTesouraria: processo.dataTesouraria,
  })

  const [inputValues, setInputValues] = useState({
    dataControladoria: "",
    dataContabilidade: "",
    dataCompras: "",
    dataSefin: "",
    dataTesouraria: "",
  })

  useEffect(() => {
    setDatas({
      dataControladoria: processo.dataControladoria,
      dataContabilidade: processo.dataContabilidade,
      dataCompras: processo.dataCompras,
      dataSefin: processo.dataSefin,
      dataTesouraria: processo.dataTesouraria,
    })
    
    setInputValues({
      dataControladoria: processo.dataControladoria ? format(new Date(processo.dataControladoria), "dd/MM/yyyy") : "",
      dataContabilidade: processo.dataContabilidade ? format(new Date(processo.dataContabilidade), "dd/MM/yyyy") : "",
      dataCompras: processo.dataCompras ? format(new Date(processo.dataCompras), "dd/MM/yyyy") : "",
      dataSefin: processo.dataSefin ? format(new Date(processo.dataSefin), "dd/MM/yyyy") : "",
      dataTesouraria: processo.dataTesouraria ? format(new Date(processo.dataTesouraria), "dd/MM/yyyy") : "",
    })
  }, [processo])

  const handleSave = () => {
    onSave({ ...processo, ...datas }, false)
    onOpenChange(false)
  }

  const persistDatas = (nextDatas: typeof datas) => {
    onSave({ ...processo, ...nextDatas }, true)
  }

  const setData = (key: keyof typeof datas, date: Date | undefined) => {
    const nextDatas = { ...datas, [key]: date ? date.toISOString() : undefined }
    setDatas(nextDatas)
    setInputValues({ ...inputValues, [key]: date ? format(date, "dd/MM/yyyy") : "" })
    persistDatas(nextDatas)
  }

  const limparData = (key: keyof typeof datas) => {
    const nextDatas = { ...datas, [key]: undefined }
    setDatas(nextDatas)
    setInputValues({ ...inputValues, [key]: "" })
    persistDatas(nextDatas)
  }

  const handleInputChange = (key: keyof typeof datas, value: string) => {
    setInputValues({ ...inputValues, [key]: value })
    
    if (value.length === 10) {
      const parsedDate = parse(value, "dd/MM/yyyy", new Date())
      if (isValid(parsedDate)) {
        const nextDatas = { ...datas, [key]: parsedDate.toISOString() }
        setDatas(nextDatas)
        persistDatas(nextDatas)
      }
    } else if (value === "") {
      const nextDatas = { ...datas, [key]: undefined }
      setDatas(nextDatas)
      persistDatas(nextDatas)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Trâmite do Processo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-1 text-sm">
            <p className="text-muted-foreground">Credor: {processo.credor}</p>
            <p className="text-muted-foreground">Objeto: {processo.objeto}</p>
          </div>
          
          <div className="space-y-4">
            {ETAPAS.map(({ key, label }) => (
              <div key={key} className="space-y-2">
                <Label>{label}</Label>
                <div className="flex gap-2">
                  <div className="flex-1 flex gap-2">
                    <Input
                      type="text"
                      placeholder="dd/mm/aaaa"
                      value={inputValues[key]}
                      onChange={(e) => handleInputChange(key, e.target.value)}
                      maxLength={10}
                      className="flex-1"
                    />
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="shrink-0"
                        >
                          <CalendarIcon className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={datas[key] ? new Date(datas[key]!) : undefined}
                          onSelect={(date) => setData(key, date)}
                          initialFocus
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  {datas[key] && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => limparData(key)}
                      title="Limpar data"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  {datas[key] && (
                    <div className="flex items-center justify-center w-10 text-green-600">
                      <Check weight="bold" className="h-5 w-5" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
