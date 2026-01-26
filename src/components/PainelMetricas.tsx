import { useMemo, useState } from "react"
import { ProcessoDespesa } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
} from "recharts"
import { formatCurrency } from "@/lib/utils"
import { exportMetricasToExcel, printMetricas } from "@/lib/export-utils"
import { TrendUp, ChartBar, Coins, Calendar, Users, ClockCounterClockwise, Target, FunnelSimple, FileCsv, Printer, Funnel, X } from "@phosphor-icons/react"
import { toast } from "sonner"

interface PainelMetricasProps {
  processos: ProcessoDespesa[]
}

const COLORS = [
  "oklch(0.646 0.222 41.116)",
  "oklch(0.6 0.118 184.704)",
  "oklch(0.398 0.07 227.392)",
  "oklch(0.828 0.189 84.429)",
  "oklch(0.769 0.188 70.08)",
  "oklch(0.55 0.12 150)",
  "oklch(0.65 0.15 280)",
  "oklch(0.70 0.18 320)",
  "oklch(0.60 0.20 60)",
]

export function PainelMetricas({ processos }: PainelMetricasProps) {
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

  const handleExport = () => {
    exportMetricasToExcel(processosFiltrados)
    toast.success("Métricas exportadas com sucesso")
  }

  const handlePrint = () => {
    printMetricas(processosFiltrados)
    toast.success("Preparando impressão...")
  }
  const metricasPorSecretaria = useMemo(() => {
    const grupos = processosFiltrados.reduce((acc, processo) => {
      if (!acc[processo.secretaria]) {
        acc[processo.secretaria] = {
          secretaria: processo.secretaria,
          total: 0,
          quantidade: 0,
          pendentes: 0,
        }
      }
      acc[processo.secretaria].total += processo.valor
      acc[processo.secretaria].quantidade += 1
      if (!processo.dataTesouraria) {
        acc[processo.secretaria].pendentes += 1
      }
      return acc
    }, {} as Record<string, { secretaria: string; total: number; quantidade: number; pendentes: number }>)

    return Object.values(grupos).sort((a, b) => b.total - a.total)
  }, [processos])

  const metricasPorMes = useMemo(() => {
    const grupos = processos.reduce((acc, processo) => {
      if (!acc[processo.mes]) {
        acc[processo.mes] = {
          mes: processo.mes,
          total: 0,
          quantidade: 0,
        }
      }
      acc[processo.mes].total += processo.valor
      acc[processo.mes].quantidade += 1
      return acc
    }, {} as Record<string, { mes: string; total: number; quantidade: number }>)

    const mesesOrdenados = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ]

    return mesesOrdenados
      .map((mes) => grupos[mes] || { mes, total: 0, quantidade: 0 })
      .filter((item) => item.total > 0)
  }, [processos])

  const metricasPorRecurso = useMemo(() => {
    const grupos = processos.reduce((acc, processo) => {
      if (!acc[processo.recurso]) {
        acc[processo.recurso] = {
          recurso: processo.recurso,
          total: 0,
        }
      }
      acc[processo.recurso].total += processo.valor
      return acc
    }, {} as Record<string, { recurso: string; total: number }>)

    return Object.values(grupos).sort((a, b) => b.total - a.total)
  }, [processos])

  const metricasPorTipoConta = useMemo(() => {
    const grupos = processos.reduce((acc, processo) => {
      if (!acc[processo.conta]) {
        acc[processo.conta] = {
          conta: processo.conta,
          total: 0,
          quantidade: 0,
        }
      }
      acc[processo.conta].total += processo.valor
      acc[processo.conta].quantidade += 1
      return acc
    }, {} as Record<string, { conta: string; total: number; quantidade: number }>)

    return Object.values(grupos).sort((a, b) => b.total - a.total)
  }, [processos])

  const resumoGeral = useMemo(() => {
    const total = processos.reduce((acc, p) => acc + p.valor, 0)
    const pendentes = processos.filter((p) => !p.dataTesouraria).length
    const concluidos = processos.length - pendentes
    const mediaValor = processos.length > 0 ? total / processos.length : 0

    return {
      total,
      quantidade: processos.length,
      pendentes,
      concluidos,
      mediaValor,
      percentualConcluido: processos.length > 0 ? (concluidos / processos.length) * 100 : 0,
    }
  }, [processos])

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-sm mb-1">{payload[0].payload.secretaria || payload[0].payload.mes}</p>
          <p className="text-primary font-bold">{formatCurrency(payload[0].value)}</p>
          {payload[0].payload.quantidade && (
            <p className="text-xs text-muted-foreground mt-1">
              {payload[0].payload.quantidade} processo(s)
            </p>
          )}
        </div>
      )
    }
    return null
  }

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-sm mb-1">{payload[0].name}</p>
          <p className="text-primary font-bold">{formatCurrency(payload[0].value)}</p>
        </div>
      )
    }
    return null
  }

  const metricasPorCredor = useMemo(() => {
    const grupos = processos.reduce((acc, processo) => {
      if (!acc[processo.credor]) {
        acc[processo.credor] = {
          credor: processo.credor,
          total: 0,
          quantidade: 0,
        }
      }
      acc[processo.credor].total += processo.valor
      acc[processo.credor].quantidade += 1
      return acc
    }, {} as Record<string, { credor: string; total: number; quantidade: number }>)

    return Object.values(grupos).sort((a, b) => b.total - a.total)
  }, [processos])

  const metricasPorSetor = useMemo(() => {
    const grupos = processos.reduce((acc, processo) => {
      if (!acc[processo.setor]) {
        acc[processo.setor] = {
          setor: processo.setor,
          total: 0,
          quantidade: 0,
        }
      }
      acc[processo.setor].total += processo.valor
      acc[processo.setor].quantidade += 1
      return acc
    }, {} as Record<string, { setor: string; total: number; quantidade: number }>)

    return Object.values(grupos).sort((a, b) => b.total - a.total)
  }, [processos])

  const metricasWorkflow = useMemo(() => {
    const etapas = [
      { nome: "Controladoria", campo: "dataControladoria" as keyof ProcessoDespesa },
      { nome: "Contabilidade", campo: "dataContabilidade" as keyof ProcessoDespesa },
      { nome: "Compras", campo: "dataCompras" as keyof ProcessoDespesa },
      { nome: "SEFIN", campo: "dataSefin" as keyof ProcessoDespesa },
      { nome: "Tesouraria", campo: "dataTesouraria" as keyof ProcessoDespesa },
    ]

    return etapas.map((etapa) => {
      const concluidos = processos.filter((p) => p[etapa.campo]).length
      const pendentes = processos.length - concluidos
      const percentual = processos.length > 0 ? (concluidos / processos.length) * 100 : 0

      return {
        etapa: etapa.nome,
        concluidos,
        pendentes,
        percentual,
      }
    })
  }, [processos])

  const metricasComparativas = useMemo(() => {
    const secretarias = metricasPorSecretaria.slice(0, 6)
    return secretarias.map((s) => ({
      secretaria: s.secretaria.length > 20 ? s.secretaria.substring(0, 20) + "..." : s.secretaria,
      valorMedio: s.quantidade > 0 ? s.total / s.quantidade : 0,
      quantidade: s.quantidade,
      total: s.total,
      pendentes: s.pendentes,
    }))
  }, [metricasPorSecretaria])

  const metricasTempoPorMes = useMemo(() => {
    const grupos = processos.reduce((acc, processo) => {
      if (!acc[processo.mes]) {
        acc[processo.mes] = {
          mes: processo.mes,
          total: 0,
          pendentes: 0,
          concluidos: 0,
        }
      }
      acc[processo.mes].total += 1
      if (processo.dataTesouraria) {
        acc[processo.mes].concluidos += 1
      } else {
        acc[processo.mes].pendentes += 1
      }
      return acc
    }, {} as Record<string, { mes: string; total: number; pendentes: number; concluidos: number }>)

    const mesesOrdenados = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
    ]

    return mesesOrdenados
      .map((mes) => grupos[mes] || { mes, total: 0, pendentes: 0, concluidos: 0 })
      .filter((item) => item.total > 0)
  }, [processos])

  const metricasRadar = useMemo(() => {
    const top6Secretarias = metricasPorSecretaria.slice(0, 6)
    const maxValor = Math.max(...top6Secretarias.map(s => s.total))
    
    return top6Secretarias.map((s) => ({
      secretaria: s.secretaria.split(" ").slice(0, 2).join(" "),
      valor: maxValor > 0 ? (s.total / maxValor) * 100 : 0,
      processos: s.quantidade,
    }))
  }, [metricasPorSecretaria])

  const distribuicaoValores = useMemo(() => {
    const ranges = [
      { label: "0-10k", min: 0, max: 10000 },
      { label: "10k-50k", min: 10000, max: 50000 },
      { label: "50k-100k", min: 50000, max: 100000 },
      { label: "100k-500k", min: 100000, max: 500000 },
      { label: "500k+", min: 500000, max: Infinity },
    ]

    return ranges.map((range) => {
      const count = processos.filter(
        (p) => p.valor >= range.min && p.valor < range.max
      ).length
      return {
        faixa: range.label,
        quantidade: count,
      }
    }).filter((item) => item.quantidade > 0)
  }, [processos])

  return (
    <div className="space-y-6 overflow-y-scroll h-full" style={{scrollBehavior: 'smooth'}}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Métricas e Relatórios</h2>
          <p className="text-sm text-muted-foreground">Análise detalhada dos processos</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Geral</CardTitle>
            <Coins className="h-5 w-5 text-primary" weight="duotone" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary tabular-nums">
              {formatCurrency(resumoGeral.total)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {resumoGeral.quantidade} processos
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Valor Médio</CardTitle>
            <ChartBar className="h-5 w-5 text-accent" weight="duotone" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent tabular-nums">
              {formatCurrency(resumoGeral.mediaValor)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              por processo
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-100/50 to-amber-50/50 border-amber-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
            <Calendar className="h-5 w-5 text-amber-700" weight="duotone" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700 tabular-nums">
              {resumoGeral.pendentes}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              aguardando tesouraria
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-100/50 to-emerald-50/50 border-emerald-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Concluídos</CardTitle>
            <TrendUp className="h-5 w-5 text-emerald-700" weight="duotone" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700 tabular-nums">
              {resumoGeral.concluidos}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {resumoGeral.percentualConcluido.toFixed(1)}% do total
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Gastos por Secretaria</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={metricasPorSecretaria} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.88 0.01 250)" />
                <XAxis
                  dataKey="secretaria"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  interval={0}
                  tick={{ fontSize: 11, fill: "oklch(0.50 0.01 250)" }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "oklch(0.50 0.01 250)" }}
                  tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" fill="oklch(0.45 0.15 250)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Distribuição por Recurso</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={metricasPorRecurso}
                  dataKey="total"
                  nameKey="recurso"
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  label={(entry) => `${entry.recurso.split(" ")[0]}`}
                  labelLine={{ stroke: "oklch(0.50 0.01 250)", strokeWidth: 1 }}
                >
                  {metricasPorRecurso.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  wrapperStyle={{ fontSize: "12px" }}
                  formatter={(value) => value.length > 25 ? value.substring(0, 25) + "..." : value}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Evolução Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={metricasPorMes} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.88 0.01 250)" />
                <XAxis
                  dataKey="mes"
                  tick={{ fontSize: 11, fill: "oklch(0.50 0.01 250)" }}
                  tickFormatter={(value) => value.substring(0, 3)}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "oklch(0.50 0.01 250)" }}
                  tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="oklch(0.55 0.12 150)"
                  strokeWidth={3}
                  dot={{ fill: "oklch(0.55 0.12 150)", r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Tipo de Conta</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={metricasPorTipoConta} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.88 0.01 250)" />
                <XAxis
                  dataKey="conta"
                  tick={{ fontSize: 12, fill: "oklch(0.50 0.01 250)" }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "oklch(0.50 0.01 250)" }}
                  tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" fill="oklch(0.6 0.118 184.704)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Ranking de Secretarias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metricasPorSecretaria.slice(0, 5).map((item, index) => {
              const percentual = (item.total / resumoGeral.total) * 100
              return (
                <div key={item.secretaria} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{item.secretaria}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantidade} processos • {item.pendentes} pendentes
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary tabular-nums">{formatCurrency(item.total)}</p>
                      <p className="text-xs text-muted-foreground">{percentual.toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${percentual}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Users weight="duotone" className="h-5 w-5 text-primary" />
              Top 10 Credores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={metricasPorCredor.slice(0, 10)}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.88 0.01 250)" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "oklch(0.50 0.01 250)" }}
                  tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                />
                <YAxis
                  type="category"
                  dataKey="credor"
                  tick={{ fontSize: 10, fill: "oklch(0.50 0.01 250)" }}
                  width={95}
                  tickFormatter={(value) => value.length > 18 ? value.substring(0, 18) + "..." : value}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                          <p className="font-semibold text-sm mb-1">{payload[0].payload.credor}</p>
                          <p className="text-primary font-bold">{formatCurrency(payload[0].value as number)}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {payload[0].payload.quantidade} processo(s)
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar dataKey="total" fill="oklch(0.646 0.222 41.116)" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Target weight="duotone" className="h-5 w-5 text-accent" />
              Gastos por Setor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={metricasPorSetor.slice(0, 10)}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.88 0.01 250)" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "oklch(0.50 0.01 250)" }}
                  tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                />
                <YAxis
                  type="category"
                  dataKey="setor"
                  tick={{ fontSize: 10, fill: "oklch(0.50 0.01 250)" }}
                  width={95}
                  tickFormatter={(value) => value.length > 18 ? value.substring(0, 18) + "..." : value}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                          <p className="font-semibold text-sm mb-1">{payload[0].payload.setor}</p>
                          <p className="text-accent font-bold">{formatCurrency(payload[0].value as number)}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {payload[0].payload.quantidade} processo(s)
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar dataKey="total" fill="oklch(0.55 0.12 150)" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <ClockCounterClockwise weight="duotone" className="h-5 w-5 text-primary" />
              Status do Workflow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart
                data={metricasWorkflow}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.88 0.01 250)" />
                <XAxis
                  dataKey="etapa"
                  tick={{ fontSize: 11, fill: "oklch(0.50 0.01 250)" }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "oklch(0.50 0.01 250)" }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                          <p className="font-semibold text-sm mb-2">{payload[0].payload.etapa}</p>
                          <div className="space-y-1">
                            <p className="text-xs text-emerald-600 font-medium">
                              Concluídos: {payload[0].payload.concluidos}
                            </p>
                            <p className="text-xs text-amber-600 font-medium">
                              Pendentes: {payload[0].payload.pendentes}
                            </p>
                            <p className="text-xs text-primary font-bold">
                              {payload[0].payload.percentual.toFixed(1)}% concluído
                            </p>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Legend />
                <Bar dataKey="concluidos" fill="oklch(0.65 0.15 145)" name="Concluídos" radius={[8, 8, 0, 0]} />
                <Bar dataKey="pendentes" fill="oklch(0.75 0.15 85)" name="Pendentes" radius={[8, 8, 0, 0]} />
                <Line
                  type="monotone"
                  dataKey="percentual"
                  stroke="oklch(0.45 0.15 250)"
                  strokeWidth={2}
                  dot={{ fill: "oklch(0.45 0.15 250)", r: 4 }}
                  name="% Concluído"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <ChartBar weight="duotone" className="h-5 w-5 text-accent" />
              Processos Mensais: Concluídos vs Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart
                data={metricasTempoPorMes}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="colorConcluidos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.65 0.15 145)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="oklch(0.65 0.15 145)" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="colorPendentes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.75 0.15 85)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="oklch(0.75 0.15 85)" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.88 0.01 250)" />
                <XAxis
                  dataKey="mes"
                  tick={{ fontSize: 11, fill: "oklch(0.50 0.01 250)" }}
                  tickFormatter={(value) => value.substring(0, 3)}
                />
                <YAxis tick={{ fontSize: 11, fill: "oklch(0.50 0.01 250)" }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                          <p className="font-semibold text-sm mb-2">{payload[0].payload.mes}</p>
                          <div className="space-y-1">
                            <p className="text-xs text-emerald-600 font-medium">
                              Concluídos: {payload[0].payload.concluidos}
                            </p>
                            <p className="text-xs text-amber-600 font-medium">
                              Pendentes: {payload[0].payload.pendentes}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Total: {payload[0].payload.total}
                            </p>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="concluidos"
                  stroke="oklch(0.65 0.15 145)"
                  fillOpacity={1}
                  fill="url(#colorConcluidos)"
                  name="Concluídos"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="pendentes"
                  stroke="oklch(0.75 0.15 85)"
                  fillOpacity={1}
                  fill="url(#colorPendentes)"
                  name="Pendentes"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Análise Comparativa de Secretarias</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart
                data={metricasComparativas}
                margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.88 0.01 250)" />
                <XAxis
                  dataKey="secretaria"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  interval={0}
                  tick={{ fontSize: 10, fill: "oklch(0.50 0.01 250)" }}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11, fill: "oklch(0.50 0.01 250)" }}
                  tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11, fill: "oklch(0.50 0.01 250)" }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                          <p className="font-semibold text-sm mb-2">{payload[0].payload.secretaria}</p>
                          <div className="space-y-1 text-xs">
                            <p className="text-primary font-bold">
                              Valor Médio: {formatCurrency(payload[0].payload.valorMedio)}
                            </p>
                            <p className="text-muted-foreground">
                              Processos: {payload[0].payload.quantidade}
                            </p>
                            <p className="text-amber-600 font-medium">
                              Pendentes: {payload[0].payload.pendentes}
                            </p>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="valorMedio" fill="oklch(0.6 0.118 184.704)" name="Valor Médio" radius={[8, 8, 0, 0]} />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="quantidade"
                  stroke="oklch(0.55 0.12 150)"
                  strokeWidth={2}
                  dot={{ fill: "oklch(0.55 0.12 150)", r: 4 }}
                  name="Quantidade"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <FunnelSimple weight="duotone" className="h-5 w-5 text-primary" />
              Distribuição por Faixa de Valor
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={distribuicaoValores}
                  dataKey="quantidade"
                  nameKey="faixa"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ faixa, percent }) => `${faixa}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: "oklch(0.50 0.01 250)", strokeWidth: 1 }}
                >
                  {distribuicaoValores.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                          <p className="font-semibold text-sm mb-1">{payload[0].name}</p>
                          <p className="text-primary font-bold">{payload[0].value} processos</p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  wrapperStyle={{ fontSize: "12px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {metricasRadar.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Radar de Performance - Top 6 Secretarias</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={metricasRadar}>
                <PolarGrid stroke="oklch(0.88 0.01 250)" />
                <PolarAngleAxis
                  dataKey="secretaria"
                  tick={{ fontSize: 11, fill: "oklch(0.50 0.01 250)" }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fontSize: 10, fill: "oklch(0.50 0.01 250)" }}
                />
                <Radar
                  name="Valor Relativo (%)"
                  dataKey="valor"
                  stroke="oklch(0.45 0.15 250)"
                  fill="oklch(0.45 0.15 250)"
                  fillOpacity={0.6}
                  strokeWidth={2}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const valor = typeof payload[0].value === 'number' ? payload[0].value : 0
                      return (
                        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                          <p className="font-semibold text-sm mb-1">{payload[0].payload.secretaria}</p>
                          <p className="text-primary font-bold">{valor.toFixed(1)}%</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {payload[0].payload.processos} processos
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-900">📊 Insights de Eficiência</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-xs text-blue-800">
              <p className="font-medium">
                Taxa de conclusão: <span className="text-blue-950 font-bold">{resumoGeral.percentualConcluido.toFixed(1)}%</span>
              </p>
              <p>
                {resumoGeral.percentualConcluido >= 70 
                  ? "✓ Ótima performance no processamento"
                  : resumoGeral.percentualConcluido >= 50
                  ? "⚠ Performance moderada, pode melhorar"
                  : "⚡ Atenção: muitos processos pendentes"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-900">🎯 Análise de Concentração</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-xs text-purple-800">
              {metricasPorCredor.length > 0 && (
                <>
                  <p className="font-medium">Top credor: <span className="text-purple-950 font-bold">{metricasPorCredor[0].credor.substring(0, 20)}</span></p>
                  <p>
                    Representa {((metricasPorCredor[0].total / resumoGeral.total) * 100).toFixed(1)}% do total
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-900">💡 Recomendações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-xs text-green-800">
              {resumoGeral.pendentes > 10 && (
                <p>• Priorizar {resumoGeral.pendentes} processos pendentes</p>
              )}
              {metricasPorSecretaria.length > 0 && (
                <p>• Revisar processos de {metricasPorSecretaria[0].secretaria.split(" ").slice(0, 3).join(" ")}</p>
              )}
              <p>• Manter monitoramento contínuo do fluxo</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
