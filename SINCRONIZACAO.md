# Sistema de Sincronização de Dados

## Visão Geral

O Sistema de Gestão de Processos de Despesas Públicas agora conta com um módulo completo de sincronização de dados que permite backup, restauração e gerenciamento automático de todas as informações do sistema.

## Funcionalidades Implementadas

### 1. Exportação de Dados (Backup Manual)

**Descrição:** Permite fazer download de um arquivo JSON contendo todos os dados do sistema.

**Dados Incluídos:**
- Processos de Despesa
- Secretarias
- Setores
- Contas
- Credores
- Objetos
- Recursos

**Como Usar:**
1. Acesse o menu "Sincronização" na sidebar
2. Clique em "Exportar Backup"
3. Um arquivo JSON será baixado automaticamente com nome `backup-sistema-[timestamp].json`

**Formato do Arquivo:**
```json
{
  "processos": [...],
  "secretarias": [...],
  "setores": [...],
  "contas": [...],
  "credores": [...],
  "objetos": [...],
  "recursos": [...],
  "timestamp": 1234567890,
  "version": "1.0.0"
}
```

### 2. Importação de Dados (Restauração)

**Descrição:** Restaura dados de um backup anterior ou importa dados de outro sistema.

**Como Usar:**
1. Acesse o menu "Sincronização" na sidebar
2. Clique em "Importar Backup"
3. Selecione um arquivo JSON válido de backup
4. O sistema validará e importará os dados
5. A página será recarregada automaticamente

**Validações:**
- Verifica se o arquivo é um JSON válido
- Valida a estrutura do arquivo (version e timestamp obrigatórios)
- Sobrescreve todos os dados existentes

**⚠️ ATENÇÃO:** A importação substitui completamente todos os dados atuais do sistema.

### 3. Sincronização Automática

**Descrição:** Cria backups automáticos em intervalos regulares configuráveis.

**Como Usar:**
1. Acesse o menu "Sincronização" na sidebar
2. Localize o card "Sincronização Automática"
3. Ative o switch "Ativar sincronização automática"
4. Selecione o intervalo desejado:
   - 5 minutos
   - 10 minutos
   - 15 minutos
   - 30 minutos
   - 1 hora
   - 2 horas
   - 4 horas

**Características:**
- Funciona em segundo plano enquanto o sistema está aberto
- Cria backups automaticamente no intervalo configurado
- Mostra o status da última sincronização
- Permite sincronização manual a qualquer momento
- Configurações são salvas no navegador

### 4. Limpeza de Dados

**Descrição:** Remove permanentemente todos os dados do sistema.

**Como Usar:**
1. Acesse o menu "Sincronização" na sidebar
2. Na seção "Zona de Perigo", clique em "Limpar Todos os Dados"
3. Confirme a ação no diálogo de confirmação
4. Todos os dados serão removidos permanentemente

**⚠️ ATENÇÃO:** 
- Esta ação é IRREVERSÍVEL
- Faça um backup antes de limpar os dados
- O sistema mostra um resumo dos dados que serão removidos

### 5. Estatísticas do Sistema

**Descrição:** Painel com visão geral de todos os dados armazenados.

**Métricas Exibidas:**
- Total de Processos
- Valor Total dos Processos
- Processos Pendentes
- Último Backup
- Total de Secretarias
- Total de Setores
- Total de Credores
- Total de Objetos
- Total de Contas
- Total de Recursos

## Arquitetura Técnica

### SyncService

Classe utilitária que gerencia todas as operações de sincronização:

**Métodos Principais:**
- `exportData()`: Retorna JSON com todos os dados
- `importData(jsonString)`: Importa dados de string JSON
- `downloadBackup()`: Baixa arquivo de backup
- `uploadBackup(file)`: Importa arquivo de backup
- `getLastSyncTimestamp()`: Retorna timestamp do último backup
- `clearAllData()`: Remove todos os dados
- `getDataStatistics()`: Retorna estatísticas do sistema

### Armazenamento

Todos os dados são armazenados usando a API `spark.kv`:

**Chaves Utilizadas:**
- `processos-despesas`: Array de ProcessoDespesa
- `cadastro-secretarias`: Array de Secretaria
- `cadastro-setores`: Array de Setor
- `cadastro-contas`: Array de Conta
- `cadastro-credores`: Array de Credor
- `cadastro-objetos`: Array de Objeto
- `cadastro-recursos`: Array de Recurso
- `sync-last-timestamp`: Timestamp do último backup
- `auto-sync-settings`: Configurações de sincronização automática
- `auto-sync-last`: Timestamp do último backup automático

## Fluxo de Dados

### Exportação
1. Usuário clica em "Exportar Backup"
2. Sistema coleta todos os dados do `spark.kv`
3. Dados são serializados em JSON com timestamp e versão
4. Arquivo é criado e download é iniciado
5. Timestamp de último backup é atualizado

### Importação
1. Usuário seleciona arquivo JSON
2. Sistema lê e valida o arquivo
3. Dados são parseados e validados
4. Dados são gravados no `spark.kv`
5. Timestamp de último backup é atualizado
6. Página é recarregada para refletir novos dados

### Sincronização Automática
1. Usuário ativa sincronização automática
2. Configurações são salvas no `spark.kv`
3. Timer é iniciado com intervalo configurado
4. A cada intervalo, backup é criado automaticamente
5. Status é atualizado na interface

## Segurança e Boas Práticas

### Recomendações

1. **Faça backups regulares:**
   - Configure a sincronização automática
   - Faça backups manuais antes de grandes alterações

2. **Armazene backups com segurança:**
   - Mantenha cópias em local seguro
   - Não compartilhe arquivos de backup publicamente

3. **Valide antes de importar:**
   - Verifique a origem do arquivo de backup
   - Confirme que o arquivo não foi modificado

4. **Teste a restauração:**
   - Periodicamente teste restaurar um backup
   - Verifique a integridade dos dados

### Limitações

- Backups automáticos funcionam apenas enquanto o sistema está aberto
- Dados são armazenados localmente no navegador
- Não há sincronização entre diferentes navegadores/dispositivos
- Tamanho do backup limitado pelo espaço do navegador

## Compatibilidade

- ✅ Chrome/Edge (recomendado)
- ✅ Firefox
- ✅ Safari
- ✅ Outros navegadores modernos com suporte a IndexedDB

## Solução de Problemas

### Erro ao Exportar
- Verifique se há dados no sistema
- Limpe o cache do navegador
- Tente em outro navegador

### Erro ao Importar
- Verifique se o arquivo é um JSON válido
- Confirme que o arquivo não foi corrompido
- Verifique se o formato corresponde à versão do sistema

### Sincronização Automática não funciona
- Verifique se o switch está ativado
- Mantenha a aba do navegador aberta
- Verifique o console do navegador para erros

## Suporte

Para problemas ou dúvidas sobre o sistema de sincronização:
1. Verifique a documentação acima
2. Consulte os logs no console do navegador
3. Entre em contato com o administrador do sistema
