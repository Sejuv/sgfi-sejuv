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
 * Salva dados no Firestore
 */
export async function saveToFirestore(key: string, data: any): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, key)
    await setDoc(docRef, { data, updatedAt: new Date().toISOString() })
    console.log(`🔥 Firebase: Dados salvos em "${key}"`)
  } catch (error) {
    console.error(`❌ Erro ao salvar no Firebase (${key}):`, error)
    throw error
  }
}

/**
 * Carrega dados do Firestore
 */
export async function loadFromFirestore(key: string, defaultValue: any = null): Promise<any> {
  try {
    const docRef = doc(db, COLLECTION_NAME, key)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      const result = docSnap.data().data
      console.log(`🔥 Firebase: Dados carregados de "${key}"`, result)
      return result
    } else {
      console.log(`🔥 Firebase: Documento "${key}" não existe, usando valor padrão`)
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
  
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data().data
      console.log(`🔥 Firebase: Atualização recebida em "${key}"`, data)
      callback(data)
    } else {
      console.log(`🔥 Firebase: Documento "${key}" deletado, usando valor padrão`)
      callback(defaultValue)
    }
  }, (error) => {
    console.error(`❌ Erro ao escutar mudanças no Firebase (${key}):`, error)
  })
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
