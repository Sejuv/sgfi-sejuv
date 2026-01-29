# Diagnóstico - Usuário Sumiu do Firebase

## O que aconteceu?
O usuário criado sumiu tanto do sistema quanto do Firebase.

## Possíveis causas:

### 1. Falha na gravação no Firebase
- O usuário foi criado localmente mas não foi salvo no Firestore
- Erro de permissão ou timeout durante o `saveToFirestore()`

### 2. Conflito de sincronização (MAIS PROVÁVEL)
- O listener do Firebase recebeu dados antigos (array vazio)
- Sobrescreveu o estado local com dados vazios do Firebase
- Isso acontece quando há race condition entre save e listener

### 3. Recarregamento da página antes do save
- Se você recarregou a página antes do `saveToFirestore()` completar
- Os dados foram perdidos

## Como verificar agora:

### 1. Abrir o Console do Navegador (F12)
```javascript
// Verificar cache global
console.log(window.__FIREBASE_CACHE__)

// Verificar estado dos hooks
import { loadFromFirestore } from './src/lib/firebase-service'
const usuarios = await loadFromFirestore('usuarios', [])
console.log('Usuários no Firebase:', usuarios)
```

### 2. Verificar diretamente no Firebase Console
1. Acesse: https://console.firebase.google.com
2. Vá em Firestore Database
3. Procure a coleção `sistema-gestao`
4. Verifique o documento `usuarios`
5. Veja o conteúdo do campo `data`

### 3. Verificar logs do navegador
Procure por mensagens do tipo:
- `✅ Firebase: Dados persistidos com sucesso em "usuarios"`
- `❌ Erro ao salvar no Firebase`
- `📥 Firebase: Atualização recebida do listener`

## Solução temporária:

Se o usuário sumiu, você pode recriá-lo. Mas antes vamos corrigir o problema de sincronização.

## Correção do problema:

O bug está na race condition entre save e listener. Quando você salva um usuário:
1. `saveToFirestore()` é chamado
2. Firebase ainda não atualizou
3. Listener recebe dados antigos (sem o novo usuário)
4. Listener sobrescreve o estado local com dados antigos

**Já existe proteção no código:**
```typescript
if (savingKeys.has(key)) {
  console.log(`⏭️ [${key}] Ignorando atualização (salvamento em andamento)`)
  return
}
```

Mas o `savingKeys.delete(key)` acontece após 500ms, pode não ser suficiente.

## Para recuperar o usuário:

1. Verifique o Firebase Console
2. Se o usuário NÃO está lá, recrie manualmente
3. Se o usuário ESTÁ lá mas não aparece no sistema, force reload:
   - F5 (recarregar página)
   - Limpar cache do navegador
