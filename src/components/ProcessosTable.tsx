import { ProcessoDespesa, Usuario } from "@/lib/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { exportProcessosToExcel, printProcessos } from "@/lib/export-utils"
import { canEdit } from "@/lib/permissions"
import { 
  PencilSimple, 
  Trash, 
  CalendarCheck, 
  FileCsv, 
  Printer,
  ArrowUUpLeft,
  ArrowUDownLeft,
  WarningCircle
} from "@phosphor-icons/react"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ProcessosTableProps {
  processos: ProcessoDespesa[]
  onEdit: (processo: ProcessoDespesa) => void
  onDelete: (id: string) => void
  onWorkflow: (processo: ProcessoDespesa) => void
  onDevolucao: (processo: ProcessoDespesa) => void
  onReceber: (processo: ProcessoDespesa) => void
  usuario?: Usuario | null
}

export function ProcessosTable({ processos, onEdit, onDelete, onWorkflow, onDevolucao, onReceber, usuario }: ProcessosTableProps) {
  const podeEditar = canEdit(usuario || null, "processos")
  const handleExport = () => {
    exportProcessosToExcel(processos)
    toast.success("Relatório exportado com sucesso")
  }

  const handlePrint = () => {
    printProcessos(processos)
    toast.success("Preparando impressão...")
  }

  if (processos.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground">Nenhum processo encontrado</p>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden flex flex-col h-full">
      <div className="flex items-center justify-between gap-3 p-3 border-b bg-muted/30 shrink-0">
        <div>
          <h3 className="font-semibold text-base">Lista de Processos</h3>
          <p className="text-xs text-muted-foreground">{processos.length} processos encontrados</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline" size="sm" className="gap-2">
            <FileCsv className="h-4 w-4" weight="bold" />
            Exportar Excel
          </Button>
          <Button onClick={handlePrint} variant="outline" size="sm" className="gap-2">
            <Printer className="h-4 w-4" weight="bold" />
            Imprimir
          </Button>
        </div>
      </div>
      <div className="overflow-auto flex-1 relative" style={{overflowY: 'scroll', overflowX: 'auto'}}>
        <Table className="relative">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px] sticky left-0 bg-muted/30 z-10">Ano</TableHead>
              <TableHead className="min-w-[150px]">Secretaria</TableHead>
              <TableHead className="min-w-[100px]">Setor</TableHead>
              <TableHead className="min-w-[100px]">Conta</TableHead>
              <TableHead className="min-w-[140px]">Credor</TableHead>
              <TableHead className="min-w-[160px]">Objeto</TableHead>
              <TableHead className="w-[70px]">Mês</TableHead>
              <TableHead className="w-[110px] text-right">Valor</TableHead>
              <TableHead className="min-w-[130px]">Recurso</TableHead>
              <TableHead className="w-[90px]">DID</TableHead>
              <TableHead className="w-[90px]">NF</TableHead>
              <TableHead className="w-[95px] text-center">Control.</TableHead>
              <TableHead className="w-[95px] text-center">Contab.</TableHead>
              <TableHead className="w-[95px] text-center">Compras</TableHead>
              <TableHead className="w-[95px] text-center">SEFIN</TableHead>
              <TableHead className="w-[95px] bg-amber-100 text-center">Tesour.</TableHead>
              <TableHead className="w-[90px] text-center">Status</TableHead>
              <TableHead className="w-[140px] text-right sticky right-0 bg-muted/30 z-10">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {processos.map((processo) => {
              const isPendente = !processo.dataTesouraria
              const foiDevolvido = processo.devolvido && !processo.recebidoNovamente
              
              return (
                <TableRow key={processo.id} className={foiDevolvido ? "bg-orange-50/50" : ""}>
                  <TableCell className="font-medium tabular-nums sticky left-0 bg-background z-10">
                    <div className="flex items-center gap-1">
                      {processo.ano}
                      {processo.devolvido && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <WarningCircle 
                                className="h-4 w-4 text-orange-600" 
                                weight="fill"
                              />
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-xs bg-slate-900 text-white border-slate-700">
                              <p className="font-semibold text-white">Processo Devolvido</p>
                              <p className="text-xs mt-1 text-slate-100">
                                <strong className="text-white">Para:</strong> {processo.secretariaDevolucao}
                              </p>
                              <p className="text-xs text-slate-100">
                                <strong className="text-white">Motivo:</strong> {processo.motivoDevolucao}
                              </p>
                              <p className="text-xs text-slate-300">
                                {processo.dataDevolucao && new Date(processo.dataDevolucao).toLocaleDateString('pt-BR')}
                              </p>
                              {processo.recebidoNovamente && (
                                <p className="text-xs text-green-400 mt-1">
                                  ✓ Recebido novamente em {processo.dataRecebimento && new Date(processo.dataRecebimento).toLocaleDateString('pt-BR')}
                                </p>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{processo.secretaria}</TableCell>
                  <TableCell className="text-sm">{processo.setor}</TableCell>
                  <TableCell className="text-sm">{processo.conta}</TableCell>
                  <TableCell className="font-medium text-sm">{processo.credor}</TableCell>
                  <TableCell className="text-sm">{processo.objeto}</TableCell>
                  <TableCell className="text-sm">{processo.mes}</TableCell>
                  <TableCell className="text-right font-semibold tabular-nums text-sm">
                    {formatCurrency(processo.valor)}
                  </TableCell>
                  <TableCell className="text-sm">{processo.recurso}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {processo.did || "-"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {processo.nf || "-"}
                  </TableCell>
                  <TableCell className="text-xs text-center">
                    {formatDate(processo.dataControladoria)}
                  </TableCell>
                  <TableCell className="text-xs text-center">
                    {formatDate(processo.dataContabilidade)}
                  </TableCell>
                  <TableCell className="text-xs text-center">
                    {formatDate(processo.dataCompras)}
                  </TableCell>
                  <TableCell className="text-xs text-center">
                    {formatDate(processo.dataSefin)}
                  </TableCell>
                  <TableCell className="text-xs bg-amber-50 text-center">
                    {formatDate(processo.dataTesouraria)}
                  </TableCell>
                  <TableCell className="text-center">
                    {foiDevolvido ? (
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300 text-xs px-2 py-0">
                        Devolvido
                      </Badge>
                    ) : isPendente ? (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 text-xs px-2 py-0">
                        Pend.
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 text-xs px-2 py-0">
                        OK
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right sticky right-0 bg-background z-10">
                    <div className="flex gap-0.5 justify-end">
                      {foiDevolvido && podeEditar && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => onReceber(processo)}
                              >
                                <ArrowUDownLeft className="h-3.5 w-3.5" weight="bold" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Receber processo novamente</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {podeEditar && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                onClick={() => onDevolucao(processo)}
                              >
                                <ArrowUUpLeft className="h-3.5 w-3.5" weight="bold" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Devolver processo</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {podeEditar && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => onWorkflow(processo)}
                          title="Gerenciar trâmite"
                        >
                          <CalendarCheck className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {podeEditar && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => onEdit(processo)}
                          title="Editar processo"
                        >
                          <PencilSimple className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {podeEditar && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => {
                            if (confirm("Tem certeza que deseja excluir este processo?")) {
                              onDelete(processo.id)
                            }
                          }}
                          title="Excluir processo"
                        >
                          <Trash className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}
