import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Expense, Creditor, Category } from './types'
import { SystemEntity, SystemConfig } from './config-types'
import { formatCurrency, formatDate } from './calculations'

export interface ExportOptions {
  expenses: Expense[]
  creditors: Creditor[]
  categories?: Category[]
  startDate?: string
  endDate?: string
  includeMetrics?: boolean
  entity?: SystemEntity
  config?: SystemConfig
  generatedBy?: string
}

export function exportToExcel(options: ExportOptions) {
  const { expenses, creditors, startDate, endDate } = options

  const filteredExpenses = filterExpensesByDate(expenses, startDate, endDate)

  const expenseData = filteredExpenses.map((expense) => {
    const creditor = creditors.find((c) => c.id === expense.creditorId)
    return {
      ID: expense.id,
      Descrição: expense.description,
      Valor: expense.amount,
      'Valor Formatado': formatCurrency(expense.amount),
      Tipo: expense.type === 'fixed' ? 'Fixa' : 'Variável',
      Credor: creditor?.name || 'N/A',
      'CNPJ/CPF': creditor?.documentNumber || 'N/A',
      Vencimento: formatDate(expense.dueDate),
      Status: expense.status === 'paid' ? 'Pago' : expense.status === 'overdue' ? 'Vencido' : 'Pendente',
      'Data Pagamento': expense.paidAt ? formatDate(expense.paidAt) : 'N/A',
      'Data Criação': formatDate(expense.createdAt),
    }
  })

  const totalSpent = filteredExpenses
    .filter((e) => e.status === 'paid')
    .reduce((sum, e) => sum + e.amount, 0)
  
  const totalPending = filteredExpenses
    .filter((e) => e.status !== 'paid')
    .reduce((sum, e) => sum + e.amount, 0)

  const summaryData = [
    { Métrica: 'Total Pago', Valor: formatCurrency(totalSpent) },
    { Métrica: 'Total Pendente', Valor: formatCurrency(totalPending) },
    { Métrica: 'Total Geral', Valor: formatCurrency(totalSpent + totalPending) },
    { Métrica: 'Quantidade de Despesas', Valor: filteredExpenses.length },
  ]

  const wb = XLSX.utils.book_new()
  
  const wsExpenses = XLSX.utils.json_to_sheet(expenseData)
  const wsSummary = XLSX.utils.json_to_sheet(summaryData)
  
  const colWidths = [
    { wch: 20 },
    { wch: 30 },
    { wch: 12 },
    { wch: 15 },
    { wch: 12 },
    { wch: 25 },
    { wch: 18 },
    { wch: 14 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
  ]
  wsExpenses['!cols'] = colWidths

  XLSX.utils.book_append_sheet(wb, wsExpenses, 'Despesas')
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo')

  const fileName = `SGFI_Despesas_${getDateRangeString(startDate, endDate)}.xlsx`
  XLSX.writeFile(wb, fileName)

  return fileName
}

export function exportToPDF(options: ExportOptions) {
  const { expenses, creditors, startDate, endDate, includeMetrics = true, entity, config, generatedBy } = options

  const filteredExpenses = filterExpensesByDate(expenses, startDate, endDate)

  const doc = new jsPDF()
  
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  
  let yPosition = 15
  const imageHeight = 20
  const imageWidth = 20
  const headerSpacing = 10

  if (entity?.logoUrl || entity?.brasaoUrl) {
    try {
      const leftImageX = 20
      const rightImageX = pageWidth - 20 - imageWidth
      const imageY = yPosition

      if (entity.logoUrl) {
        try {
          const fmtLogo = entity.logoUrl.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG'
          doc.addImage(entity.logoUrl, fmtLogo, leftImageX, imageY, imageWidth, imageHeight)
        } catch (e) {
          console.warn('Erro ao adicionar logo:', e)
        }
      }

      if (entity.brasaoUrl) {
        try {
          const fmtBrasao = entity.brasaoUrl.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG'
          doc.addImage(entity.brasaoUrl, fmtBrasao, rightImageX, imageY, imageWidth, imageHeight)
        } catch (e) {
          console.warn('Erro ao adicionar brasão:', e)
        }
      }

      yPosition += imageHeight + headerSpacing
    } catch (error) {
      console.warn('Erro ao processar imagens:', error)
      yPosition += 5
    }
  }

  if (entity) {
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(entity.fullName, pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 6
    
    if (entity.documentNumber) {
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text(`CNPJ: ${entity.documentNumber}`, pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 5
    }
    
    if (entity.address) {
      doc.setFontSize(8)
      doc.text(entity.address, pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 4
    }
    
    if (entity.phone || entity.email) {
      const contactInfo = [entity.phone, entity.email].filter(Boolean).join(' | ')
      doc.setFontSize(8)
      doc.text(contactInfo, pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 5
    }
  }
  
  yPosition += 3

  if (startDate || endDate) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Período: ${getDateRangeString(startDate, endDate)}`, pageWidth / 2, yPosition, {
      align: 'center',
    })
    yPosition += 5
  }

  yPosition += 3

  if (includeMetrics) {
    const totalSpent = filteredExpenses
      .filter((e) => e.status === 'paid')
      .reduce((sum, e) => sum + e.amount, 0)
    
    const totalPending = filteredExpenses
      .filter((e) => e.status !== 'paid')
      .reduce((sum, e) => sum + e.amount, 0)

    const fixedExpenses = filteredExpenses
      .filter((e) => e.type === 'fixed')
      .reduce((sum, e) => sum + e.amount, 0)

    const variableExpenses = filteredExpenses
      .filter((e) => e.type === 'variable')
      .reduce((sum, e) => sum + e.amount, 0)

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Resumo Financeiro', 14, yPosition)
    yPosition += 8

    const summaryData = [
      ['Total Pago', formatCurrency(totalSpent)],
      ['Total Pendente', formatCurrency(totalPending)],
      ['Total Geral', formatCurrency(totalSpent + totalPending)],
      ['Despesas Fixas', formatCurrency(fixedExpenses)],
      ['Despesas Variáveis', formatCurrency(variableExpenses)],
      ['Quantidade', `${filteredExpenses.length} despesas`],
    ]

    autoTable(doc, {
      startY: yPosition,
      head: [['Métrica', 'Valor']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [53, 51, 133], textColor: 255 },
      styles: { fontSize: 10 },
      margin: { left: 14, right: 14 },
    })

    yPosition = (doc as any).lastAutoTable.finalY + 10
  }

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Detalhamento de Despesas', 14, yPosition)
  yPosition += 5

  const tableData = filteredExpenses.map((expense) => {
    const creditor = creditors.find((c) => c.id === expense.creditorId)
    return [
      expense.description,
      creditor?.name || 'N/A',
      formatCurrency(expense.amount),
      expense.type === 'fixed' ? 'Fixa' : 'Variável',
      formatDate(expense.dueDate),
      expense.status === 'paid' ? 'Pago' : expense.status === 'overdue' ? 'Vencido' : 'Pendente',
    ]
  })

  autoTable(doc, {
    startY: yPosition,
    head: [['Descrição', 'Credor', 'Valor', 'Tipo', 'Vencimento', 'Status']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [53, 51, 133], textColor: 255 },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 40 },
      2: { cellWidth: 25, halign: 'right' },
      3: { cellWidth: 20 },
      4: { cellWidth: 25 },
      5: { cellWidth: 20 },
    },
    margin: { left: 14, right: 14 },
  })

  const totalPages = (doc as any).internal.pages.length - 1
  const systemName = config?.headerText || 'SGFI - Sistema de Gestão Financeira Institucional'
  const footerText = config?.footerText || '© 2024 - Todos os direitos reservados'
  
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(60)
    doc.text(systemName, pageWidth / 2, pageHeight - 30, { align: 'center' })

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100)
    doc.text(footerText, pageWidth / 2, pageHeight - 25, { align: 'center' })

    doc.setFontSize(7)
    doc.setTextColor(130)
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, pageHeight - 17)

    if (generatedBy) {
      doc.text(`Gerado por: ${generatedBy}`, 14, pageHeight - 12)
    }

    doc.setTextColor(150)
    doc.setFontSize(8)
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - 14, pageHeight - 12, { align: 'right' })
  }

  const fileName = `SGFI_Relatorio_${getDateRangeString(startDate, endDate)}.pdf`
  doc.save(fileName)

  return fileName
}

function filterExpensesByDate(
  expenses: Expense[],
  startDate?: string,
  endDate?: string
): Expense[] {
  if (!startDate && !endDate) return expenses

  return expenses.filter((expense) => {
    const expenseDate = new Date(expense.dueDate)
    
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      return expenseDate >= start && expenseDate <= end
    }
    
    if (startDate) {
      const start = new Date(startDate)
      return expenseDate >= start
    }
    
    if (endDate) {
      const end = new Date(endDate)
      return expenseDate <= end
    }
    
    return true
  })
}

function getDateRangeString(startDate?: string, endDate?: string): string {
  const today = new Date().toISOString().split('T')[0]
  
  if (!startDate && !endDate) {
    return today.replace(/-/g, '')
  }
  
  if (startDate && endDate) {
    const start = startDate.split('T')[0].replace(/-/g, '')
    const end = endDate.split('T')[0].replace(/-/g, '')
    return `${start}_${end}`
  }
  
  if (startDate) {
    return `${startDate.split('T')[0].replace(/-/g, '')}_hoje`
  }
  
  if (endDate) {
    return `ate_${endDate.split('T')[0].replace(/-/g, '')}`
  }
  
  return today.replace(/-/g, '')
}
