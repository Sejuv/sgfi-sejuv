import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import {
  DownloadSimple, UploadSimple, FileCsv, FileJs, Warning,
  CheckCircle, CircleNotch, Trash, Info, FileArrowDown, FileArrowUp,
} from '@phosphor-icons/react'
import { Expense, Creditor, Category, Contract, CatalogItem } from '@/lib/types'
import { expensesApi, creditorsApi, categoriesApi, contractsApi, catalogItemsApi } from '@/lib/api'

// ── Tipos ─────────────────────────────────────────────────────────────────────
type ModuleKey = 'despesas' | 'credores' | 'contratos' | 'catalogItems' | 'categorias'

interface ModuleConfig {
  key: ModuleKey
  label: string
  description: string
  color: string
}

const MODULES: ModuleConfig[] = [
  { key: 'despesas',    label: 'Despesas',        description: 'Todas as despesas e pagamentos',     color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400' },
  { key: 'credores',    label: 'Credores',         description: 'Fornecedores e credores cadastrados', color: 'bg-green-500/10 text-green-700 dark:text-green-400' },
  { key: 'contratos',   label: 'Contratos',        description: 'Contratos com itens e saldos',       color: 'bg-purple-500/10 text-purple-700 dark:text-purple-400' },
  { key: 'catalogItems',label: 'Itens de Catálogo','description': 'Catálogo PNCP e itens padrão',     color: 'bg-orange-500/10 text-orange-700 dark:text-orange-400' },
  { key: 'categorias',  label: 'Categorias',       description: 'Categorias de despesas',             color: 'bg-pink-500/10 text-pink-700 dark:text-pink-400' },
]

interface ImportExportViewProps {
  expenses:     Expense[]
  creditors:    Creditor[]
  contracts:    Contract[]
  catalogItems: CatalogItem[]
  categories:   Category[]
  onImported:   () => void
}

// ── CSV Utils ─────────────────────────────────────────────────────────────────
function escapeCell(v: unknown): string {
  if (v === null || v === undefined) return ''
  const s = typeof v === 'object' ? JSON.stringify(v) : String(v)
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function toCSV(rows: Record<string, unknown>[]): string {
  if (!rows.length) return ''
  const keys = Object.keys(rows[0])
  const header = keys.map(escapeCell).join(',')
  const body   = rows.map(r => keys.map(k => escapeCell(r[k])).join(',')).join('\n')
  return `${header}\n${body}`
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim())
  if (lines.length < 2) return []
  const parseRow = (line: string): string[] => {
    const cells: string[] = []
    let cur = '', inQ = false
    for (let i = 0; i < line.length; i++) {
      const c = line[i]
      if (c === '"') {
        if (inQ && line[i + 1] === '"') { cur += '"'; i++ }
        else inQ = !inQ
      } else if (c === ',' && !inQ) { cells.push(cur); cur = '' }
      else cur += c
    }
    cells.push(cur)
    return cells
  }
  const headers = parseRow(lines[0])
  return lines.slice(1).map(line => {
    const vals = parseRow(line)
    const obj: Record<string, string> = {}
    headers.forEach((h, i) => { obj[h] = vals[i] ?? '' })
    return obj
  })
}

// ── Flatten de módulos para CSV ───────────────────────────────────────────────
function flattenExpense(e: Expense): Record<string, unknown> {
  return { id: e.id, number: e.number, description: e.description, amount: e.amount, type: e.type, classification: e.classification, customerNumber: e.customerNumber, installationNumber: e.installationNumber, dueDate: e.dueDate, month: e.month, status: e.status, creditorId: e.creditorId, categoryId: e.categoryId, contractId: e.contractId, createdAt: e.createdAt, paidAt: e.paidAt }
}
function flattenCreditor(c: Creditor): Record<string, unknown> {
  return { id: c.id, name: c.name, documentNumber: c.documentNumber, contact: c.contact, email: c.email, cep: c.cep, street: c.street, neighborhood: c.neighborhood, city: c.city, uf: c.uf }
}
function flattenContract(c: Contract): Record<string, unknown> {
  return { id: c.id, number: c.number, description: c.description, creditorId: c.creditorId, status: c.status, startDate: c.startDate, endDate: c.endDate, notes: c.notes, createdAt: c.createdAt, alertNewContract: c.alertNewContract, alertAdditive: c.alertAdditive, items: JSON.stringify(c.items) }
}
function flattenCatalogItem(i: CatalogItem): Record<string, unknown> {
  return { id: i.id, description: i.description, category: i.category, unit: i.unit, unitPrice: i.unitPrice, pncpCatalog: i.pncpCatalog, pncpClassification: i.pncpClassification, pncpSubclassification: i.pncpSubclassification, specification: i.specification, keyword1: i.keyword1, keyword2: i.keyword2, keyword3: i.keyword3, keyword4: i.keyword4, notes: i.notes }
}
function flattenCategory(c: Category): Record<string, unknown> {
  return { id: c.id, name: c.name, type: c.type, color: c.color }
}

// ── Restaurar de CSV ──────────────────────────────────────────────────────────
function csvToExpense(r: Record<string, string>): Expense {
  return { ...r, amount: parseFloat(r.amount) || 0 } as unknown as Expense
}
function csvToCreditor(r: Record<string, string>): Creditor {
  return r as unknown as Creditor
}
function csvToContract(r: Record<string, string>): Contract {
  return { ...r, items: (() => { try { return JSON.parse(r.items) } catch { return [] } })() } as unknown as Contract
}
function csvToCatalogItem(r: Record<string, string>): CatalogItem {
  return { ...r, unitPrice: parseFloat(r.unitPrice) || 0 } as unknown as CatalogItem
}
function csvToCategory(r: Record<string, string>): Category {
  return r as unknown as Category
}

// ── Download helper ───────────────────────────────────────────────────────────
function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob(['﻿' + content], { type: mime }) // BOM para Excel reconhecer UTF-8
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function today() {
  return new Date().toISOString().split('T')[0]
}

// ── Componente ────────────────────────────────────────────────────────────────
export function ImportExportView({ expenses, creditors, contracts, catalogItems, categories, onImported }: ImportExportViewProps) {
  // Export state
  const [exportSelected, setExportSelected] = useState<Set<ModuleKey>>(new Set(['despesas']))
  const [exportFormat,   setExportFormat]   = useState<'json' | 'csv'>('json')
  const [exporting,      setExporting]       = useState(false)

  // Import state
  const [importModule,   setImportModule]   = useState<ModuleKey>('despesas')
  const [importFile,     setImportFile]     = useState<File | null>(null)
  const [previewData,    setPreviewData]    = useState<unknown[] | null>(null)
  const [importing,      setImporting]      = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [keepIds,        setKeepIds]        = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Export ──────────────────────────────────────────────────────────────────
  const getData = useCallback((key: ModuleKey) => {
    switch (key) {
      case 'despesas':     return { data: expenses,     flatten: flattenExpense }
      case 'credores':     return { data: creditors,    flatten: flattenCreditor }
      case 'contratos':    return { data: contracts,    flatten: flattenContract }
      case 'catalogItems': return { data: catalogItems, flatten: flattenCatalogItem }
      case 'categorias':   return { data: categories,   flatten: flattenCategory }
    }
  }, [expenses, creditors, contracts, catalogItems, categories])

  const handleExport = async () => {
    if (!exportSelected.size) { toast.error('Selecione ao menos um módulo'); return }
    setExporting(true)
    try {
      if (exportFormat === 'json') {
        const payload: Record<string, unknown> = {}
        exportSelected.forEach(k => { payload[k] = getData(k).data })
        const filename = exportSelected.size === 1
          ? `sgfi-${[...exportSelected][0]}-${today()}.json`
          : `sgfi-exportacao-${today()}.json`
        downloadBlob(JSON.stringify(payload, null, 2), filename, 'application/json')
        toast.success(`Exportado com sucesso: ${filename}`)
      } else {
        // CSV: um arquivo por módulo
        exportSelected.forEach(k => {
          const { data, flatten } = getData(k)
          const rows = (data as any[]).map(flatten as any) as Record<string, unknown>[]
          const csv  = toCSV(rows)
          const cfg  = MODULES.find(m => m.key === k)!
          downloadBlob(csv, `sgfi-${k}-${today()}.csv`, 'text/csv;charset=utf-8')
          toast.success(`${cfg.label} exportado`)
        })
      }
    } finally {
      setExporting(false)
    }
  }

  // ── Import ──────────────────────────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportFile(file)
    setPreviewData(null)
    setImportProgress(0)

    const text = await file.text()
    const ext  = file.name.split('.').pop()?.toLowerCase()

    try {
      if (ext === 'json') {
        const parsed = JSON.parse(text)
        // pode ser array direto ou objeto com módulos
        let items: unknown[]
        if (Array.isArray(parsed)) {
          items = parsed
        } else if (parsed[importModule]) {
          items = parsed[importModule]
        } else {
          // tenta pegar o primeiro array encontrado
          const firstArr = Object.values(parsed).find(v => Array.isArray(v))
          items = (firstArr as unknown[]) ?? []
        }
        setPreviewData(items)
      } else if (ext === 'csv') {
        const rows = parseCSV(text)
        setPreviewData(rows)
      } else {
        toast.error('Formato não suportado. Use .json ou .csv')
        setImportFile(null)
      }
    } catch {
      toast.error('Erro ao ler o arquivo. Verifique se está no formato correto.')
      setImportFile(null)
    }

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleImport = async () => {
    if (!previewData?.length) return
    setImporting(true)
    setImportProgress(0)
    let ok = 0, fail = 0

    const isCSV = importFile?.name.endsWith('.csv')

    for (let i = 0; i < previewData.length; i++) {
      const raw = previewData[i] as any
      setImportProgress(Math.round(((i + 1) / previewData.length) * 100))
      try {
        switch (importModule) {
          case 'despesas': {
            const item: Expense = isCSV ? csvToExpense(raw) : raw
            if (!keepIds) item.id = `expense_${Date.now()}_${i}`
            await expensesApi.create(item); break
          }
          case 'credores': {
            const item: Creditor = isCSV ? csvToCreditor(raw) : raw
            if (!keepIds) item.id = `creditor_${Date.now()}_${i}`
            await creditorsApi.create(item); break
          }
          case 'contratos': {
            const item: Contract = isCSV ? csvToContract(raw) : raw
            if (!keepIds) item.id = `contract_${Date.now()}_${i}`
            await contractsApi.create(item); break
          }
          case 'catalogItems': {
            const item: CatalogItem = isCSV ? csvToCatalogItem(raw) : raw
            if (!keepIds) item.id = `catalog_${Date.now()}_${i}`
            await catalogItemsApi.create(item); break
          }
          case 'categorias': {
            const item: Category = isCSV ? csvToCategory(raw) : raw
            if (!keepIds) item.id = `category_${Date.now()}_${i}`
            await categoriesApi.create(item); break
          }
        }
        ok++
      } catch {
        fail++
      }
    }

    setImporting(false)
    setImportProgress(100)
    setPreviewData(null)
    setImportFile(null)
    onImported()

    if (fail === 0) {
      toast.success(`${ok} item${ok !== 1 ? 's' : ''} importado${ok !== 1 ? 's' : ''} com sucesso!`)
    } else {
      toast.warning(`${ok} importado${ok !== 1 ? 's' : ''}, ${fail} com erro`)
    }
  }

  const clearImport = () => {
    setImportFile(null)
    setPreviewData(null)
    setImportProgress(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const toggleModule = (key: ModuleKey) => {
    setExportSelected(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const selectAll = () => setExportSelected(new Set(MODULES.map(m => m.key)))
  const clearAll  = () => setExportSelected(new Set())

  const exportCounts: Record<ModuleKey, number> = {
    despesas:     expenses.length,
    credores:     creditors.length,
    contratos:    contracts.length,
    catalogItems: catalogItems.length,
    categorias:   categories.length,
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* ── EXPORTAÇÃO ────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileArrowDown size={20} weight="fill" className="text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Exportar Dados</CardTitle>
              <CardDescription>Selecione os módulos e o formato desejado</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Seleção de módulos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium">Módulos para exportar</Label>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={selectAll}>
                  Todos
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearAll}>
                  Limpar
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {MODULES.map(({ key, label, description, color }) => (
                <label
                  key={key}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:border-primary/40 ${
                    exportSelected.has(key) ? 'border-primary/50 bg-primary/5' : 'border-border'
                  }`}
                >
                  <Checkbox
                    checked={exportSelected.has(key)}
                    onCheckedChange={() => toggleModule(key)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{label}</span>
                      <Badge variant="secondary" className="text-[10px] h-4 px-1">
                        {exportCounts[key]}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">{description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <Separator />

          {/* Formato */}
          <div className="flex flex-wrap items-center gap-4">
            <Label className="text-sm font-medium shrink-0">Formato</Label>
            <div className="flex gap-2">
              <Button
                variant={exportFormat === 'json' ? 'default' : 'outline'}
                size="sm"
                className="gap-1.5"
                onClick={() => setExportFormat('json')}
              >
                <FileJs size={15} weight="fill" />
                JSON
              </Button>
              <Button
                variant={exportFormat === 'csv' ? 'default' : 'outline'}
                size="sm"
                className="gap-1.5"
                onClick={() => setExportFormat('csv')}
              >
                <FileCsv size={15} weight="fill" />
                CSV
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {exportFormat === 'json'
                ? 'Um único arquivo .json com todos os módulos selecionados'
                : 'Um arquivo .csv separado por módulo (ideal para Excel)'}
            </p>
          </div>

          <Button
            onClick={handleExport}
            disabled={exporting || !exportSelected.size}
            className="gap-2"
          >
            {exporting
              ? <CircleNotch size={16} className="animate-spin" />
              : <DownloadSimple size={16} weight="bold" />
            }
            {exporting ? 'Exportando...' : `Exportar ${exportSelected.size > 0 ? `(${[...exportSelected].reduce((s, k) => s + exportCounts[k], 0)} registros)` : ''}`}
          </Button>
        </CardContent>
      </Card>

      {/* ── IMPORTAÇÃO ────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-green-500/10">
              <FileArrowUp size={20} weight="fill" className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <CardTitle className="text-base">Importar Dados</CardTitle>
              <CardDescription>Importe registros a partir de arquivo .json ou .csv</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Módulo de destino */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Módulo de destino</Label>
              <Select value={importModule} onValueChange={v => { setImportModule(v as ModuleKey); clearImport() }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODULES.map(m => (
                    <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Opção de IDs */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Opções</Label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <Checkbox
                  checked={keepIds}
                  onCheckedChange={v => setKeepIds(!!v)}
                />
                <span className="text-sm">Manter IDs originais do arquivo</span>
              </label>
              <p className="text-[11px] text-muted-foreground">
                Desmarque para gerar novos IDs (evita conflitos)
              </p>
            </div>
          </div>

          {/* Upload */}
          {!importFile ? (
            <div
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/40 hover:bg-muted/30 transition-all"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault()
                const f = e.dataTransfer.files[0]
                if (f) {
                  const synth = { target: { files: [f] } } as unknown as React.ChangeEvent<HTMLInputElement>
                  handleFileChange(synth)
                }
              }}
            >
              <UploadSimple size={32} className="mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-sm font-medium text-muted-foreground">
                Clique ou arraste um arquivo aqui
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Suporta .json e .csv
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.csv"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <div className="space-y-3">
              {/* Info do arquivo */}
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                {importFile.name.endsWith('.json') ? (
                  <FileJs size={24} weight="fill" className="text-yellow-500 shrink-0" />
                ) : (
                  <FileCsv size={24} weight="fill" className="text-green-500 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{importFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(importFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={clearImport}>
                  <Trash size={15} />
                </Button>
              </div>

              {/* Preview */}
              {previewData !== null && (
                <div className={`flex items-start gap-2 p-3 rounded-lg border ${previewData.length > 0 ? 'border-green-200 bg-green-50 dark:border-green-800/40 dark:bg-green-900/10' : 'border-yellow-200 bg-yellow-50 dark:border-yellow-800/40 dark:bg-yellow-900/10'}`}>
                  {previewData.length > 0 ? (
                    <CheckCircle size={18} className="text-green-600 dark:text-green-400 shrink-0 mt-0.5" weight="fill" />
                  ) : (
                    <Warning size={18} className="text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" weight="fill" />
                  )}
                  <div>
                    <p className="text-sm font-medium">
                      {previewData.length > 0
                        ? `${previewData.length} registro${previewData.length !== 1 ? 's' : ''} encontrado${previewData.length !== 1 ? 's' : ''} para importar`
                        : 'Nenhum registro encontrado no arquivo'}
                    </p>
                    {previewData.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Destino: <span className="font-medium">{MODULES.find(m => m.key === importModule)?.label}</span>
                        {keepIds ? ' · IDs originais mantidos' : ' · Novos IDs gerados'}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Progresso */}
              {importing && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Importando...</span>
                    <span>{importProgress}%</span>
                  </div>
                  <Progress value={importProgress} className="h-2" />
                </div>
              )}

              {/* Botão de importar */}
              {previewData && previewData.length > 0 && !importing && importProgress < 100 && (
                <Button onClick={handleImport} className="gap-2 w-full" disabled={importing}>
                  <UploadSimple size={16} weight="bold" />
                  Importar {previewData.length} registro{previewData.length !== 1 ? 's' : ''}
                </Button>
              )}
            </div>
          )}

          {/* Aviso */}
          <div className="flex items-start gap-2 p-3 rounded-lg border border-blue-200/60 bg-blue-50/50 dark:border-blue-800/30 dark:bg-blue-900/10">
            <Info size={15} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" weight="fill" />
            <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
              <span className="font-semibold">Dica:</span> Para importar dados de outro sistema, exporte primeiro em JSON para garantir a integridade dos dados (especialmente Contratos com múltiplos itens). Use CSV para integração com Excel/planilhas.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
