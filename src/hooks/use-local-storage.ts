import { useState, useEffect, useCallback } from 'react'

/**
 * Hook que substitui o useKV do @github/spark/hooks,
 * persistindo o estado no localStorage do navegador.
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(`sgfi_${key}`)
      return stored !== null ? (JSON.parse(stored) as T) : defaultValue
    } catch {
      return defaultValue
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(`sgfi_${key}`, JSON.stringify(state))
    } catch {
      // ignora erros de quota
    }
  }, [key, state])

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setState((prev) => {
        const next = typeof value === 'function' ? (value as (prev: T) => T)(prev) : value
        return next
      })
    },
    []
  )

  return [state, setValue]
}
