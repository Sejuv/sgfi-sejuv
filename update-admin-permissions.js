// COPIE E COLE ESTE CÓDIGO NO CONSOLE (F12) E PRESSIONE ENTER

const usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
if (usuarios.length > 0) {
  usuarios[0].permissoes = [
    { modulo: 'processos', nivel: 'admin' },
    { modulo: 'metricas', nivel: 'admin' },
    { modulo: 'resumo', nivel: 'admin' },
    { modulo: 'cadastros', nivel: 'admin' },
    { modulo: 'sincronizacao', nivel: 'admin' },
    { modulo: 'usuarios', nivel: 'admin' },
    { modulo: 'previsoes', nivel: 'admin' }
  ];
  localStorage.setItem('usuarios', JSON.stringify(usuarios));
  console.log('✅ Permissões atualizadas! Pressione F5 para recarregar');
  location.reload();
} else {
  console.error('❌ Nenhum usuário encontrado');
}
