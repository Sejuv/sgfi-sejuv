import { db } from './firebase-config'
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot,
  Unsubscribe 
} from 'firebase/firestore'

/**
 * Serviço de sincronização com Firebase Firestore
 * Substitui o localStorage por banco de dados na nuvem
 */

const COLLECTION_NAME = 'sistema-gestao'

export interface FirebaseData {
  [key: string]: any
}

/**
 * Remove valores undefined de um objeto (recursivamente)
 */
function removeUndefined(obj: any): any {
  if (obj === null || obj === undefined) {
    return null
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefined(item))
  }
  
  if (typeof obj === 'object') {
    const cleaned: any = {}
    for (const key in obj) {
      const value = obj[key]
      if (value !== undefined) {
        cleaned[key] = removeUndefined(value)
      }
    }
    return cleaned
  }
  
  return obj
}

/**
 * Salva dados no Firestore
 */
export async function saveToFirestore(key: string, data: any): Promise<void> {
  const maxRetries = 3
  let attempt = 0
  
  while (attempt < maxRetries) {
    try {
      const docRef = doc(db, COLLECTION_NAME, key)
      const cleanedData = removeUndefined(data)
      const timestamp = new Date().toISOString()
      
      console.log(`🔥 Salvando em "${key}" no Firebase (tentativa ${attempt + 1}/${maxRetries})...`, { 
        collection: COLLECTION_NAME, 
        docId: key,
        dataSize: JSON.stringify(cleanedData).length 
      })
      
      await setDoc(docRef, { 
        data: cleanedData, 
        updatedAt: timestamp,
        _metadata: {
          lastModified: timestamp,
          version: 1
        }
      }, { merge: false })
      
      console.log(`✅ Firebase: Dados persistidos com sucesso em "${key}" às ${timestamp}`)
      return
    } catch (error) {
      attempt++
      console.error(`❌ Erro ao salvar no Firebase (${key}) - tentativa ${attempt}/${maxRetries}:`, error)
      
      if (attempt >= maxRetries) {
        console.error(`❌ Erro crítico: Falha após ${maxRetries} tentativas`)
        throw error
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
    }
  }
}

/**
 * Carrega dados do Firestore
 */
export async function loadFromFirestore(key: string, defaultValue: any = null): Promise<any> {
  try {
    console.log(`🔍 Carregando "${key}" do Firebase...`)
    const docRef = doc(db, COLLECTION_NAME, key)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      const docData = docSnap.data()
      const result = docData.data
      console.log(`✅ Firebase: Dados encontrados em "${key}"`, {
        hasData: !!result,
        updatedAt: docData.updatedAt,
        dataSize: JSON.stringify(result).length
      })
      return result
    } else {
      console.log(`⚠️ Firebase: Documento "${key}" não existe, retornando valor padrão`)
      return defaultValue
    }
  } catch (error) {
    console.error(`❌ Erro ao carregar do Firebase (${key}):`, error)
    return defaultValue
  }
}

/**
 * Inscreve-se para atualizações em tempo real
 */
export function subscribeToFirestore(
  key: string, 
  callback: (data: any) => void,
  defaultValue: any = null
): Unsubscribe {
  const docRef = doc(db, COLLECTION_NAME, key)
  console.log(`📡 Criando listener em tempo real para "${key}"`)
  
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const docData = docSnap.data()
      const data = docData.data
      console.log(`📥 Firebase: Atualização recebida em "${key}"`, {
        hasData: !!data,
        updatedAt: docData.updatedAt
      })
      callback(data)
    } else {
      console.log(`⚠️ Firebase: Documento "${key}" não existe no snapshot, usando defaultValue`)
      callback(defaultValue)
    }
  }, (error) => {
    console.error(`❌ Erro no listener do Firebase (${key}):`, error)
  })
}

/**
 * Inscreve-se para múltiplas coleções em tempo real
 * Retorna um unsubscribe que cancela todos os listeners
 */
export function subscribeToAllCollections(
  collections: string[],
  onUpdate: (key: string, data: any) => void
): Unsubscribe {
  console.log('📡 Inscrevendo listeners para todas as coleções:', collections)
  
  const unsubscribers: Unsubscribe[] = []
  
  collections.forEach(key => {
    const unsubscribe = subscribeToFirestore(key, (data) => {
      onUpdate(key, data)
    }, null)
    unsubscribers.push(unsubscribe)
  })
  
  // Retorna função que cancela todos os listeners
  return () => {
    console.log('🔌 Cancelando todos os listeners de coleções')
    unsubscribers.forEach(unsub => unsub())
  }
}

/**
 * Migra dados do localStorage para o Firebase
 */
export async function migrateFromLocalStorage(): Promise<void> {
  console.log('🔄 Iniciando migração de localStorage para Firebase...')
  
  const keys = [
    'usuarios',
    'sessao',
    'processos',
    'cadastro-secretarias',
    'cadastro-setores',
    'cadastro-contas',
    'cadastro-credores',
    'cadastro-objetos',
    'cadastro-meses',
    'cadastro-anos',
    'cadastro-recursos',
    'cadastro-dids',
    'cadastro-notas-fiscais'
  ]
  
  for (const key of keys) {
    const localData = localStorage.getItem(key)
    if (localData) {
      try {
        const parsedData = JSON.parse(localData)
        await saveToFirestore(key, parsedData)
        console.log(`✅ Migrado: ${key}`)
      } catch (error) {
        console.error(`❌ Erro ao migrar ${key}:`, error)
      }
    }
  }
  
  console.log('✅ Migração concluída!')
}
