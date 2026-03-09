import { useState, useEffect, useRef } from "react"
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
  WarningCircle,
  ArrowsOutLineHorizontal
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
  
  // Larguras padrão das colunas
  const defaultWidths = {
    ano: 50,
    secretaria: 110,
    setor: 90,
    conta: 70,
    credor: 130,
    objeto: 140,
    mes: 60,
    valor: 95,
    recurso: 100,
    did: 65,
    nf: 65,
    controladoria: 75,
    contabilidade: 75,
    compras: 75,
    sefin: 75,
    tesouraria: 75,
    status: 70,
    acoes: 140
  }

  // Estado para armazenar larguras das colunas
  const [columnWidths, setColumnWidths] = useState(() => {
    const saved = localStorage.getItem('processos-table-widths')
    return saved ? JSON.parse(saved) : defaultWidths
  })

  // Estado para controle de redimensionamento
  const [resizing, setResizing] = useState<string | null>(null)
  const startX = useRef(0)
  const startWidth = useRef(0)

  // Salvar larguras no localStorage
  useEffect(() => {
    localStorage.setItem('processos-table-widths', JSON.stringify(columnWidths))
  }, [columnWidths])

  // Iniciar redimensionamento
  const handleMouseDown = (column: string, e: React.MouseEvent) => {
    e.preventDefault()
    setResizing(column)
    startX.current = e.clientX
    startWidth.current = columnWidths[column as keyof typeof columnWidths]
  }

  // Durante o redimensionamento
  useEffect(() => {
    if (!resizing) return

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - startX.current
      const newWidth = Math.max(30, startWidth.current + diff) // Largura mínima de 30px
      
      setColumnWidths(prev => ({
        ...prev,
        [resizing]: newWidth
      }))
    }

    const handleMouseUp = () => {
      setResizing(null)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [resizing])

  // Resetar larguras
  const resetWidths = () => {
    setColumnWidths(defaultWidths)
    toast.success("Larguras das colunas restauradas")
  }

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
          <Button onClick={resetWidths} variant="outline" size="sm" className="gap-2" title="Restaurar larguras padrão">
            <ArrowsOutLineHorizontal className="h-4 w-4" weight="bold" />
            Resetar Colunas
          </Button>
        </div>
      </div>
      <div className="overflow-auto flex-1 relative" style={{overflowY: 'scroll', overflowX: 'auto'}}>
        <Table className="relative text-xs w-full">
          <TableHeader>
            <TableRow>
              <TableHead style={{width: `${columnWidths.ano}px`}} className="sticky left-0 bg-muted/30 z-10 text-xs font-semibold px-2 relative group">
                <div className="flex items-center justify-between">
                  Ano
                  <div 
                    className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50 group-hover:bg-primary/30"
                    onMouseDown={(e) => handleMouseDown('ano', e)}
                  />
                </div>
              </TableHead>
              <TableHead style={{width: `${columnWidths.secretaria}px`}} className="text-xs font-semibold px-2 relative group">
                <div className="flex items-center justify-between">
                  Secretaria
                  <div 
                    className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50 group-hover:bg-primary/30"
                    onMouseDown={(e) => handleMouseDown('secretaria', e)}
                  />
                </div>
              </TableHead>
              <TableHead style={{width: `${columnWidths.setor}px`}} className="text-xs font-semibold px-2 relative group">
                <div className="flex items-center justify-between">
                  Setor
                  <div 
                    className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50 group-hover:bg-primary/30"
                    onMouseDown={(e) => handleMouseDown('setor', e)}
                  />
                </div>
              </TableHead>
              <TableHead style={{width: `${columnWidths.conta}px`}} className="text-xs font-semibold px-2 relative group">
                <div className="flex items-center justify-between">
                  Conta
                  <div 
                    className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50 group-hover:bg-primary/30"
                    onMouseDown={(e) => handleMouseDown('conta', e)}
                  />
                </div>
              </TableHead>
              <TableHead style={{width: `${columnWidths.credor}px`}} className="text-xs font-semibold px-2 relative group">
                <div className="flex items-center justify-between">
                  Credor
                  <div 
                    className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50 group-hover:bg-primary/30"
                    onMouseDown={(e) => handleMouseDown('credor', e)}
                  />
                </div>
              </TableHead>
              <TableHead style={{width: `${columnWidths.objeto}px`}} className="text-xs font-semibold px-2 relative group">
                <div className="flex items-center justify-between">
                  Objeto
                  <div 
                    className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50 group-hover:bg-primary/30"
                    onMouseDown={(e) => handleMouseDown('objeto', e)}
                  />
                </div>
              </TableHead>
              <TableHead style={{width: `${columnWidths.mes}px`}} className="text-xs font-semibold px-2 relative group">
                <div className="flex items-center justify-between">
                  Mês
                  <div 
                    className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50 group-hover:bg-primary/30"
                    onMouseDown={(e) => handleMouseDown('mes', e)}
                  />
                </div>
              </TableHead>
              <TableHead style={{width: `${columnWidths.valor}px`}} className="text-right text-xs font-semibold px-2 relative group">
                <div className="flex items-center justify-between">
                  Valor
                  <div 
                    className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50 group-hover:bg-primary/30"
                    onMouseDown={(e) => handleMouseDown('valor', e)}
                  />
                </div>
              </TableHead>
              <TableHead style={{width: `${columnWidths.recurso}px`}} className="text-xs font-semibold px-2 relative group">
                <div className="flex items-center justify-between">
                  Recurso
                  <div 
                    className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50 group-hover:bg-primary/30"
                    onMouseDown={(e) => handleMouseDown('recurso', e)}
                  />
                </div>
              </TableHead>
              <TableHead style={{width: `${columnWidths.did}px`}} className="text-xs font-semibold px-2 relative group">
                <div className="flex items-center justify-between">
                  DID
                  <div 
                    className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50 group-hover:bg-primary/30"
                    onMouseDown={(e) => handleMouseDown('did', e)}
                  />
                </div>
              </TableHead>
              <TableHead style={{width: `${columnWidths.nf}px`}} className="text-xs font-semibold px-2 relative group">
                <div className="flex items-center justify-between">
                  NF
                  <div 
                    className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50 group-hover:bg-primary/30"
                    onMouseDown={(e) => handleMouseDown('nf', e)}
                  />
                </div>
              </TableHead>
              <TableHead style={{width: `${columnWidths.controladoria}px`}} className="text-center text-xs font-semibold px-1 relative group">
                <div className="flex items-center justify-between">
                  Control.
                  <div 
                    className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50 group-hover:bg-primary/30"
                    onMouseDown={(e) => handleMouseDown('controladoria', e)}
                  />
                </div>
              </TableHead>
              <TableHead style={{width: `${columnWidths.contabilidade}px`}} className="text-center text-xs font-semibold px-1 relative group">
                <div className="flex items-center justify-between">
                  Contab.
                  <div 
                    className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50 group-hover:bg-primary/30"
                    onMouseDown={(e) => handleMouseDown('contabilidade', e)}
                  />
                </div>
              </TableHead>
              <TableHead style={{width: `${columnWidths.compras}px`}} className="text-center text-xs font-semibold px-1 relative group">
                <div className="flex items-center justify-between">
                  Compras
                  <div 
                    className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50 group-hover:bg-primary/30"
                    onMouseDown={(e) => handleMouseDown('compras', e)}
                  />
                </div>
              </TableHead>
              <TableHead style={{width: `${columnWidths.sefin}px`}} className="text-center text-xs font-semibold px-1 relative group">
                <div className="flex items-center justify-between">
                  SEFIN
                  <div 
                    className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50 group-hover:bg-primary/30"
                    onMouseDown={(e) => handleMouseDown('sefin', e)}
                  />
                </div>
              </TableHead>
              <TableHead style={{width: `${columnWidths.tesouraria}px`}} className="bg-amber-100 text-center text-xs font-semibold px-1 relative group">
                <div className="flex items-center justify-between">
                  Tesour.
                  <div 
                    className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50 group-hover:bg-primary/30"
                    onMouseDown={(e) => handleMouseDown('tesouraria', e)}
                  />
                </div>
              </TableHead>
              <TableHead style={{width: `${columnWidths.status}px`}} className="text-center text-xs font-semibold px-2 relative group">
                <div className="flex items-center justify-between">
                  Status
                  <div 
                    className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50 group-hover:bg-primary/30"
                    onMouseDown={(e) => handleMouseDown('status', e)}
                  />
                </div>
              </TableHead>
              <TableHead style={{width: `${columnWidths.acoes}px`}} className="text-right sticky right-0 bg-muted/30 z-10 text-xs font-semibold px-2 relative group">
                <div className="flex items-center justify-between">
                  Ações
                  <div 
                    className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50 group-hover:bg-primary/30"
                    onMouseDown={(e) => handleMouseDown('acoes', e)}
                  />
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {processos.map((processo) => {
              const isPendente = !processo.dataTesouraria
              const foiDevolvido = processo.devolvido && !processo.recebidoNovamente
              
              return (
                <TableRow key={processo.id} className={foiDevolvido ? "bg-orange-50/50" : ""}>
                  <TableCell style={{width: `${columnWidths.ano}px`}} className="font-medium tabular-nums sticky left-0 bg-background z-10 text-xs px-2 py-2">
                    <div className="flex items-center gap-1">
                      {processo.ano}
                      {processo.devolvido && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <WarningCircle 
                                className="h-3.5 w-3.5 text-orange-600" 
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
                  <TableCell style={{width: `${columnWidths.secretaria}px`}} className="text-xs truncate px-2 py-2" title={processo.secretaria}>{processo.secretaria}</TableCell>
                  <TableCell style={{width: `${columnWidths.setor}px`}} className="text-xs truncate px-2 py-2" title={processo.setor}>{processo.setor}</TableCell>
                  <TableCell style={{width: `${columnWidths.conta}px`}} className="text-xs truncate px-2 py-2" title={processo.conta}>{processo.conta}</TableCell>
                  <TableCell style={{width: `${columnWidths.credor}px`}} className="font-medium text-xs truncate px-2 py-2" title={processo.credor}>{processo.credor}</TableCell>
                  <TableCell style={{width: `${columnWidths.objeto}px`}} className="text-xs truncate px-2 py-2" title={processo.objeto}>{processo.objeto}</TableCell>
                  <TableCell style={{width: `${columnWidths.mes}px`}} className="text-xs px-2 py-2">{processo.mes}</TableCell>
                  <TableCell style={{width: `${columnWidths.valor}px`}} className="text-right font-semibold tabular-nums text-xs px-2 py-2">
                    {formatCurrency(processo.valor)}
                  </TableCell>
                  <TableCell style={{width: `${columnWidths.recurso}px`}} className="text-xs truncate px-2 py-2" title={processo.recurso}>{processo.recurso}</TableCell>
                  <TableCell style={{width: `${columnWidths.did}px`}} className="text-xs text-muted-foreground px-2 py-2">
                    {processo.did || "-"}
                  </TableCell>
                  <TableCell style={{width: `${columnWidths.nf}px`}} className="text-xs text-muted-foreground px-2 py-2">
                    {processo.nf || "-"}
                  </TableCell>
                  <TableCell style={{width: `${columnWidths.controladoria}px`}} className="text-[10px] text-center px-1 py-2 leading-tight">
                    {formatDate(processo.dataControladoria)}
                  </TableCell>
                  <TableCell style={{width: `${columnWidths.contabilidade}px`}} className="text-[10px] text-center px-1 py-2 leading-tight">
                    {formatDate(processo.dataContabilidade)}
                  </TableCell>
                  <TableCell style={{width: `${columnWidths.compras}px`}} className="text-[10px] text-center px-1 py-2 leading-tight">
                    {formatDate(processo.dataCompras)}
                  </TableCell>
                  <TableCell style={{width: `${columnWidths.sefin}px`}} className="text-[10px] text-center px-1 py-2 leading-tight">
                    {formatDate(processo.dataSefin)}
                  </TableCell>
                  <TableCell style={{width: `${columnWidths.tesouraria}px`}} className="text-[10px] bg-amber-50 text-center px-1 py-2 leading-tight">
                    {formatDate(processo.dataTesouraria)}
                  </TableCell>
                  <TableCell style={{width: `${columnWidths.status}px`}} className="text-center px-2 py-2">
                    {foiDevolvido ? (
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300 text-[10px] font-medium px-1.5 py-0">
                        Dev.
                      </Badge>
                    ) : isPendente ? (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 text-[10px] font-medium px-1.5 py-0">
                        Pend.
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 text-[10px] font-medium px-1.5 py-0">
                        OK
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell style={{width: `${columnWidths.acoes}px`}} className="text-right sticky right-0 bg-background z-10 px-2 py-2">
                    <div className="flex gap-0.5 justify-end">
                      {foiDevolvido && podeEditar && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => onReceber(processo)}
                              >
                                <ArrowUDownLeft className="h-3 w-3" weight="bold" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Receber novamente</p>
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
                                className="h-6 w-6 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                onClick={() => onDevolucao(processo)}
                              >
                                <ArrowUUpLeft className="h-3 w-3" weight="bold" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Devolver</p>
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
                                className="h-6 w-6 p-0"
                                onClick={() => onWorkflow(processo)}
                              >
                                <CalendarCheck className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Trâmite</p>
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
                                className="h-6 w-6 p-0"
                                onClick={() => onEdit(processo)}
                              >
                                <PencilSimple className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Editar</p>
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
                                className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => {
                                  if (confirm("Tem certeza que deseja excluir este processo?")) {
                                    onDelete(processo.id)
                                  }
                                }}
                              >
                                <Trash className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Excluir</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
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
