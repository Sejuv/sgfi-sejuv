import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function verificarUsuarios() {
  try {
    console.log('🔍 Verificando documento de usuários no Firebase...\n');
    
    const docRef = db.collection('sistema-gestao').doc('usuarios');
    const docSnap = await docRef.get();
    
    if (docSnap.exists) {
      const data = docSnap.data();
      console.log('📄 Documento encontrado!');
      console.log('📅 Última atualização:', data.updatedAt);
      console.log('\n👥 Usuários encontrados:');
      console.log(JSON.stringify(data.data, null, 2));
      console.log('\n✅ Total de usuários:', data.data?.length || 0);
    } else {
      console.log('❌ Documento "usuarios" não existe no Firebase!');
      console.log('⚠️ Isso explica porque os usuários desapareceram.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao verificar usuários:', error);
    process.exit(1);
  }
}

verificarUsuarios();
