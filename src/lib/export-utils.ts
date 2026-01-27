import { ProcessoDespesa } from "./types"
import { Secretaria, Setor, Conta, Credor, Objeto, Recurso } from "./cadastros-types"
import { formatCurrency, formatDate } from "./utils"
import * as XLSX from "xlsx"

export function exportToExcel(data: any[], filename: string, sheetName: string = "Dados") {
  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  XLSX.writeFile(workbook, `${filename}.xlsx`)
}

export function exportProcessosToExcel(processos: ProcessoDespesa[]) {
  const data = processos.map((p) => ({
    Ano: p.ano,
    Secretaria: p.secretaria,
    Setor: p.setor,
    Conta: p.conta,
    Credor: p.credor,
    Objeto: p.objeto,
    Mês: p.mes,
    Valor: p.valor,
    Recurso: p.recurso,
    DID: p.did || "",
    "Nota Fiscal": p.nf || "",
    Controladoria: p.dataControladoria || "",
    Contabilidade: p.dataContabilidade || "",
    Compras: p.dataCompras || "",
    SEFIN: p.dataSefin || "",
    Tesouraria: p.dataTesouraria || "",
    Status: p.dataTesouraria ? "Completo" : "Pendente",
  }))

  exportToExcel(data, `processos-${new Date().toISOString().split("T")[0]}`, "Processos")
}

export function exportSecretariasToExcel(secretarias: Secretaria[]) {
  const data = secretarias.map((s) => ({
    Nome: s.nome,
    Sigla: s.sigla,
    Responsável: s.responsavel || "",
    Status: s.ativo ? "Ativo" : "Inativo",
  }))

  exportToExcel(data, `secretarias-${new Date().toISOString().split("T")[0]}`, "Secretarias")
}

export function exportSetoresToExcel(setores: Setor[], secretarias: Secretaria[]) {
  const data = setores
    .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
    .map((s) => {
      const secretaria = secretarias.find((sec) => sec.id === s.secretariaId)
      return {
        Secretaria: secretaria ? `${secretaria.sigla} - ${secretaria.nome}` : "N/A",
        Nome: s.nome,
        Descrição: s.descricao || "",
        Ordem: s.ordem || 0,
        Status: s.ativo ? "Ativo" : "Inativo",
      }
    })

  exportToExcel(data, `setores-${new Date().toISOString().split("T")[0]}`, "Setores")
}

export function exportContasToExcel(contas: Conta[]) {
  const data = contas.map((c) => ({
    Tipo: c.tipo,
    Descrição: c.descricao || "",
    Status: c.ativo ? "Ativo" : "Inativo",
  }))

  exportToExcel(data, `contas-${new Date().toISOString().split("T")[0]}`, "Contas")
}

export function exportCredoresToExcel(credores: Credor[]) {
  const data = credores.map((c) => ({
    Nome: c.nome,
    Tipo: c.tipo,
    "CPF/CNPJ": c.cpfCnpj,
    Telefone: c.telefone || "",
    Email: c.email || "",
    Endereço: c.endereco || "",
    Status: c.ativo ? "Ativo" : "Inativo",
  }))

  exportToExcel(data, `credores-${new Date().toISOString().split("T")[0]}`, "Credores")
}

export function exportObjetosToExcel(objetos: Objeto[]) {
  const data = objetos.map((o) => ({
    Descrição: o.descricao,
    Categoria: o.categoria || "",
    Status: o.ativo ? "Ativo" : "Inativo",
  }))

  exportToExcel(data, `objetos-${new Date().toISOString().split("T")[0]}`, "Objetos")
}

export function exportRecursosToExcel(recursos: Recurso[], secretarias: Secretaria[]) {
  const data = recursos.map((r) => {
    const secretaria = secretarias.find((s) => s.id === r.secretariaId)
    return {
      Nome: r.nome,
      Secretaria: secretaria ? `${secretaria.sigla} - ${secretaria.nome}` : "N/A",
      Status: r.ativo ? "Ativo" : "Inativo",
    }
  })

  exportToExcel(data, `recursos-${new Date().toISOString().split("T")[0]}`, "Recursos")
}

export function exportResumoFinanceiroToExcel(
  processos: ProcessoDespesa[],
  tipoResumo: "credor" | "secretaria" | "recurso" | "setor" | "conta" | "mes" = "credor"
) {
  const data: any[] = []
  let totalGeral = 0

  if (tipoResumo === "credor") {
    const credoresMap = new Map<string, Map<string, number>>()
    processos.forEach((processo) => {
      if (!credoresMap.has(processo.credor)) {
        credoresMap.set(processo.credor, new Map())
      }
      const objetosMap = credoresMap.get(processo.credor)!
      const valorAtual = objetosMap.get(processo.objeto) || 0
      objetosMap.set(processo.objeto, valorAtual + processo.valor)
    })

    credoresMap.forEach((objetos, credor) => {
      let totalCredor = 0
      objetos.forEach((valor, objeto) => {
        data.push({ Credor: credor, Objeto: objeto, Valor: valor })
        totalCredor += valor
      })
      data.push({ Credor: `SUBTOTAL ${credor}`, Objeto: "", Valor: totalCredor })
      totalGeral += totalCredor
    })
  } else if (tipoResumo === "secretaria") {
    const map = new Map<string, Map<string, number>>()
    processos.forEach((processo) => {
      if (!map.has(processo.secretaria)) {
        map.set(processo.secretaria, new Map())
      }
      const setoresMap = map.get(processo.secretaria)!
      const valorAtual = setoresMap.get(processo.setor) || 0
      setoresMap.set(processo.setor, valorAtual + processo.valor)
    })

    map.forEach((setores, secretaria) => {
      let totalSecretaria = 0
      setores.forEach((valor, setor) => {
        data.push({ Secretaria: secretaria, Setor: setor, Valor: valor })
        totalSecretaria += valor
      })
      data.push({ Secretaria: `SUBTOTAL ${secretaria}`, Setor: "", Valor: totalSecretaria })
      totalGeral += totalSecretaria
    })
  } else if (tipoResumo === "recurso") {
    const map = new Map<string, Map<string, number>>()
    processos.forEach((processo) => {
      if (!map.has(processo.recurso)) {
        map.set(processo.recurso, new Map())
      }
      const contasMap = map.get(processo.recurso)!
      const valorAtual = contasMap.get(processo.conta) || 0
      contasMap.set(processo.conta, valorAtual + processo.valor)
    })

    map.forEach((contas, recurso) => {
      let totalRecurso = 0
      contas.forEach((valor, conta) => {
        data.push({ Recurso: recurso, Conta: conta, Valor: valor })
        totalRecurso += valor
      })
      data.push({ Recurso: `SUBTOTAL ${recurso}`, Conta: "", Valor: totalRecurso })
      totalGeral += totalRecurso
    })
  } else if (tipoResumo === "setor") {
    const map = new Map<string, Map<string, number>>()
    processos.forEach((processo) => {
      if (!map.has(processo.setor)) {
        map.set(processo.setor, new Map())
      }
      const contasMap = map.get(processo.setor)!
      const valorAtual = contasMap.get(processo.conta) || 0
      contasMap.set(processo.conta, valorAtual + processo.valor)
    })

    map.forEach((contas, setor) => {
      let totalSetor = 0
      contas.forEach((valor, conta) => {
        data.push({ Setor: setor, Conta: conta, Valor: valor })
        totalSetor += valor
      })
      data.push({ Setor: `SUBTOTAL ${setor}`, Conta: "", Valor: totalSetor })
      totalGeral += totalSetor
    })
  } else if (tipoResumo === "conta") {
    const map = new Map<string, Map<string, number>>()
    processos.forEach((processo) => {
      if (!map.has(processo.conta)) {
        map.set(processo.conta, new Map())
      }
      const objetosMap = map.get(processo.conta)!
      const valorAtual = objetosMap.get(processo.objeto) || 0
      objetosMap.set(processo.objeto, valorAtual + processo.valor)
    })

    map.forEach((objetos, conta) => {
      let totalConta = 0
      objetos.forEach((valor, objeto) => {
        data.push({ Conta: conta, Objeto: objeto, Valor: valor })
        totalConta += valor
      })
      data.push({ Conta: `SUBTOTAL ${conta}`, Objeto: "", Valor: totalConta })
      totalGeral += totalConta
    })
  } else if (tipoResumo === "mes") {
    const map = new Map<string, Map<string, number>>()
    processos.forEach((processo) => {
      if (!map.has(processo.mes)) {
        map.set(processo.mes, new Map())
      }
      const secretariasMap = map.get(processo.mes)!
      const valorAtual = secretariasMap.get(processo.secretaria) || 0
      secretariasMap.set(processo.secretaria, valorAtual + processo.valor)
    })

    const mesesOrdenados = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
    
    const mesesOrdenadosArray = Array.from(map.entries()).sort((a, b) => 
      mesesOrdenados.indexOf(a[0]) - mesesOrdenados.indexOf(b[0])
    )

    mesesOrdenadosArray.forEach(([mes, secretarias]) => {
      let totalMes = 0
      secretarias.forEach((valor, secretaria) => {
        data.push({ Mês: mes, Secretaria: secretaria, Valor: valor })
        totalMes += valor
      })
      data.push({ Mês: `SUBTOTAL ${mes}`, Secretaria: "", Valor: totalMes })
      totalGeral += totalMes
    })
  }

  data.push({ [Object.keys(data[0])[0]]: "TOTAL GERAL", [Object.keys(data[0])[1]]: "", Valor: totalGeral })

  const tipoNome = {
    credor: "Credor",
    secretaria: "Secretaria",
    recurso: "Recurso",
    setor: "Setor",
    conta: "Conta",
    mes: "Mensal"
  }

  exportToExcel(data, `resumo-${tipoResumo}-${new Date().toISOString().split("T")[0]}`, `Resumo por ${tipoNome[tipoResumo]}`)
}

export function exportMetricasToExcel(processos: ProcessoDespesa[]) {
  const metricasPorSecretaria = processos.reduce((acc, processo) => {
    if (!acc[processo.secretaria]) {
      acc[processo.secretaria] = {
        Secretaria: processo.secretaria,
        "Total (R$)": 0,
        Quantidade: 0,
        Pendentes: 0,
      }
    }
    acc[processo.secretaria]["Total (R$)"] += processo.valor
    acc[processo.secretaria].Quantidade += 1
    if (!processo.dataTesouraria) {
      acc[processo.secretaria].Pendentes += 1
    }
    return acc
  }, {} as Record<string, any>)

  const data = Object.values(metricasPorSecretaria).sort(
    (a, b) => b["Total (R$)"] - a["Total (R$)"]
  )

  exportToExcel(data, `metricas-${new Date().toISOString().split("T")[0]}`)
}

export function printProcessos(processos: ProcessoDespesa[]) {
  const printWindow = window.open("", "_blank")
  if (!printWindow) return

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Relatório de Processos</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          font-size: 12px;
        }
        h1 {
          font-size: 18px;
          margin-bottom: 10px;
          color: #333;
        }
        .header {
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 2px solid #333;
        }
        .info {
          margin-bottom: 10px;
          color: #666;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f4f4f4;
          font-weight: bold;
        }
        .tesouraria {
          background-color: #fef3c7;
        }
        .pendente {
          color: #d97706;
          font-weight: bold;
        }
        .completo {
          color: #059669;
          font-weight: bold;
        }
        .text-right {
          text-align: right;
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
        <div class="info">Relatório de Processos</div>
        <div class="info">Data de Geração: ${new Date().toLocaleString("pt-BR")}</div>
        <div class="info">Total de Processos: ${processos.length}</div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Ano</th>
            <th>Secretaria</th>
            <th>Setor</th>
            <th>Conta</th>
            <th>Credor</th>
            <th>Objeto</th>
            <th>Mês</th>
            <th class="text-right">Valor</th>
            <th>Recurso</th>
            <th>DID</th>
            <th>NF</th>
            <th>Controladoria</th>
            <th>Contabilidade</th>
            <th>Compras</th>
            <th>SEFIN</th>
            <th class="tesouraria">Tesouraria</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${processos
            .map(
              (p) => `
            <tr>
              <td>${p.ano}</td>
              <td>${p.secretaria}</td>
              <td>${p.setor}</td>
              <td>${p.conta}</td>
              <td>${p.credor}</td>
              <td>${p.objeto}</td>
              <td>${p.mes}</td>
              <td class="text-right">${formatCurrency(p.valor)}</td>
              <td>${p.recurso}</td>
              <td>${p.did || "-"}</td>
              <td>${p.nf || "-"}</td>
              <td>${formatDate(p.dataControladoria)}</td>
              <td>${formatDate(p.dataContabilidade)}</td>
              <td>${formatDate(p.dataCompras)}</td>
              <td>${formatDate(p.dataSefin)}</td>
              <td class="tesouraria">${formatDate(p.dataTesouraria)}</td>
              <td class="${p.dataTesouraria ? "completo" : "pendente"}">
                ${p.dataTesouraria ? "Completo" : "Pendente"}
              </td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </body>
    </html>
  `

  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.onload = () => {
    printWindow.print()
  }
}

export function printResumoFinanceiro(processos: ProcessoDespesa[]) {
  const credoresMap = new Map<string, { objetos: Map<string, number>; total: number }>()

  processos.forEach((processo) => {
    if (!credoresMap.has(processo.credor)) {
      credoresMap.set(processo.credor, { objetos: new Map(), total: 0 })
    }
    const credorResumo = credoresMap.get(processo.credor)!
    const valorObjeto = credorResumo.objetos.get(processo.objeto) || 0
    credorResumo.objetos.set(processo.objeto, valorObjeto + processo.valor)
    credorResumo.total += processo.valor
  })

  const totalGeral = processos.reduce((acc, p) => acc + p.valor, 0)

  const printWindow = window.open("", "_blank")
  if (!printWindow) return

  let tableRows = ""
  credoresMap.forEach((credorData, credor) => {
    tableRows += `
      <tr class="credor-row">
        <td colspan="2"><strong>${credor}</strong></td>
        <td class="text-right"><strong>${formatCurrency(credorData.total)}</strong></td>
      </tr>
    `
    credorData.objetos.forEach((valor, objeto) => {
      tableRows += `
        <tr class="objeto-row">
          <td width="30"></td>
          <td>${objeto}</td>
          <td class="text-right">${formatCurrency(valor)}</td>
        </tr>
      `
    })
  })

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Resumo Financeiro</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          font-size: 12px;
        }
        h1 {
          font-size: 18px;
          margin-bottom: 10px;
          color: #333;
        }
        .header {
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 2px solid #333;
        }
        .info {
          margin-bottom: 10px;
          color: #666;
        }
        .total-geral {
          font-size: 16px;
          font-weight: bold;
          color: #1e40af;
          margin: 20px 0;
          padding: 15px;
          background-color: #dbeafe;
          border-radius: 5px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f4f4f4;
          font-weight: bold;
        }
        .credor-row {
          background-color: #f9fafb;
        }
        .objeto-row td {
          font-size: 11px;
        }
        .text-right {
          text-align: right;
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
        <div class="info">Resumo Financeiro por Credor e Objeto</div>
        <div class="info">Data de Geração: ${new Date().toLocaleString("pt-BR")}</div>
        <div class="info">Total de Processos: ${processos.length}</div>
      </div>
      <div class="total-geral">
        Total Geral: ${formatCurrency(totalGeral)}
      </div>
      <table>
        <thead>
          <tr>
            <th colspan="2">Credor / Objeto</th>
            <th class="text-right">Valor</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </body>
    </html>
  `

  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.onload = () => {
    printWindow.print()
  }
}

export function printMetricas(processos: ProcessoDespesa[]) {
  const metricasPorSecretaria = processos.reduce((acc, processo) => {
    if (!acc[processo.secretaria]) {
      acc[processo.secretaria] = { total: 0, quantidade: 0, pendentes: 0 }
    }
    acc[processo.secretaria].total += processo.valor
    acc[processo.secretaria].quantidade += 1
    if (!processo.dataTesouraria) {
      acc[processo.secretaria].pendentes += 1
    }
    return acc
  }, {} as Record<string, { total: number; quantidade: number; pendentes: number }>)

  const totalGeral = processos.reduce((acc, p) => acc + p.valor, 0)
  const totalPendentes = processos.filter((p) => !p.dataTesouraria).length

  const printWindow = window.open("", "_blank")
  if (!printWindow) return

  const tableRows = Object.entries(metricasPorSecretaria)
    .sort(([, a], [, b]) => b.total - a.total)
    .map(
      ([secretaria, data]) => `
      <tr>
        <td>${secretaria}</td>
        <td class="text-right">${formatCurrency(data.total)}</td>
        <td class="text-center">${data.quantidade}</td>
        <td class="text-center">${data.pendentes}</td>
        <td class="text-right">${((data.total / totalGeral) * 100).toFixed(1)}%</td>
      </tr>
    `
    )
    .join("")

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Métricas e Relatórios</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          font-size: 12px;
        }
        h1 {
          font-size: 18px;
          margin-bottom: 10px;
          color: #333;
        }
        .header {
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 2px solid #333;
        }
        .info {
          margin-bottom: 10px;
          color: #666;
        }
        .summary {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin: 20px 0;
        }
        .summary-card {
          padding: 15px;
          background-color: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 5px;
        }
        .summary-card h3 {
          font-size: 12px;
          color: #666;
          margin: 0 0 5px 0;
        }
        .summary-card .value {
          font-size: 20px;
          font-weight: bold;
          color: #1e40af;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f4f4f4;
          font-weight: bold;
        }
        .text-right {
          text-align: right;
        }
        .text-center {
          text-align: center;
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
        <div class="info">Métricas e Relatórios</div>
        <div class="info">Data de Geração: ${new Date().toLocaleString("pt-BR")}</div>
      </div>
      <div class="summary">
        <div class="summary-card">
          <h3>Total Geral</h3>
          <div class="value">${formatCurrency(totalGeral)}</div>
        </div>
        <div class="summary-card">
          <h3>Total de Processos</h3>
          <div class="value">${processos.length}</div>
        </div>
        <div class="summary-card">
          <h3>Processos Pendentes</h3>
          <div class="value">${totalPendentes}</div>
        </div>
      </div>
      <h2 style="margin-top: 30px; font-size: 16px;">Gastos por Secretaria</h2>
      <table>
        <thead>
          <tr>
            <th>Secretaria</th>
            <th class="text-right">Total</th>
            <th class="text-center">Quantidade</th>
            <th class="text-center">Pendentes</th>
            <th class="text-right">% do Total</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </body>
    </html>
  `

  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.onload = () => {
    printWindow.print()
  }
}


export function exportResumoFinanceiroPDF(
  processos: ProcessoDespesa[],
  tipoResumo: "credor" | "secretaria" | "recurso" | "setor" | "conta" | "mes" = "credor"
) {
  const tipoNomes = {
    credor: { principal: "Credor", secundario: "Objeto" },
    secretaria: { principal: "Secretaria", secundario: "Setor" },
    recurso: { principal: "Recurso", secundario: "Conta" },
    setor: { principal: "Setor", secundario: "Conta" },
    conta: { principal: "Conta", secundario: "Objeto" },
    mes: { principal: "Mês", secundario: "Secretaria" }
  }

  const nomes = tipoNomes[tipoResumo]
  let resumoHTML = ""
  let totalGeral = 0

  const gerarResumo = (map: Map<string, Map<string, number>>, ordenar: boolean = true) => {
    const entries = ordenar 
      ? Array.from(map.entries()).sort((a, b) => {
          const totalA = Array.from(a[1].values()).reduce((sum, val) => sum + val, 0)
          const totalB = Array.from(b[1].values()).reduce((sum, val) => sum + val, 0)
          return totalB - totalA
        })
      : Array.from(map.entries())

    entries.forEach(([principal, itens]) => {
      let totalPrincipal = 0
      resumoHTML += `
        <tr style="background-color: #f3f4f6;">
          <td colspan="2" style="padding: 12px 8px; font-weight: bold; font-size: 13px;">${principal}</td>
          <td></td>
        </tr>
      `
      
      Array.from(itens.entries())
        .sort(([, a], [, b]) => b - a)
        .forEach(([secundario, valor]) => {
          resumoHTML += `
            <tr>
              <td style="padding: 8px 8px 8px 24px; width: 30px;"></td>
              <td style="padding: 8px; font-size: 12px;">${secundario}</td>
              <td style="padding: 8px; text-align: right; font-size: 12px;">${formatCurrency(valor)}</td>
            </tr>
          `
          totalPrincipal += valor
        })
      
      resumoHTML += `
        <tr style="border-top: 2px solid #d1d5db;">
          <td colspan="2" style="padding: 10px 8px; font-weight: bold; font-size: 12px;">SUBTOTAL ${principal}</td>
          <td style="padding: 10px 8px; text-align: right; font-weight: bold; font-size: 12px; color: #1e40af;">${formatCurrency(totalPrincipal)}</td>
        </tr>
      `
      totalGeral += totalPrincipal
    })
  }

  if (tipoResumo === "credor") {
    const map = new Map<string, Map<string, number>>()
    processos.forEach(p => {
      const m = map.get(p.credor)!
      m.set(p.objeto, (m.get(p.objeto) || 0) + p.valor)
    })
    gerarResumo(map)
  } else if (tipoResumo === "secretaria") {
    const map = new Map<string, Map<string, number>>()
    processos.forEach(p => {
      const m = map.get(p.secretaria)!
      m.set(p.setor, (m.get(p.setor) || 0) + p.valor)
    })
    gerarResumo(map)
  } else if (tipoResumo === "recurso") {
    const map = new Map<string, Map<string, number>>()
    processos.forEach(p => {
      const m = map.get(p.recurso)!
      m.set(p.conta, (m.get(p.conta) || 0) + p.valor)
    })
    gerarResumo(map)
  } else if (tipoResumo === "setor") {
    const map = new Map<string, Map<string, number>>()
    processos.forEach(p => {
      const m = map.get(p.setor)!
      m.set(p.conta, (m.get(p.conta) || 0) + p.valor)
    })
    gerarResumo(map)
  } else if (tipoResumo === "conta") {
    const map = new Map<string, Map<string, number>>()
    processos.forEach(p => {
      const m = map.get(p.conta)!
      m.set(p.objeto, (m.get(p.objeto) || 0) + p.valor)
    })
    gerarResumo(map)
  } else if (tipoResumo === "mes") {
    const map = new Map<string, Map<string, number>>()
    processos.forEach(p => {
      const m = map.get(p.mes)!
      m.set(p.secretaria, (m.get(p.secretaria) || 0) + p.valor)
    })
    
    const mesesOrdenados = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
    const mapOrdenado = new Map(
      Array.from(map.entries()).sort((a, b) => 
        mesesOrdenados.indexOf(a[0]) - mesesOrdenados.indexOf(b[0])
      )
    )
    gerarResumo(mapOrdenado, false)
  }

  const html = `
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Resumo Financeiro - ${nomes.principal}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          font-size: 12px;
        }
        .header {
          margin-bottom: 25px;
          padding-bottom: 15px;
          border-bottom: 3px solid #1e40af;
        }
        h1 {
          font-size: 20px;
          margin: 0 0 8px 0;
          color: #1e3a8a;
        }
        .info {
          margin: 5px 0;
          color: #6b7280;
          font-size: 11px;
        }
        .total-card {
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          border: 2px solid #60a5fa;
        }
        .total-card .label {
          font-size: 11px;
          color: #1e40af;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .total-card .value {
          font-size: 24px;
          font-weight: bold;
          color: #1e3a8a;
          margin-top: 5px;
        }
        .total-card .subtitle {
          font-size: 12px;
          color: #3b82f6;
          margin-top: 5px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }
        th, td {
          border: 1px solid #e5e7eb;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #1e40af;
          color: white;
          font-weight: bold;
          font-size: 12px;
          padding: 12px 8px;
        }
        .total-geral {
          background-color: #1e3a8a;
          color: white;
          font-weight: bold;
          font-size: 14px;
        }
        @media print {
          body { margin: 0; padding: 15px; }
          @page { margin: 1.5cm; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Sistema de Gestão de Despesas</h1>
        <div class="info">Prefeitura Municipal de Irauçuba - CE</div>
        <div class="info">Resumo Financeiro por ${nomes.principal}</div>
        <div class="info">Gerado em: ${new Date().toLocaleString("pt-BR")}</div>
      </div>
      
      <div class="total-card">
        <div class="label">Total Geral</div>
        <div class="value">${formatCurrency(totalGeral)}</div>
        <div class="subtitle">${processos.length} processo(s)</div>
      </div>

      <table>
        <thead>
          <tr>
            <th colspan="2">${nomes.principal} / ${nomes.secundario}</th>
            <th style="text-align: right; width: 150px;">Valor</th>
          </tr>
        </thead>
        <tbody>
          ${resumoHTML}
          <tr class="total-geral">
            <td colspan="2" style="padding: 15px 8px;">TOTAL GERAL</td>
            <td style="padding: 15px 8px; text-align: right;">${formatCurrency(totalGeral)}</td>
          </tr>
        </tbody>
      </table>
    </body>
    </html>
  `

  const printWindow = window.open("", "_blank")

  printWindow.document.write(html)
  printWindow.document.close()
  
  setTimeout(() => {
    printWindow.print()
  }, 250)
}

