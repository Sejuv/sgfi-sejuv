import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Expense, Creditor, Category } from '@/lib/types'
import { SystemEntity, SystemConfig } from '@/lib/config-types'
import { exportToExcel, exportToPDF } from '@/lib/export'
import { FileXls, FilePdf, Calendar, Check } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { FloatingWindow } from '@/components/FloatingWindow'
import { useAuth } from '@/lib/auth-context'
import { entitiesApi, settingsApi } from '@/lib/api'

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  expenses: Expense[]
  creditors: Creditor[]
  categories?: Category[]
}

export function ExportDialog({ open, onOpenChange, expenses, creditors, categories }: ExportDialogProps) {
  const { currentUser } = useAuth()
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [includeMetrics, setIncludeMetrics] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [activeEntity, setActiveEntity] = useState<SystemEntity | undefined>(undefined)
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    headerText: 'SGFI - Sistema de Gestão Financeira Institucional',
    footerText: '© 2024 - Todos os direitos reservados',
  })

  useEffect(() => {
    entitiesApi.list().then(list => { if (list.length > 0) setActiveEntity(list[0]) }).catch(() => {})
    settingsApi.list().then(s => {
      if (s.headerText || s.footerText) {
        setSystemConfig(prev => ({
          ...prev,
          headerText: s.headerText || prev.headerText,
          footerText: s.footerText || prev.footerText,
        }))
      }
    }).catch(() => {})
  }, [])

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      setIsExporting(true)

      const options = {
        expenses,
        creditors,
        categories,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        includeMetrics,
        entity: activeEntity,
        config: systemConfig,
        generatedBy: currentUser?.name,
      }

      let fileName: string

      if (format === 'excel') {
        fileName = exportToExcel(options)
        toast.success(`Arquivo Excel exportado: ${fileName}`)
      } else {
        fileName = exportToPDF(options)
        toast.success(`Arquivo PDF exportado: ${fileName}`)
      }

      setTimeout(() => {
        onOpenChange(false)
        setStartDate('')
        setEndDate('')
        setIncludeMetrics(true)
      }, 500)
    } catch (error) {
      console.error('Erro ao exportar:', error)
      toast.error('Erro ao exportar arquivo. Tente novamente.')
    } finally {
      setIsExporting(false)
    }
  }

  const filteredCount = expenses.filter((expense) => {
    if (!startDate && !endDate) return true
    const expenseDate = new Date(expense.dueDate)
    
    if (startDate && endDate) {
      return expenseDate >= new Date(startDate) && expenseDate <= new Date(endDate)
    }
    if (startDate) {
      return expenseDate >= new Date(startDate)
    }
    if (endDate) {
      return expenseDate <= new Date(endDate)
    }
    return true
  }).length

  return (
    <FloatingWindow
      open={open}
      onOpenChange={onOpenChange}
      title="Exportar Dados"
      description="Exporte os dados das despesas para Excel ou PDF"
    >
      <div className="h-full flex flex-col">
        <div className="flex-1 overflow-auto">
          <div className="grid gap-6">
            <div className="grid gap-4">
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <Calendar size={24} weight="duotone" className="text-primary" />
                <div className="flex-1">
                  <p className="font-semibold text-sm">Filtro de Período</p>
                  <p className="text-xs text-muted-foreground">Deixe em branco para exportar tudo</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="start-date">Data Início</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="end-date">Data Fim</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                  />
                </div>
              </div>

              {(startDate || endDate) && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-accent/10 p-3 rounded-md">
                  <Check size={16} weight="bold" className="text-accent" />
                  <span>
                    {filteredCount} despesa{filteredCount !== 1 && 's'} será{filteredCount !== 1 && 'm'} exportada{filteredCount !== 1 && 's'}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <Checkbox
                id="include-metrics"
                checked={includeMetrics}
                onCheckedChange={(checked) => setIncludeMetrics(checked as boolean)}
              />
              <Label
                htmlFor="include-metrics"
                className="text-sm font-normal cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Incluir resumo financeiro no relatório
              </Label>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-6 border-t mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => handleExport('excel')}
            disabled={isExporting}
            className="bg-accent hover:bg-accent/90"
          >
            <FileXls className="mr-2" size={18} weight="fill" />
            Excel
          </Button>
          <Button
            onClick={() => handleExport('pdf')}
            disabled={isExporting}
            className="bg-destructive hover:bg-destructive/90"
          >
            <FilePdf className="mr-2" size={18} weight="fill" />
            PDF
          </Button>
        </div>
      </div>
    </FloatingWindow>
  )
}
