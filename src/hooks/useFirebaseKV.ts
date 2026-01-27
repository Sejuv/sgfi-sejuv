import { useState, useEffect, useRef } from 'react'
import { loadFromFirestore, saveToFirestore, subscribeToFirestore } from '@/lib/firebase-service'
import type { Unsubscribe } from 'firebase/firestore'

/**
 * Hook para usar Firebase Firestore com sincronização em tempo real
 * Substitui o useKV que usava localStorage
 */
export function useFirebaseKV<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(defaultValue)
  const unsubscribeRef = useRef<Unsubscribe | null>(null)
  const isMountedRef = useRef(true)

  // Carrega dados iniciais do Firebase e configura sincronização em tempo real
  useEffect(() => {
    isMountedRef.current = true
    
    // Carrega dados iniciais
    loadFromFirestore(key, defaultValue).then(data => {
      if (isMountedRef.current) {
        setValue(data)
      }
    })

    // Se inscreve para atualizações em tempo real
    unsubscribeRef.current = subscribeToFirestore(key, (data) => {
      if (isMountedRef.current) {
        setValue(data)
      }
    }, defaultValue)

    // Cleanup: cancela inscrição quando componente desmonta
    return () => {
      isMountedRef.current = false
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [key, defaultValue])

  // Salva no Firebase quando valor muda
  const updateValue = (newValue: T) => {
    setValue(newValue)
    saveToFirestore(key, newValue).catch(error => {
      console.error('❌ Erro ao salvar:', error)
    })
  }

  return [value, updateValue]
}
