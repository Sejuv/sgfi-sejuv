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
        const parsed = JSON.parse(item);
        console.log(`✅ Carregando ${key} do localStorage:`, parsed);
        return parsed;
      }
      console.log(`ℹ️ Usando valor padrão para ${key}:`, defaultValue);
      return defaultValue;
    } catch (error) {
      console.error(`❌ Erro ao ler ${key} do localStorage:`, error);
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
      const serialized = JSON.stringify(storedValue);
      window.localStorage.setItem(key, serialized);
      console.log(`💾 Salvando ${key} no localStorage:`, storedValue);
    } catch (error) {
      console.error(`❌ Erro ao salvar ${key} no localStorage:`, error);
    }
  }, [key, storedValue]);

  // Função para atualizar o valor (suporta função ou valor direto)
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      console.log(`🔄 Atualizando ${key}:`, valueToStore);
      setStoredValue(valueToStore);
    } catch (error) {
      console.error(`❌ Erro ao atualizar ${key}:`, error);
    }
  };

  return [storedValue, setValue];
}
