# Sistema de Sincronização Firebase e Backup Automático

## 📋 Visão Geral

Este documento descreve o sistema de sincronização em tempo real com Firebase e backup automático implementado no sistema de gestão de processos.

## 🔄 Sincronização em Tempo Real

### Como Funciona

O sistema mantém todos os dados sincronizados automaticamente entre múltiplos usuários/abas usando Firebase Firestore:

1. **Hook useRealtimeSync**: Monitora 12 coleções em tempo real
   - `processos`, `secretarias`, `setores`, `contas`, `credores`, `objetos`
   - `recursos`, `anos`, `meses`, `dids`, `notas_fiscais`, `usuarios`

2. **Fluxo de Sincronização**:
   ```
   Usuário A faz alteração → Firebase atualiza → Usuário B recebe atualização instantânea
   ```

3. **Prevenção de Dados Desatualizados**:
   - Listeners em tempo real para todas as coleções
   - Atualização automática do localStorage quando Firebase muda
   - Evento customizado `firebase-sync` para componentes reagirem

### Componentes Principais

#### `src/hooks/useRealtimeSync.ts`
- Hook principal de sincronização
- Inscreve-se automaticamente em todas as coleções
- Atualiza localStorage quando dados mudam no Firebase
- Dispara eventos para componentes reagirem

#### `src/lib/firebase-service.ts`
- `subscribeToFirestore()`: Listener para um documento
- `subscribeToAllCollections()`: Listener para múltiplas coleções
- `saveToFirestore()`: Salva dados no Firebase
- `loadFromFirestore()`: Carrega dados do Firebase

#### `src/hooks/useFirebaseKV.ts`
- Hook para trabalhar com pares chave-valor no Firebase
- Cache global para evitar leituras duplicadas
- Salvamento imediato ao atualizar valores
- Prevenção de conflitos com `savingKeys` Set

## 💾 Backup Automático

### Sistema de Backup a Cada 1 Hora

#### `src/lib/auto-backup-service.ts`

Serviço singleton que executa backups automáticos:

**Funcionalidades**:
- ✅ Backup automático a cada **1 hora** (3.600.000ms)
- ✅ Salva todas as 13 coleções do sistema
- ✅ Armazena no Firebase em `sistema_backup/latest`
- ✅ Mantém histórico em `sistema_backup_historico`
- ✅ Limpa backups com mais de 24 horas automaticamente
- ✅ Permite restauração do último backup

**Métodos**:
```typescript
autoBackupService.start()           // Inicia backup automático
autoBackupService.stop()            // Para backup automático
autoBackupService.restore()         // Restaura do último backup
autoBackupService.isEnabled()       // Verifica se está ativo
autoBackupService.getLastBackupTime() // Último backup
```

**Inicialização**:
O serviço é inicializado automaticamente ao carregar a página se estava ativado anteriormente (configuração salva no localStorage).

### Interface de Controle

#### `src/components/AutoSyncCard.tsx`

Card de configuração de backup automático:

**Recursos**:
- Switch para ativar/desativar backup automático
- Seletor de intervalo (5min, 10min, 15min, 30min, **1h**, 2h, 4h)
- Indicador visual do status (ativo/inativo)
- Última sincronização
- Botão de sincronização manual
- **Padrão: 1 hora** (3.600.000ms)

**Integração**:
- Ativa/desativa `autoBackupService` automaticamente
- Salva configurações no localStorage
- Exibe avisos quando backup está desativado

## 🔧 Integração no App

### `src/App.tsx`

```typescript
// Sincronização em tempo real ativa automaticamente
useRealtimeSync(true)
```

Ao carregar a aplicação:
1. ✅ Sincronização em tempo real inicia automaticamente
2. ✅ Backup automático inicia se estava ativado anteriormente
3. ✅ Todos os dados ficam sincronizados entre usuários
4. ✅ Backups salvos no Firebase a cada 1 hora

## 📊 Estrutura de Dados no Firebase

### Coleção: `sistema-gestao`

Documentos principais:
- `processos`: Lista de processos de despesa
- `secretarias`: Cadastro de secretarias
- `setores`: Cadastro de setores
- `contas`: Cadastro de contas bancárias
- `credores`: Cadastro de credores
- `objetos`: Cadastro de objetos de despesa
- `recursos`: Cadastro de recursos orçamentários
- `anos`: Cadastro de anos fiscais
- `meses`: Cadastro de meses
- `dids`: Cadastro de DIDs
- `notas_fiscais`: Cadastro de notas fiscais
- `usuarios`: Lista de usuários do sistema

### Coleção: `sistema_backup`

- `latest`: Último backup completo
  ```json
  {
    "timestamp": 1234567890,
    "version": "1.0",
    "data": {
      "processos": [...],
      "secretarias": [...],
      ...
    }
  }
  ```

### Coleção: `sistema_backup_historico`

- `backup_[timestamp]`: Backups históricos
  - Mantém apenas últimas 24 horas
  - Limpeza automática de backups antigos

## 🚀 Como Usar

### Ativar Backup Automático

1. Abra o sistema
2. Clique em **"Sincronização"** no menu lateral
3. Ative o switch **"Ativar backup automático no Firebase"**
4. Selecione o intervalo (padrão: **1 hora**)
5. Pronto! Backups serão salvos automaticamente

### Restaurar do Backup

```typescript
const success = await autoBackupService.restore()
if (success) {
  console.log('✅ Dados restaurados com sucesso!')
}
```

### Monitorar Sincronização

Observe no console do navegador:
```
🚀 Iniciando sincronização em tempo real com Firebase...
📡 Inscrevendo listeners para todas as coleções: [12 coleções]
✅ Sincronização em tempo real ativa para 12 coleções
💾 Executando backup automático...
✅ Backup automático concluído com sucesso!
```

## ⚡ Vantagens

1. **Dados Sempre Atualizados**: Sincronização em tempo real garante que todos os usuários vejam os mesmos dados
2. **Segurança**: Backups automáticos a cada hora no Firebase
3. **Recuperação**: Restauração rápida em caso de perda de dados
4. **Histórico**: Mantém 24 horas de backups
5. **Zero Configuração**: Funciona automaticamente ao ativar
6. **Eficiente**: Usa cache global para evitar leituras duplicadas
7. **Confiável**: Prevenção de conflitos com salvamento

## 🔒 Segurança

- Autenticação Firebase configurada
- Regras de segurança do Firestore
- Dados criptografados em trânsito
- Backup com versionamento

## 📝 Logs e Monitoramento

Todos os eventos são registrados no console:
- 🚀 Início de serviços
- 📡 Inscrições de listeners
- 💾 Execuções de backup
- ✅ Sucessos
- ❌ Erros
- 🔌 Desconexões

## 🛠️ Troubleshooting

### Backup não está funcionando

1. Verifique se o switch está ativado
2. Abra o console e procure por erros
3. Verifique conexão com Firebase
4. Teste backup manual

### Dados não sincronizam

1. Verifique console por erros de listener
2. Confirme que Firebase está configurado
3. Teste em outra aba/navegador
4. Verifique regras do Firestore

### Como desativar temporariamente

```typescript
// No App.tsx, altere para:
useRealtimeSync(false)
```

## 📚 Referências

- [Firebase Firestore](https://firebase.google.com/docs/firestore)
- [Realtime Updates](https://firebase.google.com/docs/firestore/query-data/listen)
- [Best Practices](https://firebase.google.com/docs/firestore/best-practices)
