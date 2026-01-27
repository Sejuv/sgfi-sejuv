import { useState } from "react"
import { useFirebaseKV } from "@/hooks/useFirebaseKV"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { GenericTable } from "@/components/cadastros/GenericTable"
import { SecretariaForm } from "@/components/cadastros/SecretariaForm"
import { SetorForm } from "@/components/cadastros/SetorForm"
import { ContaForm } from "@/components/cadastros/ContaForm"
import { CredorForm } from "@/components/cadastros/CredorForm"
import { ObjetoForm } from "@/components/cadastros/ObjetoForm"
import { RecursoForm } from "@/components/cadastros/RecursoForm"
import { ImportCadastroDialog } from "@/components/ImportCadastroDialog"
import { 
  Secretaria, 
  Setor, 
  Conta, 
  Credor, 
  Objeto, 
  Recurso 
} from "@/lib/cadastros-types"
import {
  downloadSecretariasTemplate,
  downloadSetoresTemplate,
  downloadContasTemplate,
  downloadCredoresTemplate,
  downloadObjetosTemplate,
  downloadRecursosTemplate,
  importSecretariasFromExcel,
  importSetoresFromExcel,
  importContasFromExcel,
  importCredoresFromExcel,
  importObjetosFromExcel,
  importRecursosFromExcel,
} from "@/lib/excel-utils"
import {
  exportSecretariasToExcel,
  exportSetoresToExcel,
  exportContasToExcel,
  exportCredoresToExcel,
  exportObjetosToExcel,
  exportRecursosToExcel,
} from "@/lib/export-utils"
import { 
  Plus, 
  PencilSimple, 
  Trash, 
  CaretDown, 
  CaretRight,
  DotsSixVertical,
  FileArrowUp,
  FileCsv
} from "@phosphor-icons/react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

export function PainelCadastros() {
  const [secretarias, setSecretarias] = useFirebaseKV<Secretaria[]>("cadastro-secretarias", [])
  const [setores, setSetores] = useFirebaseKV<Setor[]>("cadastro-setores", [])
  const [contas, setContas] = useFirebaseKV<Conta[]>("cadastro-contas", [])
  const [credores, setCredores] = useFirebaseKV<Credor[]>("cadastro-credores", [])
  const [objetos, setObjetos] = useFirebaseKV<Objeto[]>("cadastro-objetos", [])
  const [recursos, setRecursos] = useFirebaseKV<Recurso[]>("cadastro-recursos", [])

  const [secretariaFormOpen, setSecretariaFormOpen] = useState(false)
  const [setorFormOpen, setSetorFormOpen] = useState(false)
  const [contaFormOpen, setContaFormOpen] = useState(false)
  const [credorFormOpen, setCredorFormOpen] = useState(false)
  const [objetoFormOpen, setObjetoFormOpen] = useState(false)
  const [recursoFormOpen, setRecursoFormOpen] = useState(false)

  const [secretariaEditando, setSecretariaEditando] = useState<Secretaria | undefined>()
  const [setorEditando, setSetorEditando] = useState<Setor | undefined>()
  const [contaEditando, setContaEditando] = useState<Conta | undefined>()
  const [credorEditando, setCredorEditando] = useState<Credor | undefined>()
  const [objetoEditando, setObjetoEditando] = useState<Objeto | undefined>()
  const [recursoEditando, setRecursoEditando] = useState<Recurso | undefined>()
  
  const [secretariaIdParaNovoSetor, setSecretariaIdParaNovoSetor] = useState<string | undefined>()
  const [secretariasExpandidas, setSecretariasExpandidas] = useState<Set<string>>(new Set())
  const [draggedSetorId, setDraggedSetorId] = useState<string | null>(null)
  const [dragOverSetorId, setDragOverSetorId] = useState<string | null>(null)

  const [importSecretariasOpen, setImportSecretariasOpen] = useState(false)
  const [importSetoresOpen, setImportSetoresOpen] = useState(false)
  const [importContasOpen, setImportContasOpen] = useState(false)
  const [importCredoresOpen, setImportCredoresOpen] = useState(false)
  const [importObjetosOpen, setImportObjetosOpen] = useState(false)
  const [importRecursosOpen, setImportRecursosOpen] = useState(false)

  const handleSaveSecretaria = (data: Omit<Secretaria, "id"> & { id?: string }) => {
    setSecretarias((current) => {
      const list = current || []
      if (data.id) {
        return list.map((item) => (item.id === data.id ? (data as Secretaria) : item))
      }
      return [...list, { ...data, id: Date.now().toString() } as Secretaria]
    })
    toast.success(data.id ? "Secretaria atualizada" : "Secretaria cadastrada")
    setSecretariaEditando(undefined)
  }

  const handleSaveSetor = (data: Omit<Setor, "id"> & { id?: string }) => {
    setSetores((current) => {
      const list = current || []
      if (data.id) {
        return list.map((item) => (item.id === data.id ? (data as Setor) : item))
      }
      const setoresDaSecretaria = list.filter(s => s.secretariaId === data.secretariaId)
      const maxOrdem = setoresDaSecretaria.length > 0 
        ? Math.max(...setoresDaSecretaria.map(s => s.ordem || 0))
        : -1
      return [...list, { ...data, id: Date.now().toString(), ordem: maxOrdem + 1 } as Setor]
    })
    toast.success(data.id ? "Setor atualizado" : "Setor cadastrado")
    setSetorEditando(undefined)
  }

  const handleSaveConta = (data: Omit<Conta, "id"> & { id?: string }) => {
    setContas((current) => {
      const list = current || []
      if (data.id) {
        return list.map((item) => (item.id === data.id ? (data as Conta) : item))
      }
      return [...list, { ...data, id: Date.now().toString() } as Conta]
    })
    toast.success(data.id ? "Conta atualizada" : "Conta cadastrada")
    setContaEditando(undefined)
  }

  const handleSaveCredor = (data: Omit<Credor, "id"> & { id?: string }) => {
    setCredores((current) => {
      const list = current || []
      if (data.id) {
        return list.map((item) => (item.id === data.id ? (data as Credor) : item))
      }
      return [...list, { ...data, id: Date.now().toString() } as Credor]
    })
    toast.success(data.id ? "Credor atualizado" : "Credor cadastrado")
    setCredorEditando(undefined)
  }

  const handleSaveObjeto = (data: Omit<Objeto, "id"> & { id?: string }) => {
    setObjetos((current) => {
      const list = current || []
      if (data.id) {
        return list.map((item) => (item.id === data.id ? (data as Objeto) : item))
      }
      return [...list, { ...data, id: Date.now().toString() } as Objeto]
    })
    toast.success(data.id ? "Objeto atualizado" : "Objeto cadastrado")
    setObjetoEditando(undefined)
  }

  const handleSaveRecurso = (data: Omit<Recurso, "id"> & { id?: string }) => {
    setRecursos((current) => {
      const list = current || []
      if (data.id) {
        return list.map((item) => (item.id === data.id ? (data as Recurso) : item))
      }
      return [...list, { ...data, id: Date.now().toString() } as Recurso]
    })
    toast.success(data.id ? "Recurso atualizado" : "Recurso cadastrado")
    setRecursoEditando(undefined)
  }

  const toggleSecretaria = (secretariaId: string) => {
    setSecretariasExpandidas((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(secretariaId)) {
        newSet.delete(secretariaId)
      } else {
        newSet.add(secretariaId)
      }
      return newSet
    })
  }

  const handleDeleteSecretaria = (id: string) => {
    const setoresDaSecretaria = (setores || []).filter(setor => setor.secretariaId === id)
    if (setoresDaSecretaria.length > 0) {
      toast.error("Não é possível excluir secretaria com setores vinculados")
      return
    }
    setSecretarias((current) => (current || []).filter((item) => item.id !== id))
    toast.success("Secretaria excluída")
  }

  const handleDragStart = (e: React.DragEvent, setorId: string) => {
    setDraggedSetorId(setorId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, setorId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverSetorId(setorId)
  }

  const handleDragLeave = () => {
    setDragOverSetorId(null)
  }

  const handleDrop = (e: React.DragEvent, targetSetorId: string, secretariaId: string) => {
    e.preventDefault()
    
    if (!draggedSetorId || draggedSetorId === targetSetorId) {
      setDraggedSetorId(null)
      setDragOverSetorId(null)
      return
    }

    setSetores((current) => {
      const list = current || []
      const setoresDaSecretaria = list
        .filter(s => s.secretariaId === secretariaId)
        .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
      
      const draggedIndex = setoresDaSecretaria.findIndex(s => s.id === draggedSetorId)
      const targetIndex = setoresDaSecretaria.findIndex(s => s.id === targetSetorId)
      
      if (draggedIndex === -1 || targetIndex === -1) return list

      const reorderedSetores = [...setoresDaSecretaria]
      const [removed] = reorderedSetores.splice(draggedIndex, 1)
      reorderedSetores.splice(targetIndex, 0, removed)

      const updatedSetores = reorderedSetores.map((setor, index) => ({
        ...setor,
        ordem: index
      }))

      const outrosSetores = list.filter(s => s.secretariaId !== secretariaId)
      return [...outrosSetores, ...updatedSetores]
    })

    toast.success("Ordem dos setores atualizada")
    setDraggedSetorId(null)
    setDragOverSetorId(null)
  }

  const handleDragEnd = () => {
    setDraggedSetorId(null)
    setDragOverSetorId(null)
  }

  const handleImportSecretarias = (items: Omit<Secretaria, "id">[]) => {
    setSecretarias((current) => {
      const currentArray = current || []
      const novosItens = items.map((item, index) => ({
        ...item,
        id: `${Date.now()}-${index}`,
      }))
      return [...currentArray, ...novosItens]
    })
  }

  const handleImportSetores = (items: Omit<Setor, "id">[]) => {
    setSetores((current) => {
      const currentArray = current || []
      const novosItens = items.map((item, index) => ({
        ...item,
        id: `${Date.now()}-${index}`,
      }))
      return [...currentArray, ...novosItens]
    })
  }

  const handleImportContas = (items: Omit<Conta, "id">[]) => {
    setContas((current) => {
      const currentArray = current || []
      const novosItens = items.map((item, index) => ({
        ...item,
        id: `${Date.now()}-${index}`,
      }))
      return [...currentArray, ...novosItens]
    })
  }

  const handleImportCredores = (items: Omit<Credor, "id">[]) => {
    setCredores((current) => {
      const currentArray = current || []
      const novosItens = items.map((item, index) => ({
        ...item,
        id: `${Date.now()}-${index}`,
      }))
      return [...currentArray, ...novosItens]
    })
  }

  const handleImportObjetos = (items: Omit<Objeto, "id">[]) => {
    setObjetos((current) => {
      const currentArray = current || []
      const novosItens = items.map((item, index) => ({
        ...item,
        id: `${Date.now()}-${index}`,
      }))
      return [...currentArray, ...novosItens]
    })
  }

  const handleImportRecursos = (items: Omit<Recurso, "id">[]) => {
    setRecursos((current) => {
      const currentArray = current || []
      const novosItens = items.map((item, index) => ({
        ...item,
        id: `${Date.now()}-${index}`,
      }))
      return [...currentArray, ...novosItens]
    })
  }

  const handleExportSecretarias = () => {
    exportSecretariasToExcel(secretarias || [])
    toast.success("Secretarias exportadas com sucesso")
  }

  const handleExportSetores = () => {
    exportSetoresToExcel(setores || [], secretarias || [])
    toast.success("Setores exportados com sucesso")
  }

  const handleExportContas = () => {
    exportContasToExcel(contas || [])
    toast.success("Contas exportadas com sucesso")
  }

  const handleExportCredores = () => {
    exportCredoresToExcel(credores || [])
    toast.success("Credores exportados com sucesso")
  }

  const handleExportObjetos = () => {
    exportObjetosToExcel(objetos || [])
    toast.success("Objetos exportados com sucesso")
  }

  const handleExportRecursos = () => {
    exportRecursosToExcel(recursos || [], secretarias || [])
    toast.success("Recursos exportados com sucesso")
  }

  return (
    <div className="space-y-6 overflow-y-scroll h-full" style={{scrollBehavior: 'smooth'}}>
      <div>
        <h2 className="text-2xl font-bold text-foreground">Cadastros</h2>
        <p className="text-muted-foreground mt-1">
          Gerencie as informações básicas do sistema
        </p>
      </div>

      <Tabs defaultValue="secretarias" className="space-y-4">
        <TabsList className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 w-full h-auto">
          <TabsTrigger value="secretarias">Secretarias & Setores</TabsTrigger>
          <TabsTrigger value="contas">Contas</TabsTrigger>
          <TabsTrigger value="credores">Credores</TabsTrigger>
          <TabsTrigger value="objetos">Objetos</TabsTrigger>
          <TabsTrigger value="recursos">Recursos</TabsTrigger>
        </TabsList>

        <TabsContent value="secretarias">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">Secretarias & Setores</h3>
                <p className="text-sm text-muted-foreground">
                  Gerenciar secretarias e seus setores em cascata
                </p>
              </div>
              <div className="flex gap-2">
                {(secretarias || []).length > 0 && (
                  <Button
                    variant="outline"
                    onClick={handleExportSecretarias}
                    className="gap-2"
                  >
                    <FileCsv className="h-4 w-4" weight="bold" />
                    Exportar
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setImportSecretariasOpen(true)}
                  className="gap-2"
                >
                  <FileArrowUp className="h-4 w-4" weight="bold" />
                  Importar
                </Button>
                <Button
                  onClick={() => {
                    setSecretariaEditando(undefined)
                    setSecretariaFormOpen(true)
                  }}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" weight="bold" />
                  Nova Secretaria
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {(secretarias || []).map((secretaria) => {
                const setoresDaSecretaria = (setores || [])
                  .filter((s) => s.secretariaId === secretaria.id)
                  .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
                const isExpanded = secretariasExpandidas.has(secretaria.id)

                return (
                  <Collapsible
                    key={secretaria.id}
                    open={isExpanded}
                    onOpenChange={() => toggleSecretaria(secretaria.id)}
                  >
                    <Card className="border-l-4 border-l-primary">
                      <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3 flex-1">
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="p-1 h-auto">
                              {isExpanded ? (
                                <CaretDown className="h-5 w-5" weight="bold" />
                              ) : (
                                <CaretRight className="h-5 w-5" weight="bold" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-foreground">
                                {secretaria.nome}
                              </h4>
                              {secretaria.sigla && (
                                <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded">
                                  {secretaria.sigla}
                                </span>
                              )}
                            </div>
                            {secretaria.responsavel && (
                              <p className="text-sm text-muted-foreground">
                                Responsável: {secretaria.responsavel}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {setoresDaSecretaria.length} {setoresDaSecretaria.length === 1 ? 'setor' : 'setores'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSecretariaIdParaNovoSetor(secretaria.id)
                              setSetorEditando(undefined)
                              setSetorFormOpen(true)
                            }}
                            className="gap-2"
                          >
                            <Plus className="h-4 w-4" weight="bold" />
                            Adicionar Setor
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSecretariaEditando(secretaria)
                              setSecretariaFormOpen(true)
                            }}
                          >
                            <PencilSimple className="h-4 w-4" weight="bold" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSecretaria(secretaria.id)}
                          >
                            <Trash className="h-4 w-4" weight="bold" />
                          </Button>
                        </div>
                      </div>

                      <CollapsibleContent>
                        <div className="px-4 pb-4 pt-2 border-t bg-muted/30">
                          {setoresDaSecretaria.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic py-4 text-center">
                              Nenhum setor cadastrado nesta secretaria
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {setoresDaSecretaria.map((setor) => (
                                <div
                                  key={setor.id}
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, setor.id)}
                                  onDragOver={(e) => handleDragOver(e, setor.id)}
                                  onDragLeave={handleDragLeave}
                                  onDrop={(e) => handleDrop(e, setor.id, secretaria.id)}
                                  onDragEnd={handleDragEnd}
                                  className={`flex items-center gap-3 p-3 bg-card rounded-md border transition-all cursor-move ${
                                    draggedSetorId === setor.id 
                                      ? 'opacity-50 scale-95' 
                                      : dragOverSetorId === setor.id 
                                      ? 'border-primary border-2 bg-primary/5' 
                                      : 'hover:border-primary/50'
                                  }`}
                                >
                                  <div className="cursor-grab active:cursor-grabbing">
                                    <DotsSixVertical className="h-5 w-5 text-muted-foreground" weight="bold" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-medium text-sm">{setor.nome}</p>
                                    {setor.descricao && (
                                      <p className="text-xs text-muted-foreground">
                                        {setor.descricao}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setSetorEditando(setor)
                                        setSecretariaIdParaNovoSetor(undefined)
                                        setSetorFormOpen(true)
                                      }}
                                    >
                                      <PencilSimple className="h-4 w-4" weight="bold" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setSetores((current) =>
                                          (current || []).filter((item) => item.id !== setor.id)
                                        )
                                        toast.success("Setor excluído")
                                      }}
                                    >
                                      <Trash className="h-4 w-4" weight="bold" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                )
              })}

              {(secretarias || []).length === 0 && (
                <Card className="p-8">
                  <p className="text-center text-muted-foreground">
                    Nenhuma secretaria cadastrada. Clique em "Nova Secretaria" para começar.
                  </p>
                </Card>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="setores">
          <GenericTable
            title="Setores"
            description="Gerenciar setores e departamentos"
            data={(setores || []).map(setor => {
              const secretaria = (secretarias || []).find(s => s.id === setor.secretariaId)
              return {
                ...setor,
                secretariaNome: secretaria?.nome || "N/A"
              }
            })}
            columns={[
              { key: "secretariaNome", label: "Secretaria" },
              { key: "nome", label: "Nome" },
              { key: "descricao", label: "Descrição" },
            ]}
            onAdd={() => {
              setSetorEditando(undefined)
              setSetorFormOpen(true)
            }}
            onEdit={(item) => {
              setSetorEditando(item)
              setSetorFormOpen(true)
            }}
            onDelete={(id) => {
              setSetores((current) => (current || []).filter((item) => item.id !== id))
              toast.success("Setor excluído")
            }}
            addLabel="Novo Setor"
          />
        </TabsContent>

        <TabsContent value="contas">
          <GenericTable
            title="Contas"
            description="Gerenciar tipos de conta"
            data={contas || []}
            columns={[
              { key: "tipo", label: "Tipo" },
              { key: "descricao", label: "Descrição" },
            ]}
            onAdd={() => {
              setContaEditando(undefined)
              setContaFormOpen(true)
            }}
            onEdit={(item) => {
              setContaEditando(item)
              setContaFormOpen(true)
            }}
            onDelete={(id) => {
              setContas((current) => (current || []).filter((item) => item.id !== id))
              toast.success("Conta excluída")
            }}
            addLabel="Nova Conta"
            onImport={() => setImportContasOpen(true)}
            onExport={handleExportContas}
          />
        </TabsContent>

        <TabsContent value="credores">
          <GenericTable
            title="Credores"
            description="Gerenciar fornecedores e credores"
            data={credores || []}
            columns={[
              { key: "nome", label: "Nome" },
              { key: "tipo", label: "Tipo" },
              { key: "cpfCnpj", label: "CPF/CNPJ" },
              { key: "telefone", label: "Telefone" },
            ]}
            onAdd={() => {
              setCredorEditando(undefined)
              setCredorFormOpen(true)
            }}
            onEdit={(item) => {
              setCredorEditando(item)
              setCredorFormOpen(true)
            }}
            onDelete={(id) => {
              setCredores((current) => (current || []).filter((item) => item.id !== id))
              toast.success("Credor excluído")
            }}
            addLabel="Novo Credor"
            onImport={() => setImportCredoresOpen(true)}
            onExport={handleExportCredores}
          />
        </TabsContent>

        <TabsContent value="objetos">
          <GenericTable
            title="Objetos"
            description="Gerenciar objetos de despesa"
            data={objetos || []}
            columns={[
              { key: "descricao", label: "Descrição" },
              { key: "categoria", label: "Categoria" },
            ]}
            onAdd={() => {
              setObjetoEditando(undefined)
              setObjetoFormOpen(true)
            }}
            onEdit={(item) => {
              setObjetoEditando(item)
              setObjetoFormOpen(true)
            }}
            onDelete={(id) => {
              setObjetos((current) => (current || []).filter((item) => item.id !== id))
              toast.success("Objeto excluído")
            }}
            addLabel="Novo Objeto"
            onImport={() => setImportObjetosOpen(true)}
            onExport={handleExportObjetos}
          />
        </TabsContent>

        <TabsContent value="recursos">
          <GenericTable
            title="Recursos"
            description="Gerenciar recursos orçamentários"
            data={(recursos || []).map(recurso => {
              const secretaria = (secretarias || []).find(s => s.id === recurso.secretariaId)
              return {
                ...recurso,
                secretariaNome: secretaria ? `${secretaria.sigla} - ${secretaria.nome}` : "N/A"
              }
            })}
            columns={[
              { key: "nome", label: "Nome" },
              { key: "secretariaNome", label: "Secretaria" },
            ]}
            onAdd={() => {
              setRecursoEditando(undefined)
              setRecursoFormOpen(true)
            }}
            onEdit={(item) => {
              setRecursoEditando(item)
              setRecursoFormOpen(true)
            }}
            onDelete={(id) => {
              setRecursos((current) => (current || []).filter((item) => item.id !== id))
              toast.success("Recurso excluído")
            }}
            addLabel="Novo Recurso"
            onImport={() => setImportRecursosOpen(true)}
            onExport={handleExportRecursos}
          />
        </TabsContent>
      </Tabs>

      <SecretariaForm
        open={secretariaFormOpen}
        onOpenChange={setSecretariaFormOpen}
        secretaria={secretariaEditando}
        onSave={handleSaveSecretaria}
        secretariasExistentes={secretarias || []}
      />

      <SetorForm
        open={setorFormOpen}
        onOpenChange={setSetorFormOpen}
        setor={setorEditando}
        onSave={handleSaveSetor}
        secretariaIdInicial={secretariaIdParaNovoSetor}
      />

      <ContaForm
        open={contaFormOpen}
        onOpenChange={setContaFormOpen}
        conta={contaEditando}
        onSave={handleSaveConta}
        contasExistentes={contas || []}
      />

      <CredorForm
        open={credorFormOpen}
        onOpenChange={setCredorFormOpen}
        credor={credorEditando}
        onSave={handleSaveCredor}
        credoresExistentes={credores || []}
      />

      <ObjetoForm
        open={objetoFormOpen}
        onOpenChange={setObjetoFormOpen}
        objeto={objetoEditando}
        onSave={handleSaveObjeto}
        objetosExistentes={objetos || []}
      />

      <RecursoForm
        open={recursoFormOpen}
        onOpenChange={setRecursoFormOpen}
        recurso={recursoEditando}
        onSave={handleSaveRecurso}
        recursosExistentes={recursos || []}
      />

      <ImportCadastroDialog<Secretaria>
        open={importSecretariasOpen}
        onOpenChange={setImportSecretariasOpen}
        onImport={handleImportSecretarias}
        title="Importar Secretarias"
        description="Importe secretarias em lote através de uma planilha Excel (.xlsx)"
        onDownloadTemplate={downloadSecretariasTemplate}
        onImportExcel={importSecretariasFromExcel}
      />

      <ImportCadastroDialog<Setor>
        open={importSetoresOpen}
        onOpenChange={setImportSetoresOpen}
        onImport={handleImportSetores}
        title="Importar Setores"
        description="Importe setores em lote através de uma planilha Excel (.xlsx)"
        onDownloadTemplate={downloadSetoresTemplate}
        onImportExcel={importSetoresFromExcel}
      />

      <ImportCadastroDialog<Conta>
        open={importContasOpen}
        onOpenChange={setImportContasOpen}
        onImport={handleImportContas}
        title="Importar Contas"
        description="Importe contas em lote através de uma planilha Excel (.xlsx)"
        onDownloadTemplate={downloadContasTemplate}
        onImportExcel={importContasFromExcel}
      />

      <ImportCadastroDialog<Credor>
        open={importCredoresOpen}
        onOpenChange={setImportCredoresOpen}
        onImport={handleImportCredores}
        title="Importar Credores"
        description="Importe credores em lote através de uma planilha Excel (.xlsx)"
        onDownloadTemplate={downloadCredoresTemplate}
        onImportExcel={importCredoresFromExcel}
      />

      <ImportCadastroDialog<Objeto>
        open={importObjetosOpen}
        onOpenChange={setImportObjetosOpen}
        onImport={handleImportObjetos}
        title="Importar Objetos"
        description="Importe objetos em lote através de uma planilha Excel (.xlsx)"
        onDownloadTemplate={downloadObjetosTemplate}
        onImportExcel={importObjetosFromExcel}
      />

      <ImportCadastroDialog<Recurso>
        open={importRecursosOpen}
        onOpenChange={setImportRecursosOpen}
        onImport={handleImportRecursos}
        title="Importar Recursos"
        description="Importe recursos em lote através de uma planilha Excel (.xlsx)"
        onDownloadTemplate={downloadRecursosTemplate}
        onImportExcel={importRecursosFromExcel}
      />
    </div>
  )
}
