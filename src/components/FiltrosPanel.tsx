import { useMemo } from "react"
import { useFirebaseKV } from "@/hooks/useFirebaseKV"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { MultiSelect } from "@/components/ui/multi-select"
import { Secretaria, Recurso, Credor, Objeto } from "@/lib/cadastros-types"
import { ProcessoDespesa } from "@/lib/types"
import { MESES } from "@/lib/constants"
import { Funnel, X } from "@phosphor-icons/react"

export interface Filtros {
  anos?: number[]
  secretarias?: string[]
  meses?: string[]
  recursos?: string[]
  credores?: string[]
  objetos?: string[]
  tiposConta?: string[]
  did?: string
  nf?: string
  apenaspendentes: boolean
}

interface FiltrosPanelProps {
  filtros: Filtros
  onFiltrosChange: (filtros: Filtros) => void
  processos?: ProcessoDespesa[]
}

export function FiltrosPanel({ filtros, onFiltrosChange, processos }: FiltrosPanelProps) {
  const [secretarias] = useFirebaseKV<Secretaria[]>("cadastro-secretarias", [])
  const [recursos] = useFirebaseKV<Recurso[]>("cadastro-recursos", [])
  const [credores] = useFirebaseKV<Credor[]>("cadastro-credores", [])
  const [objetos] = useFirebaseKV<Objeto[]>("cadastro-objetos", [])

  const tiposContaDisponiveis = useMemo(() => {
    if (!processos || processos.length === 0) return []
    const tipos = [...new Set(processos.map(p => p.conta).filter(Boolean))]
    return tipos.sort()
  }, [processos])

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

  const objetosOrdenados = useMemo(() => {
    return [...(objetos || [])].filter(o => o.ativo).sort((a, b) => a.descricao.localeCompare(b.descricao))
  }, [objetos])

  const limparFiltros = () => {
    onFiltrosChange({
      apenaspendentes: false,
    })
  }

  const temFiltrosAtivos = 
    (filtros.anos && filtros.anos.length > 0) ||
    (filtros.secretarias && filtros.secretarias.length > 0) ||
    (filtros.meses && filtros.meses.length > 0) ||
    (filtros.recursos && filtros.recursos.length > 0) ||
    (filtros.credores && filtros.credores.length > 0) ||
    (filtros.objetos && filtros.objetos.length > 0) ||
    (filtros.tiposConta && filtros.tiposConta.length > 0) ||
    filtros.did ||
    filtros.nf ||
    filtros.apenaspendentes

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
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-9 gap-2">
        <div className="space-y-1">
          <Label htmlFor="filtro-ano" className="text-xs">Ano</Label>
          <MultiSelect
            options={anosDisponiveis.map(ano => ({ label: String(ano), value: String(ano) }))}
            selected={filtros.anos?.map(String) || []}
            onChange={(values) => 
              onFiltrosChange({ ...filtros, anos: values.length > 0 ? values.map(Number) : undefined })
            }
            placeholder="Todos os anos"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="filtro-secretaria" className="text-xs">Secretaria</Label>
          <MultiSelect
            options={secretariasOrdenadas.map(sec => ({ label: sec.nome, value: sec.nome }))}
            selected={filtros.secretarias || []}
            onChange={(values) =>
              onFiltrosChange({ ...filtros, secretarias: values.length > 0 ? values : undefined })
            }
            placeholder="Todas as secretarias"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="filtro-mes" className="text-xs">Mês</Label>
          <MultiSelect
            options={MESES.map(mes => ({ label: mes, value: mes }))}
            selected={filtros.meses || []}
            onChange={(values) =>
              onFiltrosChange({ ...filtros, meses: values.length > 0 ? values : undefined })
            }
            placeholder="Todos os meses"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="filtro-recurso" className="text-xs">Recurso</Label>
          <MultiSelect
            options={recursosOrdenados.map(rec => ({ label: rec.nome, value: rec.nome }))}
            selected={filtros.recursos || []}
            onChange={(values) =>
              onFiltrosChange({ ...filtros, recursos: values.length > 0 ? values : undefined })
            }
            placeholder="Todos os recursos"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="filtro-credor" className="text-xs">Credor</Label>
          <MultiSelect
            options={credoresOrdenados.map(credor => ({ label: credor.nome, value: credor.nome }))}
            selected={filtros.credores || []}
            onChange={(values) =>
              onFiltrosChange({ ...filtros, credores: values.length > 0 ? values : undefined })
            }
            placeholder="Todos os credores"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="filtro-objeto" className="text-xs">Objeto</Label>
          <MultiSelect
            options={objetosOrdenados.map(objeto => ({ label: objeto.descricao, value: objeto.descricao }))}
            selected={filtros.objetos || []}
            onChange={(values) =>
              onFiltrosChange({ ...filtros, objetos: values.length > 0 ? values : undefined })
            }
            placeholder="Todos os objetos"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="filtro-tipo-conta" className="text-xs">Tipo de Conta</Label>
          <MultiSelect
            options={tiposContaDisponiveis.map(tipo => ({ label: tipo, value: tipo }))}
            selected={filtros.tiposConta || []}
            onChange={(values) =>
              onFiltrosChange({ ...filtros, tiposConta: values.length > 0 ? values : undefined })
            }
            placeholder="Todos os tipos"
          />
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
