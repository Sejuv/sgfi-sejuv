import { useState, useEffect } from "react"
import { ProcessoDespesa } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowUUpLeft } from "@phosphor-icons/react"

interface DevolucaoDialogProps {
  processo: ProcessoDespesa | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
  onDevolucao: (processoId: string, motivo: string, secretaria: string, data: string) => void
  secretarias: string[]
}

export function DevolucaoDialog({
  processo,
  open,
  onOpenChange,
  onDevolucao,
  secretarias
}: DevolucaoDialogProps) {
  const [motivo, setMotivo] = useState("")
  const [secretariaSelecionada, setSecretariaSelecionada] = useState("")
  const [dataDevolucao, setDataDevolucao] = useState("")

  useEffect(() => {
    if (open) {
      setMotivo("")
      setSecretariaSelecionada("")
      setDataDevolucao(new Date().toISOString().split('T')[0])
    }
  }, [open])

  const handleSubmit = () => {
    if (!processo?.id || !motivo.trim() || !secretariaSelecionada || !dataDevolucao) {
      return
    }

    onDevolucao(processo.id, motivo.trim(), secretariaSelecionada, dataDevolucao)
    onOpenChange(false)
  }

  if (!processo) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUUpLeft className="h-5 w-5 text-orange-600" weight="bold" />
            Devolver Processo
          </DialogTitle>
          <DialogDescription>
            Registre o motivo da devolução do processo <strong>{processo.nf || processo.did || 'S/N'}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="data-devolucao">
              Data da Devolução *
            </Label>
            <input
              type="date"
              id="data-devolucao"
              value={dataDevolucao}
              onChange={(e) => setDataDevolucao(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="secretaria-devolucao">
              Devolver para Secretaria *
            </Label>
            <Select
              value={secretariaSelecionada}
              onValueChange={setSecretariaSelecionada}
            >
              <SelectTrigger id="secretaria-devolucao">
                <SelectValue placeholder="Selecione a secretaria" />
              </SelectTrigger>
              <SelectContent>
                {secretarias.map((sec) => (
                  <SelectItem key={sec} value={sec}>
                    {sec}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivo-devolucao">
              Motivo da Devolução *
            </Label>
            <Textarea
              id="motivo-devolucao"
              placeholder="Descreva o motivo da devolução (pendências, documentos incompletos, erros, etc.)"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={5}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {motivo.length}/500 caracteres
            </p>
          </div>

          {processo.devolvido && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs font-semibold text-amber-900">
                ⚠️ Este processo já foi devolvido anteriormente
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Última devolução: {processo.dataDevolucao ? new Date(processo.dataDevolucao).toLocaleDateString('pt-BR') : 'N/A'}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!motivo.trim() || !secretariaSelecionada || !dataDevolucao}
            className="gap-2 bg-orange-600 hover:bg-orange-700"
          >
            <ArrowUUpLeft className="h-4 w-4" weight="bold" />
            Devolver Processo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
