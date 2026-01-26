import { useState, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { Upload, Download, FileArrowUp } from "@phosphor-icons/react"
import { importProcessosFromExcel, downloadProcessosTemplate } from "@/lib/excel-utils"
import { ProcessoDespesa } from "@/lib/types"

interface ImportProcessosDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (processos: Omit<ProcessoDespesa, "id">[]) => void
}

export function ImportProcessosDialog({ open, onOpenChange, onImport }: ImportProcessosDialogProps) {
  const [loading, setLoading] = useState(false)
  const [fileName, setFileName] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setLoading(true)

    try {
      const processos = await importProcessosFromExcel(file)
      
      if (processos.length === 0) {
        toast.error("Nenhum processo encontrado no arquivo")
        return
      }

      onImport(processos)
      toast.success(`${processos.length} processo(s) importado(s) com sucesso`)
      onOpenChange(false)
      
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      setFileName("")
    } catch (error) {
      console.error(error)
      toast.error("Erro ao importar arquivo. Verifique se o formato está correto.")
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadTemplate = () => {
    downloadProcessosTemplate()
    toast.success("Modelo de planilha baixado")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileArrowUp className="h-5 w-5" weight="bold" />
            Importar Processos
          </DialogTitle>
          <DialogDescription>
            Importe processos em lote através de uma planilha Excel (.xlsx)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">1. Baixe o modelo de planilha</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
                className="gap-2"
              >
                <Download className="h-4 w-4" weight="bold" />
                Baixar Modelo
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              O modelo contém as colunas necessárias e um exemplo de preenchimento
            </p>
          </div>

          <div className="border-t pt-4 space-y-3">
            <p className="text-sm font-medium">2. Selecione o arquivo para importar</p>
            
            <div className="flex flex-col gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              
              <label htmlFor="file-upload">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  asChild
                  disabled={loading}
                >
                  <span>
                    <Upload className="h-4 w-4" weight="bold" />
                    {fileName || "Selecionar Arquivo"}
                  </span>
                </Button>
              </label>

              {loading && (
                <div className="space-y-2">
                  <Progress value={undefined} className="w-full" />
                  <p className="text-xs text-center text-muted-foreground">
                    Processando arquivo...
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
