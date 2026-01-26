import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBRhNY4ooXIEJ-MtKz88k6HTiBalfn9uM",
  authDomain: "sistema-gestao-iraucuba.firebaseapp.com",
  projectId: "sistema-gestao-iraucuba",
  storageBucket: "sistema-gestao-iraucuba.firebasestorage.app",
  messagingSenderId: "230467630419",
  appId: "1:230467630419:web:a4c7e7fb6134e67d6a5da6"
}

// Inicializa o Firebase
export const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
