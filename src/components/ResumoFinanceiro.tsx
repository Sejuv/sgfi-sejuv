import { ProcessoDespesa } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { formatCurrency } from "@/lib/utils"
import { exportResumoFinanceiroToExcel, printResumoFinanceiro } from "@/lib/export-utils"
import { FileCsv, FileXls, FilePdf, Funnel, X } from "@phosphor-icons/react"
import { toast } from "sonner"
import { useMemo, useState } from "react"

interface ResumoFinanceiroProps {
  processos: ProcessoDespesa[]
}

export function ResumoFinanceiro({ processos }: ResumoFinanceiroProps) {
  const [filtroAno, setFiltroAno] = useState<string>("todos")
  const [filtroMes, setFiltroMes] = useState<string>("todos")
  const [filtroCredor, setFiltroCredor] = useState<string>("todos")
  const [filtroSecretaria, setFiltroSecretaria] = useState<string>("todos")
  const [filtroRecurso, setFiltroRecurso] = useState<string>("todos")
  const [filtroSetor, setFiltroSetor] = useState<string>("todos")
  const [filtroConta, setFiltroConta] = useState<string>("todos")

  const anosDisponiveis = useMemo(() => {
    const anos = new Set<number>()
    processos.forEach(p => anos.add(p.ano))
    return Array.from(anos).sort((a, b) => b - a)
  }, [processos])

  const mesesDisponiveis = useMemo(() => {
    const meses = new Set<string>()
    processos.forEach(p => meses.add(p.mes))
    return Array.from(meses)
  }, [processos])

  const credoresDisponiveis = useMemo(() => {
    const credores = new Set<string>()
    processos.forEach(p => credores.add(p.credor))
    return Array.from(credores).sort()
  }, [processos])

  const secretariasDisponiveis = useMemo(() => {
    const secretarias = new Set<string>()
    processos.forEach(p => secretarias.add(p.secretaria))
    return Array.from(secretarias).sort()
  }, [processos])

  const recursosDisponiveis = useMemo(() => {
    const recursos = new Set<string>()
    processos.forEach(p => recursos.add(p.recurso))
    return Array.from(recursos).sort()
  }, [processos])

  const setoresDisponiveis = useMemo(() => {
    const setores = new Set<string>()
    processos.forEach(p => setores.add(p.setor))
    return Array.from(setores).sort()
  }, [processos])

  const contasDisponiveis = useMemo(() => {
    const contas = new Set<string>()
    processos.forEach(p => contas.add(p.conta))
    return Array.from(contas).sort()
  }, [processos])

  const processosFiltrados = useMemo(() => {
    return processos.filter(p => {
      if (filtroAno !== "todos" && p.ano !== parseInt(filtroAno)) return false
      if (filtroMes !== "todos" && p.mes !== filtroMes) return false
      if (filtroCredor !== "todos" && p.credor !== filtroCredor) return false
      if (filtroSecretaria !== "todos" && p.secretaria !== filtroSecretaria) return false
      if (filtroRecurso !== "todos" && p.recurso !== filtroRecurso) return false
      if (filtroSetor !== "todos" && p.setor !== filtroSetor) return false
      if (filtroConta !== "todos" && p.conta !== filtroConta) return false
      return true
    })
  }, [processos, filtroAno, filtroMes, filtroCredor, filtroSecretaria, filtroRecurso, filtroSetor, filtroConta])

  const limparFiltros = () => {
    setFiltroAno("todos")
    setFiltroMes("todos")
    setFiltroCredor("todos")
    setFiltroSecretaria("todos")
    setFiltroRecurso("todos")
    setFiltroSetor("todos")
    setFiltroConta("todos")
  }

  const temFiltrosAtivos = filtroAno !== "todos" || filtroMes !== "todos" || 
    filtroCredor !== "todos" || filtroSecretaria !== "todos" || 
    filtroRecurso !== "todos" || filtroSetor !== "todos" || filtroConta !== "todos"

  const totalGeral = useMemo(() => {
    return processosFiltrados.reduce((acc, p) => acc + p.valor, 0)
  }, [processosFiltrados])

  const handleExportExcel = () => {
    const dataExport = processosFiltrados.map((p) => ({
      Ano: p.ano,
      Mês: p.mes,
      Credor: p.credor,
      Secretaria: p.secretaria,
      Setor: p.setor,
      Recurso: p.recurso,
      Conta: p.conta,
      Objeto: p.objeto,
      Valor: p.valor,
      DID: p.did || "",
      "Nota Fiscal": p.nf || "",
      Controladoria: p.dataControladoria || "",
      Contabilidade: p.dataContabilidade || "",
      Compras: p.dataCompras || "",
      SEFIN: p.dataSefin || "",
      Tesouraria: p.dataTesouraria || "",
      Status: p.dataTesouraria ? "Completo" : "Pendente",
    }))
    
    // Adicionar linha de total
    dataExport.push({
      Ano: "",
      Mês: "",
      Credor: "",
      Secretaria: "",
      Setor: "",
      Recurso: "",
      Conta: "TOTAL GERAL",
      Objeto: "",
      Valor: totalGeral,
      DID: "",
      "Nota Fiscal": "",
      Controladoria: "",
      Contabilidade: "",
      Compras: "",
      SEFIN: "",
      Tesouraria: "",
      Status: "",
    })
    
    const XLSX = require('xlsx')
    const worksheet = XLSX.utils.json_to_sheet(dataExport)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Processos Filtrados")
    XLSX.writeFile(workbook, `processos-filtrados-${new Date().toISOString().split("T")[0]}.xlsx`)
    
    toast.success("Excel exportado com sucesso")
  }

  const handleExportPDF = () => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      toast.error("Não foi possível abrir a janela de impressão")
      return
    }

    const totalGeralPDF = processosFiltrados.reduce((acc, p) => acc + p.valor, 0)

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Processos Filtrados</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            font-size: 10px;
          }
          h1 {
            font-size: 16px;
            margin-bottom: 10px;
            color: #333;
          }
          .header {
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #333;
          }
          .info {
            margin-bottom: 5px;
            color: #666;
            font-size: 11px;
          }
          .total-box {
            background-color: #dbeafe;
            padding: 15px;
            margin: 15px 0;
            border-radius: 5px;
            border-left: 4px solid #1e40af;
            page-break-inside: avoid;
          }
          .total-label {
            font-size: 11px;
            color: #666;
            margin-bottom: 5px;
            font-weight: 600;
          }
          .total-value {
            font-size: 20px;
            font-weight: bold;
            color: #1e40af;
          }
          .processo {
            border: 1px solid #ddd;
            padding: 10px;
            margin-bottom: 10px;
            border-radius: 5px;
            page-break-inside: avoid;
          }
          .processo-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
          }
          .campo {
            margin-bottom: 5px;
          }
          .campo-label {
            font-size: 9px;
            color: #666;
            margin-bottom: 2px;
          }
          .campo-valor {
            font-size: 11px;
            font-weight: 600;
            color: #333;
          }
          .valor-destaque {
            color: #1e40af;
            font-size: 12px;
          }
          @media print {
            body { margin: 0; }
            @page { margin: 1cm; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Sistema de Gestão de Despesas - Prefeitura de Irauçuba</h1>
          <div class="info">Relatório de Processos Filtrados</div>
          <div class="info">Data de Geração: ${new Date().toLocaleString("pt-BR")}</div>
          <div class="info">Total de Processos: ${processosFiltrados.length}</div>
        </div>
        
        <div class="total-box">
          <div class="total-label">Total Geral</div>
          <div class="total-value">${formatCurrency(totalGeralPDF)}</div>
        </div>

        ${processosFiltrados.map((p) => `
          <div class="processo">
            <div class="processo-grid">
              <div class="campo">
                <div class="campo-label">Credor</div>
                <div class="campo-valor">${p.credor}</div>
              </div>
              <div class="campo">
                <div class="campo-label">Secretaria</div>
                <div class="campo-valor">${p.secretaria}</div>
              </div>
              <div class="campo">
                <div class="campo-label">Setor</div>
                <div class="campo-valor">${p.setor}</div>
              </div>
              <div class="campo">
                <div class="campo-label">Recurso</div>
                <div class="campo-valor">${p.recurso}</div>
              </div>
              <div class="campo">
                <div class="campo-label">Conta</div>
                <div class="campo-valor">${p.conta}</div>
              </div>
              <div class="campo">
                <div class="campo-label">Objeto</div>
                <div class="campo-valor">${p.objeto}</div>
              </div>
              <div class="campo">
                <div class="campo-label">Período</div>
                <div class="campo-valor">${p.mes}/${p.ano}</div>
              </div>
              <div class="campo">
                <div class="campo-label">Valor</div>
                <div class="campo-valor valor-destaque">${formatCurrency(p.valor)}</div>
              </div>
            </div>
          </div>
        `).join('')}
      </body>
      </html>
    `

    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.onload = () => {
      printWindow.print()
    }
    
    toast.success("PDF gerado com sucesso")
  }

  if (processos.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground">Nenhum dado disponível para análise</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4 overflow-y-scroll h-full" style={{scrollBehavior: 'smooth'}}>
      <Card className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Total Geral
            </p>
            <p className="text-2xl font-bold text-primary tabular-nums">
              {formatCurrency(totalGeral)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Processos</p>
            <p className="text-xl font-semibold">{processosFiltrados.length}</p>
          </div>
        </div>
      </Card>

      <Card className="p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Funnel className="h-4 w-4 text-primary" weight="fill" />
            <h3 className="font-semibold text-sm">Filtros</h3>
          </div>
          {temFiltrosAtivos && (
            <Button variant="ghost" size="sm" onClick={limparFiltros} className="h-7">
              <X className="h-3.5 w-3.5 mr-1" />
              Limpar
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          <div className="space-y-1">
            <Label htmlFor="filtro-ano-resumo" className="text-xs">Ano</Label>
            <Select value={filtroAno} onValueChange={setFiltroAno}>
              <SelectTrigger id="filtro-ano-resumo" className="h-9">
                <SelectValue placeholder="Todos os anos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os anos</SelectItem>
                {anosDisponiveis.map((ano) => (
                  <SelectItem key={ano} value={String(ano)}>
                    {ano}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="filtro-mes-resumo" className="text-xs">Mês</Label>
            <Select value={filtroMes} onValueChange={setFiltroMes}>
              <SelectTrigger id="filtro-mes-resumo" className="h-9">
                <SelectValue placeholder="Todos os meses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os meses</SelectItem>
                {mesesDisponiveis.map((mes) => (
                  <SelectItem key={mes} value={mes}>
                    {mes}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="filtro-credor" className="text-xs">Credor</Label>
            <Select value={filtroCredor} onValueChange={setFiltroCredor}>
              <SelectTrigger id="filtro-credor" className="h-9">
                <SelectValue placeholder="Todos os credores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os credores</SelectItem>
                {credoresDisponiveis.map((credor) => (
                  <SelectItem key={credor} value={credor}>
                    {credor}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="filtro-secretaria" className="text-xs">Secretaria</Label>
            <Select value={filtroSecretaria} onValueChange={setFiltroSecretaria}>
              <SelectTrigger id="filtro-secretaria" className="h-9">
                <SelectValue placeholder="Todas as secretarias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas as secretarias</SelectItem>
                {secretariasDisponiveis.map((secretaria) => (
                  <SelectItem key={secretaria} value={secretaria}>
                    {secretaria}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="filtro-recurso" className="text-xs">Recurso</Label>
            <Select value={filtroRecurso} onValueChange={setFiltroRecurso}>
              <SelectTrigger id="filtro-recurso" className="h-9">
                <SelectValue placeholder="Todos os recursos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os recursos</SelectItem>
                {recursosDisponiveis.map((recurso) => (
                  <SelectItem key={recurso} value={recurso}>
                    {recurso}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="filtro-setor" className="text-xs">Setor</Label>
            <Select value={filtroSetor} onValueChange={setFiltroSetor}>
              <SelectTrigger id="filtro-setor" className="h-9">
                <SelectValue placeholder="Todos os setores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os setores</SelectItem>
                {setoresDisponiveis.map((setor) => (
                  <SelectItem key={setor} value={setor}>
                    {setor}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="filtro-conta" className="text-xs">Conta</Label>
            <Select value={filtroConta} onValueChange={setFiltroConta}>
              <SelectTrigger id="filtro-conta" className="h-9">
                <SelectValue placeholder="Todas as contas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas as contas</SelectItem>
                {contasDisponiveis.map((conta) => (
                  <SelectItem key={conta} value={conta}>
                    {conta}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="p-3 bg-muted/30 border-b flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-base">Processos Filtrados</h3>
            <p className="text-xs text-muted-foreground">
              {processosFiltrados.length} {processosFiltrados.length === 1 ? 'processo' : 'processos'} encontrado{processosFiltrados.length === 1 ? '' : 's'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleExportExcel} variant="outline" size="sm" className="gap-2 h-8">
              <FileXls className="h-3.5 w-3.5" weight="bold" />
              <span className="hidden md:inline">Excel</span>
            </Button>
            <Button onClick={handleExportPDF} variant="outline" size="sm" className="gap-2 h-8">
              <FilePdf className="h-3.5 w-3.5" weight="bold" />
              <span className="hidden md:inline">PDF</span>
            </Button>
          </div>
        </div>
        
        <div className="p-4">
          {processosFiltrados.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              Nenhum processo encontrado com os filtros selecionados
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {processosFiltrados.map((processo) => (
                  <div 
                    key={processo.id} 
                    className="p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Credor</p>
                        <p className="font-semibold text-sm">{processo.credor}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Secretaria</p>
                        <p className="font-semibold text-sm">{processo.secretaria}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Setor</p>
                        <p className="font-semibold text-sm">{processo.setor}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Recurso</p>
                        <p className="font-semibold text-sm">{processo.recurso}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Conta</p>
                        <p className="font-semibold text-sm">{processo.conta}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Objeto</p>
                        <p className="font-semibold text-sm">{processo.objeto}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Período</p>
                        <p className="font-semibold text-sm">{processo.mes}/{processo.ano}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Valor</p>
                        <p className="font-bold text-base text-primary tabular-nums">{formatCurrency(processo.valor)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-6 border-2 border-primary/20 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                      Soma Total dos Processos Filtrados
                    </p>
                    <p className="text-2xl font-bold text-primary tabular-nums">
                      {formatCurrency(totalGeral)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground mb-1">Quantidade</p>
                    <p className="text-xl font-semibold text-foreground">{processosFiltrados.length}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  )
}
