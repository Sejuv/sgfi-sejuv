import { useState, useEffect, useRef, useCallback } from 'react'
import { loadFromFirestore, saveToFirestore, subscribeToFirestore } from '@/lib/firebase-service'
import type { Unsubscribe } from 'firebase/firestore'

// Cache global para evitar múltiplos listeners para a mesma key
const globalCache = new Map<string, any>()
const globalListeners = new Map<string, Set<(data: any) => void>>()
const globalUnsubscribers = new Map<string, Unsubscribe>()

/**
 * Hook para usar Firebase Firestore com sincronização em tempo real
 * Usa cache global para evitar múltiplos listeners para a mesma key
 */
export function useFirebaseKV<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  // Usa ref para defaultValue para evitar re-execução do useEffect
  const defaultValueRef = useRef<T>(defaultValue)
  
  const [value, setValue] = useState<T>(() => {
    // Tenta usar o cache primeiro
    if (globalCache.has(key)) {
      return globalCache.get(key)
    }
    return defaultValue
  })
  
  const isMountedRef = useRef(true)
  const saveTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    isMountedRef.current = true
    
    // Callback para quando dados mudarem
    const onDataChange = (data: any) => {
      if (isMountedRef.current) {
        globalCache.set(key, data)
        setValue(data)
      }
    }

    // Registra listener local
    if (!globalListeners.has(key)) {
      globalListeners.set(key, new Set())
    }
    globalListeners.get(key)!.add(onDataChange)

    // Cria listener global apenas se não existir
    if (!globalUnsubscribers.has(key)) {
      const unsubscribe = subscribeToFirestore(key, (data) => {
        globalCache.set(key, data)
        // Notifica todos os listeners locais
        const listeners = globalListeners.get(key)
        if (listeners) {
          listeners.forEach(listener => listener(data))
        }
      }, defaultValueRef.current)
      
      globalUnsubscribers.set(key, unsubscribe)
    }

    // Cleanup: remove listener local
    return () => {
      isMountedRef.current = false
      
      const listeners = globalListeners.get(key)
      if (listeners) {
        listeners.delete(onDataChange)
        
        // Se não há mais listeners, remove o listener global
        if (listeners.size === 0) {
          const unsubscribe = globalUnsubscribers.get(key)
          if (unsubscribe) {
            unsubscribe()
            globalUnsubscribers.delete(key)
          }
          globalListeners.delete(key)
        }
      }
      
      // Limpa timeout pendente
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [key]) // Removido defaultValue das dependências

  // Salva no Firebase com debounce para evitar escritas excessivas
  const updateValue = useCallback((newValue: T | ((prev: T) => T)) => {
    const resolvedValue = typeof newValue === 'function' 
      ? (newValue as (prev: T) => T)(value)
      : newValue
    
    setValue(resolvedValue)
    globalCache.set(key, resolvedValue)
    
    // Debounce: aguarda 300ms antes de salvar no Firebase
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveToFirestore(key, resolvedValue).catch(error => {
        console.error('❌ Erro ao salvar:', error)
      })
    }, 300)
  }, [key, value])

  return [value, updateValue]
}
