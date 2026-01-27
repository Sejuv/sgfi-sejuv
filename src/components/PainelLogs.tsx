import { useState, useEffect, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { logService } from "@/lib/log-service"
import { LogAcesso } from "@/lib/log-types"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { 
  MagnifyingGlass, 
  Trash, 
  Download,
  FunnelSimple,
  Calendar
} from "@phosphor-icons/react"
import { Badge } from "@/components/ui/badge"

export function PainelLogs() {
  const [logs, setLogs] = useState<LogAcesso[]>([])
  const [filtroTexto, setFiltroTexto] = useState("")
  const [filtroAcao, setFiltroAcao] = useState<string>("todas")
  const [filtroTela, setFiltroTela] = useState<string>("todas")
  const [filtroUsuario, setFiltroUsuario] = useState<string>("todos")
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")

  useEffect(() => {
    carregarLogs()
  }, [])

  const carregarLogs = () => {
    const logsCarregados = logService.getLogs()
    setLogs(logsCarregados)
  }

  const logsFiltrados = useMemo(() => {
    return logs.filter(log => {
      // Filtro de texto
      if (filtroTexto) {
        const texto = filtroTexto.toLowerCase()
        const contemTexto = 
          log.usuarioNome.toLowerCase().includes(texto) ||
          log.usuarioEmail.toLowerCase().includes(texto) ||
          log.acao.toLowerCase().includes(texto) ||
          log.tela.toLowerCase().includes(texto) ||
          (log.detalhes?.toLowerCase().includes(texto) ?? false)
        
        if (!contemTexto) return false
      }

      // Filtro de ação
      if (filtroAcao !== "todas" && log.acao !== filtroAcao) {
        return false
      }

      // Filtro de tela
      if (filtroTela !== "todas" && log.tela !== filtroTela) {
        return false
      }

      // Filtro de usuário
      if (filtroUsuario !== "todos" && log.usuarioEmail !== filtroUsuario) {
        return false
      }

      // Filtro de data início
      if (dataInicio) {
        const dataLog = new Date(log.timestamp)
        const dataInicioObj = new Date(dataInicio)
        if (dataLog < dataInicioObj) return false
      }

      // Filtro de data fim
      if (dataFim) {
        const dataLog = new Date(log.timestamp)
        const dataFimObj = new Date(dataFim)
        dataFimObj.setHours(23, 59, 59, 999)
        if (dataLog > dataFimObj) return false
      }

      return true
    }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }, [logs, filtroTexto, filtroAcao, filtroTela, filtroUsuario, dataInicio, dataFim])

  const usuariosUnicos = useMemo(() => {
    const emails = new Set(logs.map(log => log.usuarioEmail))
    return Array.from(emails).sort()
  }, [logs])

  const acoesUnicas = useMemo(() => {
    const acoes = new Set(logs.map(log => log.acao))
    return Array.from(acoes).sort()
  }, [logs])

  const telasUnicas = useMemo(() => {
    const telas = new Set(logs.map(log => log.tela))
    return Array.from(telas).sort()
  }, [logs])

  const handleLimparLogs = () => {
    if (window.confirm('Tem certeza que deseja limpar todos os logs? Esta ação não pode ser desfeita.')) {
      logService.limparLogs()
      setLogs([])
      toast.success("Logs limpos com sucesso")
    }
  }

  const handleExportarLogs = () => {
    const logsJSON = logService.exportarLogs()
    const blob = new Blob([logsJSON], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `logs-sistema-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.json`
    link.click()
    URL.revokeObjectURL(url)
    toast.success("Logs exportados com sucesso")
  }

  const limparFiltros = () => {
    setFiltroTexto("")
    setFiltroAcao("todas")
    setFiltroTela("todas")
    setFiltroUsuario("todos")
    setDataInicio("")
    setDataFim("")
  }

  const getAcaoBadge = (acao: string) => {
    const cores: Record<string, string> = {
      login: "bg-green-500",
      logout: "bg-gray-500",
      criar: "bg-blue-500",
      editar: "bg-yellow-500",
      excluir: "bg-red-500",
      visualizar: "bg-purple-500",
      importar: "bg-cyan-500",
      exportar: "bg-orange-500",
      acesso: "bg-indigo-500"
    }
    
    return (
      <Badge className={`${cores[acao] || 'bg-gray-500'} text-white`}>
        {acao}
      </Badge>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Logs do Sistema</h2>
        <p className="text-muted-foreground mt-1">
          Rastreamento e relatórios de acessos de usuários
        </p>
      </div>

      {/* Filtros */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <FunnelSimple className="h-5 w-5" weight="bold" />
          <h3 className="text-lg font-semibold">Filtros</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Busca por texto */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Buscar</label>
            <div className="relative">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" weight="bold" />
              <Input
                placeholder="Buscar em logs..."
                value={filtroTexto}
                onChange={(e) => setFiltroTexto(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filtro por ação */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Ação</label>
            <Select value={filtroAcao} onValueChange={setFiltroAcao}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as ações" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as ações</SelectItem>
                {acoesUnicas.map(acao => (
                  <SelectItem key={acao} value={acao}>{acao}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por tela */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Tela</label>
            <Select value={filtroTela} onValueChange={setFiltroTela}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as telas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as telas</SelectItem>
                {telasUnicas.map(tela => (
                  <SelectItem key={tela} value={tela}>{tela}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por usuário */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Usuário</label>
            <Select value={filtroUsuario} onValueChange={setFiltroUsuario}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os usuários" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os usuários</SelectItem>
                {usuariosUnicos.map(email => (
                  <SelectItem key={email} value={email}>{email}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data início */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Data Início</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" weight="bold" />
              <Input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Data fim */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Data Fim</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" weight="bold" />
              <Input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={limparFiltros}>
            Limpar Filtros
          </Button>
        </div>
      </Card>

      {/* Ações */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {logsFiltrados.length} de {logs.length} registros
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportarLogs} className="gap-2">
            <Download className="h-4 w-4" weight="bold" />
            Exportar
          </Button>
          <Button variant="destructive" onClick={handleLimparLogs} className="gap-2">
            <Trash className="h-4 w-4" weight="bold" />
            Limpar Logs
          </Button>
        </div>
      </div>

      {/* Tabela de Logs */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Tela</TableHead>
                <TableHead>Detalhes</TableHead>
                <TableHead>Navegador</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logsFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhum log encontrado
                  </TableCell>
                </TableRow>
              ) : (
                logsFiltrados.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(log.timestamp, "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{log.usuarioNome}</div>
                        <div className="text-xs text-muted-foreground">{log.usuarioEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getAcaoBadge(log.acao)}
                    </TableCell>
                    <TableCell>{log.tela}</TableCell>
                    <TableCell className="max-w-md truncate">
                      {log.detalhes || '-'}
                    </TableCell>
                    <TableCell>{log.navegador || 'N/A'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
