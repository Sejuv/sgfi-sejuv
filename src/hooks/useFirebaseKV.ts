import { useState, useEffect, useRef, useCallback } from 'react'
import { loadFromFirestore, saveToFirestore, subscribeToFirestore } from '@/lib/firebase-service'
import type { Unsubscribe } from 'firebase/firestore'

const globalCache = new Map<string, any>()
const globalListeners = new Map<string, Set<(data: any) => void>>()
const globalUnsubscribers = new Map<string, Unsubscribe>()
const savingKeys = new Set<string>()
const loadingPromises = new Map<string, Promise<any>>()

export function useFirebaseKV<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const defaultValueRef = useRef<T>(defaultValue)
  
  const [value, setValue] = useState<T>(() => {
    if (globalCache.has(key)) {
      console.log(`💾 [${key}] Inicializando com cache`)
      return globalCache.get(key)
    }
    console.log(`💾 [${key}] Inicializando com defaultValue`)
    return defaultValue
  })
  
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    
    const onDataChange = (data: any) => {
      if (isMountedRef.current) {
        console.log(`🔔 [${key}] Dados alterados`)
        globalCache.set(key, data)
        setValue(data)
      }
    }

    if (!globalListeners.has(key)) {
      globalListeners.set(key, new Set())
    }
    globalListeners.get(key)!.add(onDataChange)

    const initializeData = async () => {
      if (!globalCache.has(key)) {
        if (!loadingPromises.has(key)) {
          console.log(`🔄 [${key}] Iniciando carregamento do Firebase`)
          const loadPromise = loadFromFirestore(key, defaultValueRef.current)
            .then((data) => {
              console.log(`✅ [${key}] Dados carregados do Firebase`)
              globalCache.set(key, data)
              if (isMountedRef.current) {
                setValue(data)
              }
              loadingPromises.delete(key)
              return data
            })
            .catch((error) => {
              console.error(`❌ [${key}] Erro ao carregar:`, error)
              globalCache.set(key, defaultValueRef.current)
              if (isMountedRef.current) {
                setValue(defaultValueRef.current)
              }
              loadingPromises.delete(key)
              return defaultValueRef.current
            })
          
          loadingPromises.set(key, loadPromise)
          await loadPromise
        } else {
          console.log(`⏳ [${key}] Aguardando carregamento em andamento`)
          await loadingPromises.get(key)
        }
      } else {
        console.log(`♻️ [${key}] Usando cache existente`)
      }

      if (!globalUnsubscribers.has(key)) {
        console.log(`📡 [${key}] Criando listener do Firebase`)
        const unsubscribe = subscribeToFirestore(
          key,
          (listenerData) => {
            if (savingKeys.has(key)) {
              console.log(`⏭️ [${key}] Ignorando atualização (salvamento em andamento)`)
              return
            }
            
            console.log(`📥 [${key}] Atualização recebida do listener`)
            globalCache.set(key, listenerData)
            
            const listeners = globalListeners.get(key)
            if (listeners) {
              listeners.forEach(listener => listener(listenerData))
            }
          },
          defaultValueRef.current
        )
        
        globalUnsubscribers.set(key, unsubscribe)
      }
    }

    initializeData()

    return () => {
      isMountedRef.current = false
      
      const listeners = globalListeners.get(key)
      if (listeners) {
        listeners.delete(onDataChange)
        
        if (listeners.size === 0) {
          console.log(`🔌 [${key}] Removendo listener (sem mais ouvintes)`)
          const unsubscribe = globalUnsubscribers.get(key)
          if (unsubscribe) {
            unsubscribe()
            globalUnsubscribers.delete(key)
          }
          globalListeners.delete(key)
        }
      }
    }
  }, [key])

  const updateValue = useCallback((newValue: T | ((prev: T) => T)) => {
    setValue((currentValue) => {
      const resolvedValue = typeof newValue === 'function' 
        ? (newValue as (prev: T) => T)(currentValue)
        : newValue
      
      console.log(`💾 [${key}] Salvando no Firebase`)
      globalCache.set(key, resolvedValue)
      
      savingKeys.add(key)
      
      saveToFirestore(key, resolvedValue)
        .then(() => {
          console.log(`✅ [${key}] Salvo com sucesso`)
          setTimeout(() => {
            savingKeys.delete(key)
            console.log(`🔓 [${key}] Liberando listener`)
          }, 500)
        })
        .catch(error => {
          console.error(`❌ [${key}] Erro ao salvar:`, error)
          savingKeys.delete(key)
        })
      
      return resolvedValue
    })
  }, [key])

  return [value, updateValue]
}
