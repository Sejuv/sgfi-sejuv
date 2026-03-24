import { useState, useEffect, useRef } from 'react';

/**
 * Hook personalizado que simula o useKV do @github/spark
 * Usa localStorage para persistência de dados
 */
export function useKV<T>(key: string, defaultValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const isFirstRender = useRef(true);
  
  // Inicializa o estado com o valor do localStorage ou o valor padrão
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        return JSON.parse(item);
      }
      return defaultValue;
    } catch {
      return defaultValue;
    }
  });

  // Sincroniza o estado com o localStorage quando ele muda
  useEffect(() => {
    // Não salva no primeiro render para evitar sobrescrever dados existentes
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch {
      // falha silenciosa — storage cheio ou modo privativo
    }
  }, [key, storedValue]);

  // Função para atualizar o valor (suporta função ou valor direto)
  const setValue = (value: T | ((val: T) => T)) => {
    const valueToStore = value instanceof Function ? value(storedValue) : value;
    setStoredValue(valueToStore);
  };

  return [storedValue, setValue];
}
