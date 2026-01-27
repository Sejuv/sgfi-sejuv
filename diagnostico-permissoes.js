// DIAGNÓSTICO - Cole no Console (F12)

console.log('=== DIAGNÓSTICO DE PERMISSÕES ===');

// 1. Verificar sessão
const sessao = JSON.parse(localStorage.getItem('sessao') || 'null');
console.log('1. Sessão:', sessao);

// 2. Verificar usuários
const usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
console.log('2. Usuários:', usuarios);

// 3. Verificar se sessão tem usuário
console.log('3. Sessão tem usuário?', sessao?.usuario);

// 4. Se não tiver, criar sessão completa
if (sessao && usuarios.length > 0 && !sessao.usuario) {
  const usuarioCompleto = usuarios.find(u => u.id === sessao.usuarioId);
  if (usuarioCompleto) {
    sessao.usuario = usuarioCompleto;
    localStorage.setItem('sessao', JSON.stringify(sessao));
    console.log('✅ Sessão atualizada com usuário completo');
    console.log('4. Nova sessão:', sessao);
    location.reload();
  }
} else {
  console.log('4. Sessão já tem usuário ou não precisa de atualização');
}
