// Script para atualizar permissões do administrador
// Execute este código no console do navegador (F12) enquanto estiver logado no sistema

(async () => {
  // Obtém os usuários do localStorage ou Firebase
  const usuariosKey = 'kv-usuarios';
  
  // Tenta pegar do localStorage primeiro
  let usuarios = JSON.parse(localStorage.getItem(usuariosKey) || '[]');
  
  if (usuarios.length === 0) {
    console.log('⚠️ Nenhum usuário encontrado no localStorage');
    console.log('Tentando buscar do Firebase...');
    return;
  }
  
  // Encontra o administrador
  const admin = usuarios.find(u => u.email === 'admin@iraucuba.ce.gov.br');
  
  if (!admin) {
    console.log('❌ Usuário administrador não encontrado');
    return;
  }
  
  console.log('✅ Administrador encontrado:', admin.nome);
  console.log('📋 Permissões atuais:', admin.permissoes);
  
  // Adiciona as novas permissões se não existirem
  const novasPermissoes = [
    { modulo: "previsoes", nivel: "admin" },
    { modulo: "firebase", nivel: "admin" }
  ];
  
  novasPermissoes.forEach(novaPerm => {
    const existe = admin.permissoes.find(p => p.modulo === novaPerm.modulo);
    if (!existe) {
      admin.permissoes.push(novaPerm);
      console.log(`✨ Adicionada permissão: ${novaPerm.modulo} (${novaPerm.nivel})`);
    } else {
      console.log(`ℹ️ Permissão ${novaPerm.modulo} já existe`);
    }
  });
  
  // Salva de volta
  localStorage.setItem(usuariosKey, JSON.stringify(usuarios));
  
  console.log('✅ Permissões atualizadas com sucesso!');
  console.log('📋 Novas permissões:', admin.permissoes);
  console.log('🔄 Faça logout e login novamente para aplicar as mudanças');
})();
