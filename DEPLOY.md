# 🚀 Guia de Deploy - Sistema de Gestão de Processos

Este guia explica como colocar o sistema online e acessível de qualquer lugar.

## 📋 Pré-requisitos

1. Conta do GitHub (gratuita)
2. Conta do Firebase (gratuita)
3. Conta do Vercel (gratuita)

## Passo 1: Configurar Firebase

### 1.1 Criar Projeto no Firebase

1. Acesse: https://console.firebase.google.com
2. Clique em **"Adicionar projeto"**
3. Nome do projeto: `sistema-gestao-iraucuba` (ou outro nome)
4. Desabilite o Google Analytics (opcional)
5. Clique em **"Criar projeto"**

### 1.2 Configurar Firestore Database

1. No menu lateral, clique em **"Firestore Database"**
2. Clique em **"Criar banco de dados"**
3. Modo de produção: selecione **"Iniciar no modo de teste"**
4. Localização: escolha **"southamerica-east1 (São Paulo)"**
5. Clique em **"Ativar"**

### 1.3 Obter Credenciais

1. No menu lateral, clique no ícone de **engrenagem** ⚙️ > **"Configurações do projeto"**
2. Role até a seção **"Seus aplicativos"**
3. Clique no ícone **"</>"** (Web)
4. Apelido do app: `gestao-web`
5. **NÃO** marque "Configurar Firebase Hosting"
6. Clique em **"Registrar app"**
7. Copie as credenciais que aparecerão:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "sistema-gestao-xxx.firebaseapp.com",
  projectId: "sistema-gestao-xxx",
  storageBucket: "sistema-gestao-xxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### 1.4 Configurar Regras de Segurança

1. No Firestore, vá em **"Regras"**
2. Cole as seguintes regras:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /sistema-gestao/{document=**} {
      allow read, write: if true;
    }
  }
}
```

3. Clique em **"Publicar"**

⚠️ **IMPORTANTE**: Estas regras permitem acesso total. Para produção, adicione autenticação adequada.

### 1.5 Atualizar Configuração do Projeto

1. Abra o arquivo `src/lib/firebase-config.ts`
2. Substitua as credenciais pelas que você copiou:

```typescript
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto-id",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "sua-app-id"
}
```

## Passo 2: Migrar Dados do localStorage para Firebase

1. Abra o Console do navegador (F12)
2. No Console, execute:

```javascript
// Importar a função de migração
import { migrateFromLocalStorage } from './src/lib/firebase-service'

// Executar migração
await migrateFromLocalStorage()
```

Ou adicione um botão temporário na interface para executar a migração.

## Passo 3: Preparar Deploy no GitHub

### 3.1 Criar Repositório no GitHub

1. Acesse: https://github.com/new
2. Nome do repositório: `sistema-gestao-processos`
3. Visibilidade: **Privado** (recomendado)
4. Clique em **"Create repository"**

### 3.2 Fazer Push do Código

No terminal do projeto, execute:

```bash
# Inicializar Git (se ainda não estiver)
git init

# Adicionar arquivos
git add .

# Fazer commit
git commit -m "Configuração inicial com Firebase"

# Adicionar repositório remoto (substitua SEU_USUARIO)
git remote add origin https://github.com/SEU_USUARIO/sistema-gestao-processos.git

# Enviar código
git push -u origin main
```

## Passo 4: Deploy no Vercel

### 4.1 Criar Conta e Conectar GitHub

1. Acesse: https://vercel.com/signup
2. Clique em **"Continue with GitHub"**
3. Autorize o Vercel a acessar seus repositórios

### 4.2 Importar Projeto

1. No dashboard do Vercel, clique em **"Add New Project"**
2. Selecione o repositório `sistema-gestao-processos`
3. Clique em **"Import"**

### 4.3 Configurar Deploy

1. **Framework Preset**: Vite (deve detectar automaticamente)
2. **Root Directory**: `./` (raiz do projeto)
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`
4. Clique em **"Deploy"**

### 4.4 Aguardar Deploy

- O Vercel vai instalar dependências e fazer o build
- Processo leva ~2-3 minutos
- Ao finalizar, você receberá um link como:
  - `https://sistema-gestao-processos.vercel.app`

## Passo 5: Testar o Sistema Online

1. Acesse o link fornecido pelo Vercel
2. Faça login com: `admin@iraucuba.ce.gov.br` / `admin123`
3. Verifique se os dados migrados aparecem
4. Crie um novo processo/cadastro
5. Abra em outra aba ou dispositivo - deve sincronizar automaticamente

## 📱 Acessar de Qualquer Lugar

Agora você pode:
- Salvar o link nos favoritos
- Acessar do celular, tablet, outro computador
- Compartilhar o link com outros usuários
- Dados ficam sempre sincronizados via Firebase

## 🔄 Atualizar o Sistema

Quando fizer mudanças no código:

```bash
# Adicionar mudanças
git add .

# Fazer commit
git commit -m "Descrição das mudanças"

# Enviar para GitHub
git push
```

O Vercel detecta automaticamente e faz redeploy em ~1 minuto!

## 🔒 Segurança

### Próximos Passos Recomendados:

1. **Atualizar regras do Firestore** para exigir autenticação
2. **Adicionar Firebase Authentication** para login seguro
3. **Configurar domínio customizado** (ex: gestao.iraucuba.ce.gov.br)
4. **Ativar SSL** (já vem ativado no Vercel)

## 🆘 Problemas Comuns

### Firebase não conecta
- Verifique se copiou todas as credenciais corretamente
- Confirme que o Firestore está ativado no console do Firebase

### Deploy falha no Vercel
- Verifique se não há erros de TypeScript
- Teste localmente: `npm run build`

### Dados não sincronizam
- Abra o Console (F12) e verifique erros
- Confirme que as regras do Firestore permitem leitura/escrita

## 📞 Suporte

Se precisar de ajuda, verifique:
- Console do navegador (F12 → Console)
- Logs do Vercel (Dashboard → Seu Projeto → Deployments → Ver logs)
- Uso do Firebase (Console Firebase → Usage)

---

✅ **Seu sistema agora está online e acessível de qualquer lugar!**
