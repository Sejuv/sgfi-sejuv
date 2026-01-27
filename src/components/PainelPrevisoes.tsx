import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChartLineUp, TrendUp, TrendDown, CalendarBlank, CurrencyDollar, Funnel, ChartLine } from "@phosphor-icons/react"
import { ProcessoDespesa } from "@/lib/types"
import { Credor } from "@/lib/cadastros-types"
import { Recurso, Objeto, Secretaria } from "@/lib/cadastros-types"
import { useFirebaseKV } from "@/hooks/useFirebaseKV"
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface PainelPrevisoesProps {
  processos: ProcessoDespesa[]
}

type PeriodoPrevisao = "mensal" | "trimestral" | "semestral" | "anual"
type TipoAnalise = "credor" | "recurso" | "objeto" | "secretaria" | "geral"

interface PrevisaoDespesa {
  nome: string
  mediaHistorica: number
  tendencia: "alta" | "baixa" | "estavel"
  variacao: number
  previsaoProximoPeriodo: number
  confiabilidade: number
  historicoValores: number[]
}

export function PainelPrevisoes({ processos }: PainelPrevisoesProps) {
  const [credores] = useFirebaseKV<Credor[]>("cadastro-credores", [])
  const [recursos] = useFirebaseKV<Recurso[]>("cadastro-recursos", [])
  const [objetos] = useFirebaseKV<Objeto[]>("cadastro-objetos", [])
  const [secretarias] = useFirebaseKV<Secretaria[]>("cadastro-secretarias", [])

  const [periodo, setPeriodo] = useState<PeriodoPrevisao>("mensal")
  const [tipoAnalise, setTipoAnalise] = useState<TipoAnalise>("geral")
  const [filtroCredor, setFiltroCredor] = useState<string>("todos")
  const [filtroRecurso, setFiltroRecurso] = useState<string>("todos")
  const [filtroObjeto, setFiltroObjeto] = useState<string>("todos")
  const [filtroSecretaria, setFiltroSecretaria] = useState<string>("todos")
  const [anoBase, setAnoBase] = useState<string>(new Date().getFullYear().toString())

  // Função para calcular o número de meses no período
  const getMesesPorPeriodo = (periodo: PeriodoPrevisao): number => {
    switch (periodo) {
      case "mensal": return 1
      case "trimestral": return 3
      case "semestral": return 6
      case "anual": return 12
    }
  }

  // Função para agrupar processos por período
  const agruparPorPeriodo = (processos: ProcessoDespesa[], periodo: PeriodoPrevisao) => {
    const mesesPorPeriodo = getMesesPorPeriodo(periodo)
    const grupos: { [key: string]: ProcessoDespesa[] } = {}

    processos.forEach((processo) => {
      if (!processo.mes || !processo.ano) return

      const ano = typeof processo.ano === 'string' ? parseInt(processo.ano) : processo.ano
      const mes = typeof processo.mes === 'string' ? parseInt(processo.mes) : processo.mes
      
      // Calcular o período (ex: "2025-T1" para trimestral)
      const periodoIndex = Math.floor((mes - 1) / mesesPorPeriodo)
      const chave = `${ano}-P${periodoIndex + 1}`

      if (!grupos[chave]) grupos[chave] = []
      grupos[chave].push(processo)
    })

    return grupos
  }

  // Processos filtrados
  const processosFiltrados = useMemo(() => {
    return processos.filter((p) => {
      if (filtroCredor !== "todos" && p.credor !== filtroCredor) return false
      if (filtroRecurso !== "todos" && p.recurso !== filtroRecurso) return false
      if (filtroObjeto !== "todos" && p.objeto !== filtroObjeto) return false
      if (filtroSecretaria !== "todos" && p.secretaria !== filtroSecretaria) return false
      return true
    })
  }, [processos, filtroCredor, filtroRecurso, filtroObjeto, filtroSecretaria])

  // Calcular previsões baseadas no tipo de análise
  const previsoes = useMemo((): PrevisaoDespesa[] => {
    const grupos = agruparPorPeriodo(processosFiltrados, periodo)
    const periodos = Object.keys(grupos).sort()

    if (tipoAnalise === "geral") {
      // Análise geral de todos os processos
      const valoresPorPeriodo = periodos.map((key) => {
        return grupos[key].reduce((sum, p) => sum + (p.valor || 0), 0)
      })

      if (valoresPorPeriodo.length === 0) return []

      const media = valoresPorPeriodo.reduce((a, b) => a + b, 0) / valoresPorPeriodo.length
      const ultimoValor = valoresPorPeriodo[valoresPorPeriodo.length - 1] || 0
      const penultimoValor = valoresPorPeriodo[valoresPorPeriodo.length - 2] || ultimoValor
      
      const variacao = penultimoValor === 0 ? 0 : ((ultimoValor - penultimoValor) / penultimoValor) * 100
      const tendencia = variacao > 5 ? "alta" : variacao < -5 ? "baixa" : "estavel"
      
      // Previsão usando média móvel ponderada (últimos períodos têm mais peso)
      const pesoTotal = valoresPorPeriodo.length
      const previsao = valoresPorPeriodo.reduce((acc, val, idx) => {
        const peso = (idx + 1) / pesoTotal // Peso crescente
        return acc + val * peso
      }, 0) / (pesoTotal / 2)

      // Confiabilidade baseada em quantidade de dados e variância
      const variancia = valoresPorPeriodo.reduce((acc, val) => acc + Math.pow(val - media, 2), 0) / valoresPorPeriodo.length
      const coefVariacao = Math.sqrt(variancia) / media
      const confiabilidade = Math.max(0, Math.min(100, 100 - (coefVariacao * 50)))

      return [{
        nome: "Despesa Total",
        mediaHistorica: media,
        tendencia,
        variacao,
        previsaoProximoPeriodo: previsao,
        confiabilidade,
        historicoValores: valoresPorPeriodo
      }]
    }

    // Análise por credor, recurso, objeto ou secretaria
    const entidades = new Map<string, ProcessoDespesa[]>()

    processosFiltrados.forEach((processo) => {
      let chave = ""
      switch (tipoAnalise) {
        case "credor":
          chave = processo.credor || "Não especificado"
          break
        case "recurso":
          chave = processo.recurso || "Não especificado"
          break
        case "objeto":
          chave = processo.objeto || "Não especificado"
          break
        case "secretaria":
          chave = processo.secretaria || "Não especificado"
          break
      }

      if (!entidades.has(chave)) entidades.set(chave, [])
      entidades.get(chave)!.push(processo)
    })

    const resultado: PrevisaoDespesa[] = []

    entidades.forEach((procs, nomeEntidade) => {
      const gruposEntidade = agruparPorPeriodo(procs, periodo)
      const periodosEntidade = Object.keys(gruposEntidade).sort()

      const valoresPorPeriodo = periodosEntidade.map((key) => {
        return gruposEntidade[key].reduce((sum, p) => sum + (p.valor || 0), 0)
      })

      if (valoresPorPeriodo.length === 0) return

      const media = valoresPorPeriodo.reduce((a, b) => a + b, 0) / valoresPorPeriodo.length
      const ultimoValor = valoresPorPeriodo[valoresPorPeriodo.length - 1] || 0
      const penultimoValor = valoresPorPeriodo[valoresPorPeriodo.length - 2] || ultimoValor
      
      const variacao = penultimoValor === 0 ? 0 : ((ultimoValor - penultimoValor) / penultimoValor) * 100
      const tendencia = variacao > 5 ? "alta" : variacao < -5 ? "baixa" : "estavel"
      
      const pesoTotal = valoresPorPeriodo.length
      const previsao = valoresPorPeriodo.reduce((acc, val, idx) => {
        const peso = (idx + 1) / pesoTotal
        return acc + val * peso
      }, 0) / (pesoTotal / 2)

      const variancia = valoresPorPeriodo.reduce((acc, val) => acc + Math.pow(val - media, 2), 0) / valoresPorPeriodo.length
      const coefVariacao = media === 0 ? 0 : Math.sqrt(variancia) / media
      const confiabilidade = Math.max(0, Math.min(100, 100 - (coefVariacao * 50)))

      // Buscar nome amigável
      let nomeAmigavel = nomeEntidade
      if (tipoAnalise === "credor") {
        nomeAmigavel = credores?.find((c) => c.id === nomeEntidade)?.nome || nomeEntidade
      } else if (tipoAnalise === "recurso") {
        nomeAmigavel = recursos?.find((r) => r.id === nomeEntidade)?.nome || nomeEntidade
      } else if (tipoAnalise === "objeto") {
        nomeAmigavel = objetos?.find((o) => o.id === nomeEntidade)?.descricao || nomeEntidade
      } else if (tipoAnalise === "secretaria") {
        nomeAmigavel = secretarias?.find((s) => s.id === nomeEntidade)?.nome || nomeEntidade
      }

      resultado.push({
        nome: nomeAmigavel,
        mediaHistorica: media,
        tendencia,
        variacao,
        previsaoProximoPeriodo: previsao,
        confiabilidade,
        historicoValores: valoresPorPeriodo
      })
    })

    // Ordenar por média histórica (maiores primeiro)
    return resultado.sort((a, b) => b.mediaHistorica - a.mediaHistorica)
  }, [processosFiltrados, periodo, tipoAnalise, credores, recursos, objetos, secretarias])

  // Estatísticas gerais
  const estatisticas = useMemo(() => {
    const totalPrevisao = previsoes.reduce((sum, p) => sum + p.previsaoProximoPeriodo, 0)
    const totalMediaHistorica = previsoes.reduce((sum, p) => sum + p.mediaHistorica, 0)
    const diferencaAbsoluta = totalPrevisao - totalMediaHistorica
    const diferencaPercentual = totalMediaHistorica === 0 ? 0 : (diferencaAbsoluta / totalMediaHistorica) * 100

    const confiabilidadeMedia = previsoes.length === 0 ? 0 : 
      previsoes.reduce((sum, p) => sum + p.confiabilidade, 0) / previsoes.length

    const itensEmAlta = previsoes.filter((p) => p.tendencia === "alta").length
    const itensEmBaixa = previsoes.filter((p) => p.tendencia === "baixa").length

    return {
      totalPrevisao,
      totalMediaHistorica,
      diferencaAbsoluta,
      diferencaPercentual,
      confiabilidadeMedia,
      itensEmAlta,
      itensEmBaixa
    }
  }, [previsoes])

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor)
  }

  const getNomePeriodo = (periodo: PeriodoPrevisao) => {
    switch (periodo) {
      case "mensal": return "Mês"
      case "trimestral": return "Trimestre"
      case "semestral": return "Semestre"
      case "anual": return "Ano"
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center gap-4 px-6">
          <ChartLineUp className="h-6 w-6 text-primary" weight="duotone" />
          <div className="flex-1">
            <h1 className="text-xl font-semibold">Previsões de Despesas</h1>
            <p className="text-sm text-muted-foreground">
              Análise preditiva e tendências de gastos
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Filtros */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Funnel className="h-5 w-5" weight="duotone" />
              <CardTitle>Configurações de Análise</CardTitle>
            </div>
            <CardDescription>
              Configure os parâmetros para análise preditiva
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Período de Previsão</Label>
                <Select value={periodo} onValueChange={(v) => setPeriodo(v as PeriodoPrevisao)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="trimestral">Trimestral</SelectItem>
                    <SelectItem value="semestral">Semestral</SelectItem>
                    <SelectItem value="anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Análise</Label>
                <Select value={tipoAnalise} onValueChange={(v) => setTipoAnalise(v as TipoAnalise)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="geral">Análise Geral</SelectItem>
                    <SelectItem value="credor">Por Credor</SelectItem>
                    <SelectItem value="recurso">Por Recurso</SelectItem>
                    <SelectItem value="objeto">Por Objeto</SelectItem>
                    <SelectItem value="secretaria">Por Secretaria</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Filtrar por Credor</Label>
                <Select value={filtroCredor} onValueChange={setFiltroCredor}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {credores?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Filtrar por Secretaria</Label>
                <Select value={filtroSecretaria} onValueChange={setFiltroSecretaria}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {secretarias?.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label>Filtrar por Recurso</Label>
                <Select value={filtroRecurso} onValueChange={setFiltroRecurso}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {recursos?.map((r) => (
                      <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Filtrar por Objeto</Label>
                <Select value={filtroObjeto} onValueChange={setFiltroObjeto}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {objetos?.map((o) => (
                      <SelectItem key={o.id} value={o.id}>{o.descricao}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards de Estatísticas Gerais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Previsão Próximo {getNomePeriodo(periodo)}</CardDescription>
              <CardTitle className="text-2xl">{formatarMoeda(estatisticas.totalPrevisao)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm">
                <CurrencyDollar className="h-4 w-4 text-blue-600" weight="duotone" />
                <span className="text-muted-foreground">Total previsto</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Média Histórica</CardDescription>
              <CardTitle className="text-2xl">{formatarMoeda(estatisticas.totalMediaHistorica)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm">
                <ChartLine className="h-4 w-4 text-purple-600" weight="duotone" />
                <span className="text-muted-foreground">Baseado em histórico</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Variação Esperada</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                {estatisticas.diferencaPercentual > 0 ? (
                  <>
                    <TrendUp className="h-6 w-6 text-red-600" weight="duotone" />
                    +{estatisticas.diferencaPercentual.toFixed(1)}%
                  </>
                ) : estatisticas.diferencaPercentual < 0 ? (
                  <>
                    <TrendDown className="h-6 w-6 text-green-600" weight="duotone" />
                    {estatisticas.diferencaPercentual.toFixed(1)}%
                  </>
                ) : (
                  <>0%</>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                {formatarMoeda(Math.abs(estatisticas.diferencaAbsoluta))} de diferença
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Confiabilidade Média</CardDescription>
              <CardTitle className="text-2xl">
                {estatisticas.confiabilidadeMedia.toFixed(0)}%
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <TrendUp className="h-4 w-4 text-red-600" weight="fill" />
                  <span className="text-muted-foreground">{estatisticas.itensEmAlta} em alta</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendDown className="h-4 w-4 text-green-600" weight="fill" />
                  <span className="text-muted-foreground">{estatisticas.itensEmBaixa} em baixa</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos de Previsão */}
        {previsoes.length > 0 && previsoes[0].historicoValores.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Visualização Gráfica das Previsões</CardTitle>
              <CardDescription>
                Análise visual do histórico e projeções futuras
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="tendencia" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="tendencia">Tendência</TabsTrigger>
                  <TabsTrigger value="comparativo">Comparativo</TabsTrigger>
                  <TabsTrigger value="evolucao">Evolução</TabsTrigger>
                </TabsList>

                <TabsContent value="tendencia" className="mt-6">
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={(() => {
                      const dados = previsoes[0].historicoValores.map((valor, idx) => ({
                        periodo: `P${idx + 1}`,
                        real: valor,
                      }))
                      // Adiciona previsão como último ponto
                      dados.push({
                        periodo: `P${dados.length + 1} (Prev)`,
                        real: previsoes[0].previsaoProximoPeriodo,
                      })
                      return dados
                    })()}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="periodo" className="text-xs" />
                      <YAxis className="text-xs" tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                      <Tooltip 
                        formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Valor']}
                        contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="real" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        name="Despesa"
                        dot={{ fill: 'hsl(var(--primary))' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                  <p className="text-sm text-muted-foreground text-center mt-4">
                    Linha de tendência mostrando valores históricos e previsão do próximo período
                  </p>
                </TabsContent>

                <TabsContent value="comparativo" className="mt-6">
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={previsoes.map(prev => ({
                      nome: prev.nome.length > 20 ? prev.nome.substring(0, 20) + '...' : prev.nome,
                      'Média Histórica': prev.mediaHistorica,
                      'Previsão': prev.previsaoProximoPeriodo,
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="nome" className="text-xs" />
                      <YAxis className="text-xs" tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                      <Tooltip 
                        formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`]}
                        contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Legend />
                      <Bar dataKey="Média Histórica" fill="hsl(var(--muted-foreground))" />
                      <Bar dataKey="Previsão" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                  <p className="text-sm text-muted-foreground text-center mt-4">
                    Comparação entre média histórica e previsão para o próximo período
                  </p>
                </TabsContent>

                <TabsContent value="evolucao" className="mt-6">
                  <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={(() => {
                      const dados = previsoes[0].historicoValores.map((valor, idx) => ({
                        periodo: `P${idx + 1}`,
                        valor: valor,
                      }))
                      // Adiciona previsão
                      dados.push({
                        periodo: `P${dados.length + 1} (Prev)`,
                        valor: previsoes[0].previsaoProximoPeriodo,
                      })
                      return dados
                    })()}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="periodo" className="text-xs" />
                      <YAxis className="text-xs" tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                      <Tooltip 
                        formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Despesa']}
                        contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="valor" 
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary))" 
                        fillOpacity={0.3}
                        name="Evolução das Despesas"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                  <p className="text-sm text-muted-foreground text-center mt-4">
                    Evolução temporal das despesas com área preenchida
                  </p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Tabela de Previsões */}
        <Card>
          <CardHeader>
            <CardTitle>Previsões Detalhadas</CardTitle>
            <CardDescription>
              Análise {tipoAnalise === "geral" ? "geral" : `por ${tipoAnalise}`} com projeções para o próximo período
            </CardDescription>
          </CardHeader>
          <CardContent>
            {previsoes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ChartLineUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma previsão disponível com os filtros atuais</p>
                <p className="text-sm">Ajuste os filtros ou aguarde mais dados históricos</p>
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead className="text-right">Média Histórica</TableHead>
                      <TableHead className="text-right">Previsão Próximo Período</TableHead>
                      <TableHead className="text-center">Tendência</TableHead>
                      <TableHead className="text-right">Variação</TableHead>
                      <TableHead className="text-right">Confiabilidade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previsoes.map((prev, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{prev.nome}</TableCell>
                        <TableCell className="text-right">{formatarMoeda(prev.mediaHistorica)}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatarMoeda(prev.previsaoProximoPeriodo)}
                        </TableCell>
                        <TableCell className="text-center">
                          {prev.tendencia === "alta" ? (
                            <Badge variant="destructive" className="gap-1">
                              <TrendUp className="h-3 w-3" weight="fill" />
                              Alta
                            </Badge>
                          ) : prev.tendencia === "baixa" ? (
                            <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-700">
                              <TrendDown className="h-3 w-3" weight="fill" />
                              Baixa
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              Estável
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={prev.variacao > 0 ? "text-red-600" : prev.variacao < 0 ? "text-green-600" : ""}>
                            {prev.variacao > 0 ? "+" : ""}{prev.variacao.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary" 
                                style={{ width: `${prev.confiabilidade}%` }}
                              />
                            </div>
                            <span className="text-sm">{prev.confiabilidade.toFixed(0)}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informações Adicionais */}
        <Card>
          <CardHeader>
            <CardTitle>Sobre as Previsões</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex gap-2">
              <span className="font-semibold min-w-32">Metodologia:</span>
              <span>Média móvel ponderada com maior peso para períodos recentes</span>
            </div>
            <div className="flex gap-2">
              <span className="font-semibold min-w-32">Tendência:</span>
              <span>Alta quando variação {'>'} 5%, Baixa quando {'<'} -5%, Estável entre -5% e 5%</span>
            </div>
            <div className="flex gap-2">
              <span className="font-semibold min-w-32">Confiabilidade:</span>
              <span>Baseada no coeficiente de variação do histórico (menor variação = maior confiabilidade)</span>
            </div>
            <div className="flex gap-2">
              <span className="font-semibold min-w-32">Dados:</span>
              <span>Analisando {processosFiltrados.length} processos com os filtros atuais</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
