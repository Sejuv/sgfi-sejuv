import * as XLSX from "xlsx"
import { ProcessoDespesa } from "./types"
import { 
  Secretaria, 
  Setor, 
  Conta, 
  Credor, 
  Objeto, 
  Recurso 
} from "./cadastros-types"

export function downloadProcessosTemplate() {
  const template = [
    {
      ano: 2024,
      secretaria: "SECRETARIA DE EDUCAÇÃO",
      setor: "DEPARTAMENTO PEDAGÓGICO",
      conta: "CUSTEIO",
      credor: "FORNECEDOR EXEMPLO LTDA",
      objeto: "MATERIAL ESCOLAR",
      mes: "Janeiro",
      valor: 1500.50,
      recurso: "RECURSO PRÓPRIO",
      did: "DID-001/2024",
      nf: "NF-12345",
      dataControladoria: "",
      dataContabilidade: "",
      dataCompras: "",
      dataSefin: "",
      dataTesouraria: "",
    }
  ]

  const ws = XLSX.utils.json_to_sheet(template)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Processos")
  
  XLSX.writeFile(wb, "modelo_processos.xlsx")
}

export function downloadSecretariasTemplate() {
  const template = [
    {
      nome: "SECRETARIA DE EDUCAÇÃO",
      sigla: "SEMED",
      responsavel: "João Silva",
      ativo: true,
    }
  ]

  const ws = XLSX.utils.json_to_sheet(template)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Secretarias")
  
  XLSX.writeFile(wb, "modelo_secretarias.xlsx")
}

export function downloadSetoresTemplate() {
  const template = [
    {
      nome: "DEPARTAMENTO PEDAGÓGICO",
      secretariaId: "ID_DA_SECRETARIA",
      descricao: "Responsável pela parte pedagógica",
      ativo: true,
      ordem: 0,
    }
  ]

  const ws = XLSX.utils.json_to_sheet(template)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Setores")
  
  XLSX.writeFile(wb, "modelo_setores.xlsx")
}

export function downloadContasTemplate() {
  const template = [
    {
      tipo: "CUSTEIO",
      descricao: "Despesas de custeio",
      ativo: true,
    }
  ]

  const ws = XLSX.utils.json_to_sheet(template)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Contas")
  
  XLSX.writeFile(wb, "modelo_contas.xlsx")
}

export function downloadCredoresTemplate() {
  const template = [
    {
      nome: "FORNECEDOR EXEMPLO LTDA",
      cpfCnpj: "12.345.678/0001-90",
      tipo: "Pessoa Jurídica",
      telefone: "(85) 3333-4444",
      email: "contato@fornecedor.com",
      endereco: "Rua Exemplo, 123",
      ativo: true,
    }
  ]

  const ws = XLSX.utils.json_to_sheet(template)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Credores")
  
  XLSX.writeFile(wb, "modelo_credores.xlsx")
}

export function downloadObjetosTemplate() {
  const template = [
    {
      descricao: "MATERIAL ESCOLAR",
      categoria: "EDUCAÇÃO",
      ativo: true,
    }
  ]

  const ws = XLSX.utils.json_to_sheet(template)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Objetos")
  
  XLSX.writeFile(wb, "modelo_objetos.xlsx")
}

export function downloadRecursosTemplate() {
  const template = [
    {
      nome: "RECURSO PRÓPRIO",
      secretariaId: "ID_DA_SECRETARIA",
      ativo: true,
    }
  ]

  const ws = XLSX.utils.json_to_sheet(template)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Recursos")
  
  XLSX.writeFile(wb, "modelo_recursos.xlsx")
}

export async function importProcessosFromExcel(
  file: File
): Promise<Omit<ProcessoDespesa, "id">[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: "binary" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const json = XLSX.utils.sheet_to_json(worksheet)
        
        const processos = json.map((row: any) => ({
          ano: Number(row.ano) || new Date().getFullYear(),
          secretaria: String(row.secretaria || ""),
          setor: String(row.setor || ""),
          conta: String(row.conta || ""),
          credor: String(row.credor || ""),
          objeto: String(row.objeto || ""),
          mes: String(row.mes || ""),
          valor: Number(row.valor) || 0,
          recurso: String(row.recurso || ""),
          did: String(row.did || ""),
          nf: String(row.nf || ""),
          dataControladoria: row.dataControladoria ? String(row.dataControladoria) : undefined,
          dataContabilidade: row.dataContabilidade ? String(row.dataContabilidade) : undefined,
          dataCompras: row.dataCompras ? String(row.dataCompras) : undefined,
          dataSefin: row.dataSefin ? String(row.dataSefin) : undefined,
          dataTesouraria: row.dataTesouraria ? String(row.dataTesouraria) : undefined,
        }))
        
        resolve(processos)
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = () => {
      reject(new Error("Erro ao ler arquivo"))
    }
    
    reader.readAsBinaryString(file)
  })
}

export async function importSecretariasFromExcel(
  file: File
): Promise<Omit<Secretaria, "id">[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: "binary" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const json = XLSX.utils.sheet_to_json(worksheet)
        
        const secretarias = json.map((row: any) => ({
          nome: String(row.nome || ""),
          sigla: String(row.sigla || ""),
          responsavel: row.responsavel ? String(row.responsavel) : undefined,
          ativo: row.ativo === false ? false : true,
        }))
        
        resolve(secretarias)
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = () => {
      reject(new Error("Erro ao ler arquivo"))
    }
    
    reader.readAsBinaryString(file)
  })
}

export async function importSetoresFromExcel(
  file: File
): Promise<Omit<Setor, "id">[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: "binary" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const json = XLSX.utils.sheet_to_json(worksheet)
        
        const setores = json.map((row: any) => ({
          nome: String(row.nome || ""),
          secretariaId: String(row.secretariaId || ""),
          descricao: row.descricao ? String(row.descricao) : undefined,
          ativo: row.ativo === false ? false : true,
          ordem: Number(row.ordem) || 0,
        }))
        
        resolve(setores)
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = () => {
      reject(new Error("Erro ao ler arquivo"))
    }
    
    reader.readAsBinaryString(file)
  })
}

export async function importContasFromExcel(
  file: File
): Promise<Omit<Conta, "id">[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: "binary" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const json = XLSX.utils.sheet_to_json(worksheet)
        
        const contas = json.map((row: any) => ({
          tipo: String(row.tipo || ""),
          descricao: row.descricao ? String(row.descricao) : undefined,
          ativo: row.ativo === false ? false : true,
        }))
        
        resolve(contas)
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = () => {
      reject(new Error("Erro ao ler arquivo"))
    }
    
    reader.readAsBinaryString(file)
  })
}

export async function importCredoresFromExcel(
  file: File
): Promise<Omit<Credor, "id">[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: "binary" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const json = XLSX.utils.sheet_to_json(worksheet)
        
        const credores = json.map((row: any) => ({
          nome: String(row.nome || ""),
          cpfCnpj: String(row.cpfCnpj || ""),
          tipo: (row.tipo === "Pessoa Física" ? "Pessoa Física" : "Pessoa Jurídica") as "Pessoa Física" | "Pessoa Jurídica",
          telefone: row.telefone ? String(row.telefone) : undefined,
          email: row.email ? String(row.email) : undefined,
          endereco: row.endereco ? String(row.endereco) : undefined,
          ativo: row.ativo === false ? false : true,
        }))
        
        resolve(credores)
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = () => {
      reject(new Error("Erro ao ler arquivo"))
    }
    
    reader.readAsBinaryString(file)
  })
}

export async function importObjetosFromExcel(
  file: File
): Promise<Omit<Objeto, "id">[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: "binary" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const json = XLSX.utils.sheet_to_json(worksheet)
        
        const objetos = json.map((row: any) => ({
          descricao: String(row.descricao || ""),
          categoria: row.categoria ? String(row.categoria) : undefined,
          ativo: row.ativo === false ? false : true,
        }))
        
        resolve(objetos)
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = () => {
      reject(new Error("Erro ao ler arquivo"))
    }
    
    reader.readAsBinaryString(file)
  })
}

export async function importRecursosFromExcel(
  file: File
): Promise<Omit<Recurso, "id">[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: "binary" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const json = XLSX.utils.sheet_to_json(worksheet)
        
        const recursos = json.map((row: any) => ({
          nome: String(row.nome || ""),
          secretariaId: String(row.secretariaId || ""),
          ativo: row.ativo === false ? false : true,
        }))
        
        resolve(recursos)
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = () => {
      reject(new Error("Erro ao ler arquivo"))
    }
    
    reader.readAsBinaryString(file)
  })
}
