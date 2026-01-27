import { useEffect } from 'react'
import { subscribeToAllCollections } from '@/lib/firebase-service'

/**
 * Hook para sincronização em tempo real de todas as coleções com Firebase
 * Mantém os dados sempre atualizados entre múltiplos usuários
 */
export function useRealtimeSync(enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) {
      console.log('⏸️ Sincronização em tempo real desativada')
      return
    }

    console.log('🚀 Iniciando sincronização em tempo real com Firebase...')

    // Lista de todas as coleções a sincronizar
    const collections = [
      'processos',
      'secretarias',
      'setores',
      'contas',
      'credores',
      'objetos',
      'recursos',
      'anos',
      'meses',
      'dids',
      'notas_fiscais',
      'usuarios'
    ]

    // Callback quando dados são atualizados
    const handleUpdate = (key: string, data: any) => {
      if (data === null) {
        console.log(`⚠️ Sem dados no Firebase para "${key}"`)
        return
      }

      // Atualizar localStorage com dados do Firebase
      try {
        localStorage.setItem(key, JSON.stringify(data))
        console.log(`✅ Atualizado localStorage: ${key}`)
        
        // Disparar evento customizado para componentes reagirem
        window.dispatchEvent(new CustomEvent('firebase-sync', { 
          detail: { key, data } 
        }))
      } catch (error) {
        console.error(`❌ Erro ao atualizar localStorage para ${key}:`, error)
      }
    }

    // Inscrever-se para todas as coleções
    const unsubscribe = subscribeToAllCollections(collections, handleUpdate)

    console.log('✅ Sincronização em tempo real ativa para', collections.length, 'coleções')

    // Cleanup ao desmontar
    return () => {
      console.log('🔌 Desconectando sincronização em tempo real')
      unsubscribe()
    }
  }, [enabled])
}
