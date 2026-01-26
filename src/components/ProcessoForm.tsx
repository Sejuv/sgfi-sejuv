import { ProcessoDespesa } from "@/lib/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CurrencyInput } from "@/components/CurrencyInput"
import { useState, useEffect, useMemo, useRef } from "react"
import { useKV } from "@/hooks/useKV"
import { Check, CaretUpDown } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { 
  Secretaria, 
  Setor, 
  Conta, 
  Credor, 
  Objeto, 
  Mes, 
  Recurso 
} from "@/lib/cadastros-types"

interface ProcessoFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  processo?: ProcessoDespesa
  onSave: (processo: Omit<ProcessoDespesa, "id"> & { id?: string }) => void
}

const MESES_DO_ANO = [
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
  "Dezembro"
]

export function ProcessoForm({ open, onOpenChange, processo, onSave }: ProcessoFormProps) {
  const [secretarias] = useKV<Secretaria[]>("cadastro-secretarias", [])
  const [setores] = useKV<Setor[]>("cadastro-setores", [])
  const [contas] = useKV<Conta[]>("cadastro-contas", [])
  const [credores] = useKV<Credor[]>("cadastro-credores", [])
  const [objetos] = useKV<Objeto[]>("cadastro-objetos", [])
  const [meses] = useKV<Mes[]>("cadastro-meses", [])
  const [recursos] = useKV<Recurso[]>("cadastro-recursos", [])

  useEffect(() => {
    console.log('📊 Dados carregados no ProcessoForm:')
    console.log('Secretarias:', secretarias)
    console.log('Setores:', setores)
    console.log('Contas:', contas)
    console.log('Credores:', credores)
    console.log('Objetos:', objetos)
    console.log('Meses:', meses)
    console.log('Recursos:', recursos)
  }, [secretarias, setores, contas, credores, objetos, meses, recursos])

  const [formData, setFormData] = useState<Omit<ProcessoDespesa, "id"> & { id?: string }>({
    ano: new Date().getFullYear(),
    secretaria: "",
    setor: "",
    conta: "",
    credor: "",
    objeto: "",
    mes: "",
    valor: 0,
    recurso: "",
    did: "",
    nf: "",
  })

  const [secretariaIdSelecionada, setSecretariaIdSelecionada] = useState<string>("")
  const [mesPopoverOpen, setMesPopoverOpen] = useState(false)

  const anoRef = useRef<HTMLInputElement>(null)
  const secretariaRef = useRef<HTMLButtonElement>(null)
  const setorRef = useRef<HTMLButtonElement>(null)
  const contaRef = useRef<HTMLButtonElement>(null)
  const credorRef = useRef<HTMLButtonElement>(null)
  const objetoRef = useRef<HTMLButtonElement>(null)
  const mesRef = useRef<HTMLButtonElement>(null)
  const valorRef = useRef<HTMLInputElement>(null)
  const recursoRef = useRef<HTMLButtonElement>(null)
  const didRef = useRef<HTMLInputElement>(null)
  const nfRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (processo) {
      setFormData(processo)
      const secretaria = (secretarias || []).find(s => s.nome === processo.secretaria)
      setSecretariaIdSelecionada(secretaria?.id || "")
    } else {
      setFormData({
        ano: new Date().getFullYear(),
        secretaria: "",
        setor: "",
        conta: "",
        credor: "",
        objeto: "",
        mes: "",
        valor: 0,
        recurso: "",
        did: "",
        nf: "",
      })
      setSecretariaIdSelecionada("")
    }
  }, [processo, open, secretarias])

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey) {
        const key = e.key.toLowerCase()
        
        switch(key) {
          case '1':
            e.preventDefault()
            anoRef.current?.focus()
            toast.info("Campo: Ano")
            break
          case '2':
            e.preventDefault()
            secretariaRef.current?.click()
            toast.info("Campo: Secretaria")
            break
          case '3':
            e.preventDefault()
            if (!secretariaIdSelecionada) {
              toast.warning("Selecione uma secretaria primeiro")
            } else {
              setorRef.current?.click()
              toast.info("Campo: Setor")
            }
            break
          case '4':
            e.preventDefault()
            contaRef.current?.click()
            toast.info("Campo: Tipo de Conta")
            break
          case '5':
            e.preventDefault()
            credorRef.current?.click()
            toast.info("Campo: Credor")
            break
          case '6':
            e.preventDefault()
            objetoRef.current?.click()
            toast.info("Campo: Objeto")
            break
          case '7':
            e.preventDefault()
            mesRef.current?.click()
            toast.info("Campo: Mês")
            break
          case '8':
            e.preventDefault()
            valorRef.current?.focus()
            toast.info("Campo: Valor")
            break
          case '9':
            e.preventDefault()
            if (!secretariaIdSelecionada) {
              toast.warning("Selecione uma secretaria primeiro")
            } else {
              recursoRef.current?.click()
              toast.info("Campo: Recurso")
            }
            break
          case '0':
            e.preventDefault()
            didRef.current?.focus()
            toast.info("Campo: DID")
            break
          case 'n':
            e.preventDefault()
            nfRef.current?.focus()
            toast.info("Campo: Nota Fiscal")
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, secretariaIdSelecionada])

  const setoresFiltrados = useMemo(() => {
    if (!secretariaIdSelecionada) return []
    return (setores || []).filter(s => s.secretariaId === secretariaIdSelecionada && s.ativo)
  }, [setores, secretariaIdSelecionada])

  const recursosFiltrados = useMemo(() => {
    if (!secretariaIdSelecionada) return []
    return (recursos || []).filter(r => r.secretariaId === secretariaIdSelecionada && r.ativo)
  }, [recursos, secretariaIdSelecionada])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.ano || !formData.secretaria || !formData.setor || !formData.conta || 
        !formData.credor || !formData.objeto || !formData.mes || !formData.valor || 
        !formData.recurso || !formData.did || !formData.nf) {
      toast.error("Todos os campos são obrigatórios")
      return
    }
    
    onSave(formData)
    onOpenChange(false)
  }

  const secretariasAtivas = (secretarias || []).filter(s => s.ativo)
  const contasAtivas = (contas || []).filter(c => c.ativo)
  const credoresAtivos = (credores || []).filter(c => c.ativo)
  const objetosAtivos = (objetos || []).filter(o => o.ativo)
  const mesesAtivos = (meses || []).filter(m => m.ativo).sort((a, b) => a.numero - b.numero)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{processo ? "Editar Processo" : "Novo Processo de Despesa"}</DialogTitle>
          <p className="text-xs text-muted-foreground mt-2">
            💡 Use <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-muted rounded">Alt + 1-9, 0, N</kbd> para navegar rapidamente entre os campos
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ano" className="flex items-center gap-2">
              Ano * 
              <kbd className="px-1.5 py-0.5 text-xs font-mono bg-muted text-muted-foreground rounded">Alt+1</kbd>
            </Label>
            <Input
              ref={anoRef}
              id="ano"
              type="number"
              value={formData.ano}
              onChange={(e) => setFormData({ ...formData, ano: parseInt(e.target.value) || new Date().getFullYear() })}
              placeholder="Digite o ano"
              min="2000"
              max="2100"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="secretaria" className="flex items-center gap-2">
              Secretaria * 
              <kbd className="px-1.5 py-0.5 text-xs font-mono bg-muted text-muted-foreground rounded">Alt+2</kbd>
            </Label>
            <Select
              value={formData.secretaria}
              onValueChange={(value) => {
                const secretaria = secretariasAtivas.find(s => s.nome === value)
                setSecretariaIdSelecionada(secretaria?.id || "")
                setFormData({ ...formData, secretaria: value, setor: "", recurso: "" })
              }}
              required
            >
              <SelectTrigger ref={secretariaRef} id="secretaria">
                <SelectValue placeholder="Selecione a secretaria" />
              </SelectTrigger>
              <SelectContent>
                {secretariasAtivas.map((sec) => (
                  <SelectItem key={sec.id} value={sec.nome}>
                    {sec.nome} ({sec.sigla})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="setor" className="flex items-center gap-2">
              Setor * 
              <kbd className="px-1.5 py-0.5 text-xs font-mono bg-muted text-muted-foreground rounded">Alt+3</kbd>
            </Label>
            <Select
              value={formData.setor}
              onValueChange={(value) => setFormData({ ...formData, setor: value })}
              disabled={!secretariaIdSelecionada}
              required
            >
              <SelectTrigger ref={setorRef} id="setor">
                <SelectValue placeholder={secretariaIdSelecionada ? "Selecione o setor" : "Selecione uma secretaria primeiro"} />
              </SelectTrigger>
              <SelectContent>
                {setoresFiltrados.map((setor) => (
                  <SelectItem key={setor.id} value={setor.nome}>
                    {setor.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="conta" className="flex items-center gap-2">
              Tipo de Conta * 
              <kbd className="px-1.5 py-0.5 text-xs font-mono bg-muted text-muted-foreground rounded">Alt+4</kbd>
            </Label>
            <Select
              value={formData.conta}
              onValueChange={(value) => setFormData({ ...formData, conta: value })}
              required
            >
              <SelectTrigger ref={contaRef} id="conta">
                <SelectValue placeholder="Selecione o tipo de conta" />
              </SelectTrigger>
              <SelectContent>
                {contasAtivas.map((tipo) => (
                  <SelectItem key={tipo.id} value={tipo.tipo}>
                    {tipo.tipo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="credor" className="flex items-center gap-2">
              Credor * 
              <kbd className="px-1.5 py-0.5 text-xs font-mono bg-muted text-muted-foreground rounded">Alt+5</kbd>
            </Label>
            <Select
              value={formData.credor}
              onValueChange={(value) => setFormData({ ...formData, credor: value })}
              required
            >
              <SelectTrigger ref={credorRef} id="credor">
                <SelectValue placeholder="Selecione o credor" />
              </SelectTrigger>
              <SelectContent>
                {credoresAtivos.map((credor) => (
                  <SelectItem key={credor.id} value={credor.nome}>
                    {credor.nome} ({credor.tipo === "Pessoa Física" ? "CPF" : "CNPJ"}: {credor.cpfCnpj})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="objeto" className="flex items-center gap-2">
              Objeto * 
              <kbd className="px-1.5 py-0.5 text-xs font-mono bg-muted text-muted-foreground rounded">Alt+6</kbd>
            </Label>
            <Select
              value={formData.objeto}
              onValueChange={(value) => setFormData({ ...formData, objeto: value })}
              required
            >
              <SelectTrigger ref={objetoRef} id="objeto">
                <SelectValue placeholder="Selecione o objeto" />
              </SelectTrigger>
              <SelectContent>
                {objetosAtivos.map((objeto) => (
                  <SelectItem key={objeto.id} value={objeto.descricao}>
                    {objeto.descricao}
                    {objeto.categoria && <span className="text-xs text-muted-foreground ml-2">({objeto.categoria})</span>}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mes" className="flex items-center gap-2">
              Mês * 
              <kbd className="px-1.5 py-0.5 text-xs font-mono bg-muted text-muted-foreground rounded">Alt+7</kbd>
            </Label>
            <Popover open={mesPopoverOpen} onOpenChange={setMesPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  ref={mesRef}
                  id="mes"
                  variant="outline"
                  role="combobox"
                  aria-expanded={mesPopoverOpen}
                  className="w-full justify-between"
                >
                  {formData.mes || "Selecione o mês"}
                  <CaretUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Digite para filtrar..." />
                  <CommandList>
                    <CommandEmpty>Nenhum mês encontrado.</CommandEmpty>
                    <CommandGroup>
                      {MESES_DO_ANO.map((mes) => (
                        <CommandItem
                          key={mes}
                          value={mes}
                          onSelect={(currentValue) => {
                            setFormData({ ...formData, mes: currentValue })
                            setMesPopoverOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.mes === mes ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {mes}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor" className="flex items-center gap-2">
              Valor (R$) * 
              <kbd className="px-1.5 py-0.5 text-xs font-mono bg-muted text-muted-foreground rounded">Alt+8</kbd>
            </Label>
            <CurrencyInput
              ref={valorRef}
              id="valor"
              value={formData.valor}
              onChange={(value) => setFormData({ ...formData, valor: value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recurso" className="flex items-center gap-2">
              Recurso * 
              <kbd className="px-1.5 py-0.5 text-xs font-mono bg-muted text-muted-foreground rounded">Alt+9</kbd>
            </Label>
            <Select
              value={formData.recurso}
              onValueChange={(value) => setFormData({ ...formData, recurso: value })}
              disabled={!secretariaIdSelecionada}
              required
            >
              <SelectTrigger ref={recursoRef} id="recurso">
                <SelectValue placeholder={secretariaIdSelecionada ? "Selecione o recurso" : "Selecione uma secretaria primeiro"} />
              </SelectTrigger>
              <SelectContent>
                {recursosFiltrados.map((rec) => (
                  <SelectItem key={rec.id} value={rec.nome}>
                    {rec.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="did" className="flex items-center gap-2">
              DID * 
              <kbd className="px-1.5 py-0.5 text-xs font-mono bg-muted text-muted-foreground rounded">Alt+0</kbd>
            </Label>
            <Input
              ref={didRef}
              id="did"
              type="text"
              value={formData.did}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "")
                setFormData({ ...formData, did: value })
              }}
              placeholder="Somente números"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nf" className="flex items-center gap-2">
              Nota Fiscal * 
              <kbd className="px-1.5 py-0.5 text-xs font-mono bg-muted text-muted-foreground rounded">Alt+N</kbd>
            </Label>
            <Input
              ref={nfRef}
              id="nf"
              type="text"
              value={formData.nf}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "")
                setFormData({ ...formData, nf: value })
              }}
              placeholder="Somente números"
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {processo ? "Salvar Alterações" : "Criar Processo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
