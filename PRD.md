# Planning Guide

Sistema de Gestão de Processos de Despesas Públicas para a Prefeitura de Irauçuba - uma plataforma completa para rastreamento, workflow e análise de despesas governamentais municipais.

**Experience Qualities**:
1. **Professional** - Interface séria e confiável apropriada para uso governamental, com hierarquia clara de informações e navegação intuitiva
2. **Efficient** - Fluxo de trabalho otimizado para entrada rápida de dados e rastreamento de processos com múltiplos estágios de aprovação
3. **Transparent** - Visualização clara do status de processos e análises financeiras detalhadas para prestação de contas pública

**Complexity Level**: Complex Application (advanced functionality, likely with multiple views)
- O sistema requer múltiplas views (tabela de processos, dashboard de análise, formulário de entrada), workflow com múltiplos estágios, filtros avançados, agregações financeiras e formatação de moeda brasileira.

## Essential Features

### 1. Sistema de Autenticação e Login
- **Functionality**: Tela de login completa com autenticação de usuários por email e senha
- **Purpose**: Controlar acesso ao sistema e garantir segurança dos dados governamentais
- **Trigger**: Primeira tela ao acessar o sistema, ou ao fazer logout
- **Progression**: Acessa sistema → Visualiza tela de login → Insere email e senha → Autenticação → Acesso liberado → Sistema carrega com permissões do usuário
- **Success criteria**: Credenciais validadas corretamente, sessão persistida, usuário admin inicial criado automaticamente, logout funcional, senha hash com SHA-256

### 2. Cadastro de Processos de Despesa
- **Functionality**: Formulário completo para registro de novos processos de despesa com todos os campos obrigatórios
- **Purpose**: Capturar todas as informações necessárias para rastreamento e prestação de contas
- **Trigger**: Botão "Novo Processo" na tela principal
- **Progression**: Clica em "Novo Processo" → Preenche formulário (Ano como campo livre, Secretaria, Setor vinculado à Secretaria, Conta, Credor, Objeto, Mês, Valor, Recurso, DID como campo livre, NF como campo livre) → Salva → Processo criado com status pendente
- **Success criteria**: Dados salvos corretamente com validação de campos obrigatórios e formatação adequada de moeda

### 3. Gestão de Workflow (Trâmite)
- **Functionality**: Sistema de tracking com 5 etapas (Controladoria, Contabilidade, Compras, SEFIN, Tesouraria) onde cada etapa pode ser marcada com data de conclusão
- **Purpose**: Rastrear o progresso do processo através dos departamentos municipais
- **Trigger**: Clique em um processo para editar datas de trâmite
- **Progression**: Seleciona processo → Abre dialog de edição → Marca datas de conclusão de cada etapa → Salva → Status atualizado na tabela
- **Success criteria**: Datas salvas corretamente, coluna Tesouraria destacada em amarelo, filtro de pendentes funcional

### 4. Tabela de Processos com Filtros
- **Functionality**: Listagem completa de todos os processos com filtros por Ano, Secretaria, Mês, Recurso e status de pendência
- **Purpose**: Visualização rápida e busca eficiente de processos específicos
- **Trigger**: Página principal carrega automaticamente, filtros aplicados via controles na interface
- **Progression**: Acessa sistema → Visualiza tabela → Aplica filtros (Ano/Secretaria/Mês/Recurso/Pendentes) → Tabela atualiza → Pode editar ou visualizar detalhes
- **Success criteria**: Filtros funcionam corretamente em combinação, dados exibidos com formatação adequada

### 5. Painel de Métricas com Gráficos
- **Functionality**: Dashboard visual com gráficos de barras, pizza e linhas mostrando análise de gastos por secretaria, evolução mensal, distribuição por recurso e tipo de conta
- **Purpose**: Fornecer visualização gráfica intuitiva dos gastos para facilitar análise e tomada de decisão
- **Trigger**: Navegação para aba "Métricas"
- **Progression**: Clica em "Métricas" → Visualiza cards de resumo (total geral, média, pendentes, concluídos) → Analisa gráfico de gastos por secretaria → Observa distribuição por recurso → Acompanha evolução mensal → Vê ranking de secretarias
- **Success criteria**: Gráficos renderizados corretamente, tooltips informativos, cores consistentes com tema, responsivo em diferentes telas, dados sincronizados com filtros aplicados

### 6. Dashboard de Resumo Financeiro
- **Functionality**: Análise financeira tipo tabela dinâmica mostrando soma de valores agrupados por Credor e detalhados por Objeto
- **Purpose**: Fornecer relatórios detalhados para prestação de contas e análise de gastos
- **Trigger**: Navegação para aba "Resumo Financeiro"
- **Progression**: Clica em "Resumo Financeiro" → Visualiza tabela dinâmica com totais por Credor → Expande credor → Vê detalhamento por Objeto → Aplica filtros para análises específicas
- **Success criteria**: Cálculos corretos, valores formatados em BRL, agrupamentos funcionais, filtros aplicados ao resumo

### 7. Edição e Exclusão de Processos
- **Functionality**: Capacidade de editar dados de processos existentes ou excluí-los
- **Purpose**: Corrigir erros de entrada ou remover processos inválidos
- **Trigger**: Botões de ação na linha da tabela
- **Progression**: Seleciona processo → Clica em editar → Modifica dados → Salva → Tabela atualiza
- **Success criteria**: Alterações persistidas, validação mantida, confirmação antes de exclusão

### 8. Sistema de Cadastros
- **Functionality**: Gerenciamento completo de cadastros auxiliares (Secretarias, Setores, Contas, Credores, Objetos, Recursos)
- **Purpose**: Padronizar dados e facilitar entrada de processos
- **Trigger**: Navegação para aba "Cadastros"
- **Progression**: Clica em "Cadastros" → Seleciona tipo de cadastro → Visualiza lista → Cria/edita/exclui registros → Dados salvos e disponíveis para uso em processos
- **Success criteria**: CRUD completo funcionando, validação de duplicatas, setores vinculados a secretarias, recursos vinculados a secretarias, drag-and-drop de setores

### 9. Sincronização de Dados
- **Functionality**: Sistema completo de backup, restauração e sincronização automática de todos os dados do sistema
- **Purpose**: Garantir segurança dos dados, permitir backup/restauração e facilitar migração entre sistemas
- **Trigger**: Navegação para aba "Sincronização"
- **Progression**: 
  - **Exportação**: Clica em "Exportar Backup" → Download automático de arquivo JSON com todos os dados
  - **Importação**: Clica em "Importar Backup" → Seleciona arquivo JSON → Validação → Importação → Recarga automática
  - **Auto-sync**: Ativa sincronização automática → Configura intervalo → Sistema cria backups automaticamente
  - **Limpeza**: Acessa "Zona de Perigo" → Confirma exclusão → Todos os dados removidos
- **Success criteria**: 
  - Backup exporta todos os dados (processos, secretarias, setores, contas, credores, objetos, recursos)
  - Importação valida formato e versão
  - Auto-sync funciona em segundo plano com intervalos configuráveis (5min a 4h)
  - Estatísticas mostram resumo completo do sistema
  - Limpeza requer confirmação e mostra dados que serão removidos

## Edge Case Handling

- **Login sem usuários cadastrados**: Sistema cria automaticamente usuário admin inicial (admin@iraucuba.ce.gov.br / admin123)
- **Sessão expirada**: Sistema mostra tela de login automaticamente
- **Senha incorreta múltiplas vezes**: Mostra mensagem de erro clara sem bloquear acesso
- **Logout**: Botão de logout sempre visível no header, limpa sessão completamente
- **Ano como campo livre**: Campo de entrada numérica livre para ano (2000-2100), sem necessidade de cadastro prévio
- **DID e NF como campos livres**: Campos totalmente livres para entrada de qualquer valor, sem necessidade de cadastro prévio (não há mais cadastro de DID ou Notas Fiscais)
- **Setores vinculados a Secretarias**: Ao selecionar uma secretaria no processo, apenas setores vinculados àquela secretaria aparecem
- **Valores zerados**: Permite valores R$ 0,00 para processos administrativos
- **Filtros combinados vazios**: Mostra mensagem amigável "Nenhum processo encontrado"
- **Data inválida no workflow**: Valida que datas de etapas posteriores não sejam anteriores às etapas prévias
- **Formatação de moeda**: Aceita entrada com ou sem símbolos, normaliza automaticamente
- **Dados duplicados**: Permite duplicatas (processos podem ter mesmos credores/objetos)
- **Importação de dados inválidos**: Valida estrutura do JSON, versão e timestamp antes de importar
- **Sincronização com aba fechada**: Auto-sync só funciona enquanto sistema está aberto no navegador
- **Backup de sistema vazio**: Permite exportar mesmo sem dados, cria estrutura vazia válida
- **Exclusão de cadastros vinculados**: Impede exclusão de secretarias com setores ou recursos vinculados

## Design Direction

O design deve evocar profissionalismo governamental, confiabilidade e eficiência administrativa. A interface precisa transmitir seriedade institucional enquanto mantém usabilidade moderna, com hierarquia visual clara que facilite a navegação entre grandes volumes de dados financeiros.

## Color Selection

Paleta institucional inspirada em cores governamentais brasileiras com toques de modernidade:

- **Primary Color**: Azul institucional `oklch(0.45 0.15 250)` - transmite confiança, seriedade e autoridade governamental
- **Secondary Colors**: 
  - Cinza neutro `oklch(0.65 0.01 250)` para elementos secundários e backgrounds sutis
  - Azul claro `oklch(0.92 0.02 250)` para cards e containers
- **Accent Color**: Verde governamental `oklch(0.55 0.12 150)` para ações positivas e confirmações
- **Alert Colors**:
  - Amarelo destaque `oklch(0.85 0.15 85)` especificamente para coluna Tesouraria
  - Vermelho suave `oklch(0.60 0.18 25)` para ações destrutivas
- **Foreground/Background Pairings**:
  - Background (Branco Suave #FAFAFA): Texto escuro `oklch(0.25 0.01 250)` - Ratio 14.2:1 ✓
  - Primary (Azul #2B5AA0): Texto branco `oklch(0.98 0 0)` - Ratio 5.8:1 ✓
  - Accent (Verde #4A9D5F): Texto branco `oklch(0.98 0 0)` - Ratio 4.9:1 ✓
  - Amarelo Tesouraria (Amarelo #E8C547): Texto escuro `oklch(0.25 0.01 250)` - Ratio 10.5:1 ✓

## Font Selection

Tipografia deve transmitir clareza institucional com excelente legibilidade para dados tabulares e números financeiros.

- **Primary Font**: Inter - família versátil com excelente legibilidade para dados tabulares e números
- **Numeric Font**: Tabular Nums variant do Inter para alinhamento perfeito de valores monetários

- **Typographic Hierarchy**:
  - H1 (Título Principal): Inter Semibold / 32px / tracking-tight / leading-tight
  - H2 (Seções): Inter Semibold / 24px / tracking-tight / leading-snug
  - H3 (Subsections/Cards): Inter Medium / 18px / normal tracking / leading-normal
  - Body (Texto geral): Inter Regular / 14px / normal tracking / leading-relaxed
  - Table Headers: Inter Medium / 13px / uppercase / tracking-wide / leading-tight
  - Table Data: Inter Regular / 14px / tabular-nums / leading-normal
  - Small/Caption: Inter Regular / 12px / text-muted-foreground / leading-normal

## Animations

Animações sutis para reforçar hierarquia e feedback, mantendo profissionalismo: transições suaves em filtros e modais (200ms ease), highlight animado ao salvar dados, expansão suave de linhas agrupadas no resumo financeiro, e micro-interações em botões para confirmar ações.

- Diálogos e modais: slide-in suave de 300ms com fade
- Filtros aplicados: fade de 200ms na atualização da tabela
- Salvamento de dados: pulse verde no botão de sucesso
- Hover em linhas: transição de background de 150ms
- Expansão de agrupamentos: accordion smooth de 250ms

## Component Selection

- **Components**:
  - **Sidebar**: Navegação lateral principal com menus para Processos, Métricas, Resumo Financeiro, Cadastros e Sincronização
  - **Table**: Component principal para listagem de processos com sorting
  - **Dialog**: Para formulários de criação/edição de processos
  - **Select**: Dropdowns para Secretaria, Setor, Conta, Mês, Recurso
  - **Input**: Campos de texto para Credor, Objeto, DID, Valor (com máscara BRL)
  - **Calendar + Popover**: Seleção de datas para workflow
  - **Badge**: Status visual de processos (Pendente/Completo)
  - **Button**: Ações primárias e secundárias
  - **Card**: Containers para filtros, métricas resumidas, gráficos e sincronização
  - **Accordion**: Agrupamentos expansíveis no resumo financeiro
  - **Alert**: Mensagens de feedback e confirmações
  - **AlertDialog**: Confirmações de ações destrutivas (limpeza de dados)
  - **Separator**: Divisão visual entre seções
  - **Charts (Recharts)**: Gráficos de barras, pizza e linha para visualização de métricas
  - **Switch**: Toggle para ativar/desativar sincronização automática
  - **Collapsible**: Expansão/colapso de secretarias e setores em cascata
  - **Tabs**: Navegação entre diferentes tipos de cadastros

- **Customizations**:
  - Sidebar institucional com logo da prefeitura e navegação por ícones
  - Input customizado com máscara de moeda brasileira (R$ 1.234,56)
  - Célula de tabela customizada com background amarelo para coluna Tesouraria
  - Badge customizado para status de workflow (cores institucionais)
  - Component de filtro rápido com toggle para "Processos Pendentes"

- **States**:
  - Sidebar: collapsible com animação suave, estados expanded/collapsed
  - Buttons: hover com elevação sutil, active com scale(0.98), disabled com opacity-50
  - Inputs: focus com ring azul institucional, error com border vermelho
  - Table rows: hover com background-muted, selected com border-accent
  - Filtros ativos: badge azul indicando filtro aplicado
  - Menu items: active state com background accent e ícone preenchido

- **Icon Selection**:
  - Buildings: Logo da sidebar (prefeitura) e ícone de login
  - SignOut: Logout do sistema
  - LockKey: Senha no formulário de login
  - EnvelopeSimple: Email no formulário de login
  - Info: Informações de acesso inicial
  - User: Ícone de usuário logado
  - FileText: Visualização de processos
  - ChartPie: Dashboard de métricas
  - ChartBar: Resumo financeiro
  - Database: Cadastros
  - CloudArrowDown: Sincronização de dados
  - Plus: Novo processo
  - PencilSimple: Editar processo
  - Trash: Excluir processo
  - Check: Marcar etapa de workflow
  - Calendar: Seleção de datas
  - Warning: Processos pendentes e alertas
  - X: Limpar filtros
  - Coins: Total geral
  - TrendUp: Processos concluídos
  - DownloadSimple: Exportar backup
  - UploadSimple: Importar backup
  - ArrowsClockwise: Sincronização automática
  - Clock: Timestamp de sincronização
  - DotsSixVertical: Drag handle para reordenação
  - CaretDown/CaretRight: Expansão de collapsibles

- **Spacing**:
  - Sidebar width: 16rem (256px) expanded, 3rem collapsed
  - Container padding: p-6 (24px)
  - Card padding: p-4 (16px)
  - Section gaps: gap-6 (24px)
  - Form field spacing: gap-4 (16px)
  - Table cell padding: px-4 py-3
  - Button padding: px-4 py-2

- **Mobile**:
  - Sidebar overlay em telas < 768px com Sheet component
  - Tabela scroll horizontal em telas < 768px
  - Filtros empilhados verticalmente
  - Formulário em tela cheia em mobile
  - Font sizes reduzidos (H1: 20px, Body: 13px)
  - Touch targets mínimo de 44x44px
  - Header sticky no topo com botão de toggle da sidebar
  - Cards de resumo empilhados verticalmente
