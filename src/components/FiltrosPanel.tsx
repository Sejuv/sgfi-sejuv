import { useMemo } from "react"
import { useKV } from "@/hooks/useKV"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Secretaria, Recurso, Credor } from "@/lib/cadastros-types"
import { MESES } from "@/lib/constants"
import { Funnel, X } from "@phosphor-icons/react"

export interface Filtros {
  ano?: number
  secretaria?: string
  mes?: string
  recurso?: string
  credor?: string
  did?: string
  nf?: string
  apenaspendentes: boolean
}

interface FiltrosPanelProps {
  filtros: Filtros
  onFiltrosChange: (filtros: Filtros) => void
}

export function FiltrosPanel({ filtros, onFiltrosChange }: FiltrosPanelProps) {
  const [secretarias] = useKV<Secretaria[]>("cadastro-secretarias", [])
  const [recursos] = useKV<Recurso[]>("cadastro-recursos", [])
  const [credores] = useKV<Credor[]>("cadastro-credores", [])

  const anosDisponiveis = useMemo(() => {
    const anoAtual = new Date().getFullYear()
    const anos: number[] = []
    for (let i = anoAtual - 5; i <= anoAtual + 2; i++) {
      anos.push(i)
    }
    return anos.sort((a, b) => b - a)
  }, [])

  const secretariasOrdenadas = useMemo(() => {
    return [...(secretarias || [])].sort((a, b) => a.nome.localeCompare(b.nome))
  }, [secretarias])

  const recursosOrdenados = useMemo(() => {
    return [...(recursos || [])].sort((a, b) => a.nome.localeCompare(b.nome))
  }, [recursos])

  const credoresOrdenados = useMemo(() => {
    return [...(credores || [])].filter(c => c.ativo).sort((a, b) => a.nome.localeCompare(b.nome))
  }, [credores])

  const limparFiltros = () => {
    onFiltrosChange({
      apenaspendentes: false,
    })
  }

  const temFiltrosAtivos = filtros.ano || filtros.secretaria || filtros.mes || filtros.recurso || filtros.credor || filtros.did || filtros.nf || filtros.apenaspendentes

  return (
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
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2">
        <div className="space-y-1">
          <Label htmlFor="filtro-ano" className="text-xs">Ano</Label>
          <Select
            value={filtros.ano ? String(filtros.ano) : "todos"}
            onValueChange={(value) => 
              onFiltrosChange({ ...filtros, ano: value === "todos" ? undefined : parseInt(value) })
            }
          >
            <SelectTrigger id="filtro-ano">
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
          <Label htmlFor="filtro-secretaria" className="text-xs">Secretaria</Label>
          <Select
            value={filtros.secretaria || "todas"}
            onValueChange={(value) =>
              onFiltrosChange({ ...filtros, secretaria: value === "todas" ? undefined : value })
            }
          >
            <SelectTrigger id="filtro-secretaria">
              <SelectValue placeholder="Todas as secretarias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as secretarias</SelectItem>
              {secretariasOrdenadas.map((sec) => (
                <SelectItem key={sec.id} value={sec.nome}>
                  {sec.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="filtro-mes" className="text-xs">Mês</Label>
          <Select
            value={filtros.mes || "todos"}
            onValueChange={(value) =>
              onFiltrosChange({ ...filtros, mes: value === "todos" ? undefined : value })
            }
          >
            <SelectTrigger id="filtro-mes">
              <SelectValue placeholder="Todos os meses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os meses</SelectItem>
              {MESES.map((mes) => (
                <SelectItem key={mes} value={mes}>
                  {mes}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="filtro-recurso" className="text-xs">Recurso</Label>
          <Select
            value={filtros.recurso || "todos"}
            onValueChange={(value) =>
              onFiltrosChange({ ...filtros, recurso: value === "todos" ? undefined : value })
            }
          >
            <SelectTrigger id="filtro-recurso">
              <SelectValue placeholder="Todos os recursos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os recursos</SelectItem>
              {recursosOrdenados.map((rec) => (
                <SelectItem key={rec.id} value={rec.nome}>
                  {rec.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="filtro-credor" className="text-xs">Credor</Label>
          <Select
            value={filtros.credor || "todos"}
            onValueChange={(value) =>
              onFiltrosChange({ ...filtros, credor: value === "todos" ? undefined : value })
            }
          >
            <SelectTrigger id="filtro-credor">
              <SelectValue placeholder="Todos os credores" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os credores</SelectItem>
              {credoresOrdenados.map((credor) => (
                <SelectItem key={credor.id} value={credor.nome}>
                  {credor.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="filtro-did" className="text-xs">DID</Label>
          <Input
            id="filtro-did"
            type="text"
            placeholder="Filtrar por DID"
            value={filtros.did || ""}
            onChange={(e) => onFiltrosChange({ ...filtros, did: e.target.value || undefined })}
            className="h-9 text-sm"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="filtro-nf" className="text-xs">Nota Fiscal</Label>
          <Input
            id="filtro-nf"
            type="text"
            placeholder="Filtrar por NF"
            value={filtros.nf || ""}
            onChange={(e) => onFiltrosChange({ ...filtros, nf: e.target.value || undefined })}
            className="h-9 text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 p-2 bg-amber-50 rounded-md border border-amber-200">
        <Switch
          id="apenas-pendentes"
          checked={filtros.apenaspendentes}
          onCheckedChange={(checked) => onFiltrosChange({ ...filtros, apenaspendentes: checked })}
        />
        <Label htmlFor="apenas-pendentes" className="cursor-pointer text-xs font-medium text-amber-900">
          Mostrar apenas processos pendentes (Tesouraria)
        </Label>
      </div>
    </Card>
  )
}
