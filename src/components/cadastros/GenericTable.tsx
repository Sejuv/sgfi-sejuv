import { useState } from "react"
import { useKV } from "@/hooks/useKV"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash, FileArrowUp, FileCsv } from "@phosphor-icons/react"
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

interface GenericTableProps<T extends { id: string; ativo: boolean }> {
  title: string
  description: string
  data: T[]
  columns: { key: keyof T; label: string; render?: (value: any, item: T) => React.ReactNode }[]
  onAdd: () => void
  onEdit: (item: T) => void
  onDelete: (id: string) => void
  addLabel?: string
  onImport?: () => void
  onExport?: () => void
}

export function GenericTable<T extends { id: string; ativo: boolean }>({
  title,
  description,
  data,
  columns,
  onAdd,
  onEdit,
  onDelete,
  addLabel = "Novo",
  onImport,
  onExport
}: GenericTableProps<T>) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <div className="flex gap-2">
          {onExport && data.length > 0 && (
            <Button onClick={onExport} variant="outline" size="sm" className="gap-2">
              <FileCsv className="h-4 w-4" weight="bold" />
              Exportar
            </Button>
          )}
          {onImport && (
            <Button onClick={onImport} variant="outline" size="sm" className="gap-2">
              <FileArrowUp className="h-4 w-4" weight="bold" />
              Importar
            </Button>
          )}
          <Button onClick={onAdd} size="sm" className="gap-2">
            <Plus weight="bold" />
            {addLabel}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhum registro encontrado</p>
            <p className="text-sm mt-1">Clique em "{addLabel}" para adicionar</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((col) => (
                    <TableHead key={String(col.key)}>{col.label}</TableHead>
                  ))}
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="text-right w-[120px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => (
                  <TableRow key={item.id}>
                    {columns.map((col) => (
                      <TableCell key={String(col.key)}>
                        {col.render 
                          ? col.render(item[col.key], item)
                          : String(item[col.key] || "-")}
                      </TableCell>
                    ))}
                    <TableCell>
                      <Badge variant={item.ativo ? "default" : "secondary"}>
                        {item.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(item)}
                          className="h-8 w-8"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(item.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
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
  )
}
