import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { migrateFromLocalStorage } from '@/lib/firebase-service'
import { Cloud, Database, AlertCircle, CheckCircle2 } from 'lucide-react'

export function MigracaoFirebase() {
  const [status, setStatus] = useState<'idle' | 'migrating' | 'success' | 'error'>('idle')
  const [mensagem, setMensagem] = useState('')

  const executarMigracao = async () => {
    setStatus('migrating')
    setMensagem('Migrando dados do localStorage para Firebase...')
    
    try {
      await migrateFromLocalStorage()
      setStatus('success')
      setMensagem('✅ Migração concluída com sucesso! Seus dados agora estão na nuvem.')
      
      // Recarregar página após 3 segundos
      setTimeout(() => {
        window.location.reload()
      }, 3000)
    } catch (error) {
      setStatus('error')
      setMensagem(`❌ Erro na migração: ${error}`)
      console.error(error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cloud className="h-5 w-5" />
          Migração para Firebase
        </CardTitle>
        <CardDescription>
          Migre seus dados do armazenamento local para a nuvem do Firebase
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === 'idle' && (
          <>
            <Alert>
              <Database className="h-4 w-4" />
              <AlertDescription>
                Esta ação vai copiar todos os seus dados (usuários, processos, cadastros) 
                do navegador para o Firebase. Após a migração, você poderá acessar o sistema 
                de qualquer dispositivo.
              </AlertDescription>
            </Alert>
            <Button onClick={executarMigracao} className="w-full">
              <Cloud className="mr-2 h-4 w-4" />
              Iniciar Migração
            </Button>
          </>
        )}

        {status === 'migrating' && (
          <Alert>
            <Database className="h-4 w-4 animate-pulse" />
            <AlertDescription>{mensagem}</AlertDescription>
          </Alert>
        )}

        {status === 'success' && (
          <Alert className="border-green-500 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{mensagem}</AlertDescription>
          </Alert>
        )}

        {status === 'error' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{mensagem}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
