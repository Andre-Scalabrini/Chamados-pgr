// Usuários JavaScript

let usuarioAtual = null;

// Carregar dados ao iniciar
document.addEventListener('DOMContentLoaded', function() {
    carregarUsuarioLogado();
    carregarUsuarios();
    
    // Form submit
    document.getElementById('formUsuario').addEventListener('submit', salvarUsuario);
});

// Carregar informações do usuário logado
async function carregarUsuarioLogado() {
    try {
        const response = await fetch('/admin/me');
        const data = await response.json();
        
        if (data.usuario) {
            usuarioAtual = data.usuario;
            document.getElementById('userInfo').innerHTML = `
                <span class="user-avatar">👤</span>
                <span class="user-name">${data.usuario.nome}</span>
            `;
        }
    } catch (error) {
        console.error('Erro ao carregar usuário:', error);
    }
}

// Carregar lista de usuários
async function carregarUsuarios() {
    const tbody = document.getElementById('usuariosTable');
    tbody.innerHTML = '<tr><td colspan="6" class="loading">Carregando usuários...</td></tr>';
    
    try {
        const response = await fetch('/api/usuarios');
        const data = await response.json();
        
        if (!data.usuarios || data.usuarios.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="loading">Nenhum usuário encontrado</td></tr>';
            return;
        }
        
        tbody.innerHTML = data.usuarios.map(usuario => `
            <tr>
                <td><strong>${usuario.nome}</strong></td>
                <td>${usuario.email}</td>
                <td><span class="role-badge ${usuario.role}">${formatarRole(usuario.role)}</span></td>
                <td><span class="status-badge ${usuario.ativo ? 'ativo' : 'inativo'}">${usuario.ativo ? 'Ativo' : 'Inativo'}</span></td>
                <td>${new Date(usuario.criado_em).toLocaleDateString('pt-BR')}</td>
                <td class="action-buttons">
                    <button class="btn btn-small btn-secondary" onclick="editarUsuario(${usuario.id}, '${usuario.nome}', '${usuario.email}', '${usuario.role}', ${usuario.ativo})">
                        ✏️ Editar
                    </button>
                    ${usuario.id !== usuarioAtual.id ? `
                        <button class="btn btn-small btn-danger" onclick="confirmarDesativar(${usuario.id}, '${usuario.nome}')">
                            🗑️
                        </button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        tbody.innerHTML = '<tr><td colspan="6" class="loading">Erro ao carregar usuários</td></tr>';
    }
}

// Formatar role para exibição
function formatarRole(role) {
    return role === 'admin' ? 'Administrador' : 'Técnico';
}

// Abrir modal para novo usuário
function abrirModalNovoUsuario() {
    document.getElementById('modalTitulo').textContent = 'Novo Usuário';
    document.getElementById('formUsuario').reset();
    document.getElementById('usuarioId').value = '';
    document.getElementById('senha').required = true;
    document.getElementById('senhaHint').textContent = 'Obrigatório para novos usuários';
    document.getElementById('grupoAtivo').style.display = 'none';
    document.getElementById('formError').style.display = 'none';
    document.getElementById('modalUsuario').style.display = 'flex';
}

// Editar usuário existente
function editarUsuario(id, nome, email, role, ativo) {
    document.getElementById('modalTitulo').textContent = 'Editar Usuário';
    document.getElementById('usuarioId').value = id;
    document.getElementById('nome').value = nome;
    document.getElementById('email').value = email;
    document.getElementById('role').value = role;
    document.getElementById('ativo').checked = ativo;
    document.getElementById('senha').value = '';
    document.getElementById('senha').required = false;
    document.getElementById('senhaHint').textContent = 'Deixe em branco para manter a senha atual';
    document.getElementById('grupoAtivo').style.display = 'block';
    document.getElementById('formError').style.display = 'none';
    document.getElementById('modalUsuario').style.display = 'flex';
}

// Salvar usuário (criar ou atualizar)
async function salvarUsuario(e) {
    e.preventDefault();
    
    const id = document.getElementById('usuarioId').value;
    const dados = {
        nome: document.getElementById('nome').value,
        email: document.getElementById('email').value,
        role: document.getElementById('role').value
    };
    
    const senha = document.getElementById('senha').value;
    if (senha) {
        dados.senha = senha;
    }
    
    if (id) {
        dados.ativo = document.getElementById('ativo').checked;
    }
    
    try {
        const url = id ? `/api/usuarios/${id}` : '/api/usuarios';
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            fecharModal();
            carregarUsuarios();
            alert(id ? 'Usuário atualizado com sucesso!' : 'Usuário criado com sucesso!');
        } else {
            document.getElementById('formError').textContent = result.erro || 'Erro ao salvar usuário';
            document.getElementById('formError').style.display = 'block';
        }
    } catch (error) {
        console.error('Erro ao salvar usuário:', error);
        document.getElementById('formError').textContent = 'Erro ao salvar usuário';
        document.getElementById('formError').style.display = 'block';
    }
}

// Confirmar desativação
let usuarioParaDesativar = null;

function confirmarDesativar(id, nome) {
    usuarioParaDesativar = id;
    document.getElementById('confirmacaoTexto').textContent = `Deseja realmente desativar o usuário "${nome}"?`;
    document.getElementById('btnConfirmar').onclick = desativarUsuario;
    document.getElementById('modalConfirmacao').style.display = 'flex';
}

// Desativar usuário
async function desativarUsuario() {
    if (!usuarioParaDesativar) return;
    
    try {
        const response = await fetch(`/api/usuarios/${usuarioParaDesativar}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            fecharModalConfirmacao();
            carregarUsuarios();
            alert('Usuário desativado com sucesso!');
        } else {
            const data = await response.json();
            alert(data.erro || 'Erro ao desativar usuário');
        }
    } catch (error) {
        console.error('Erro ao desativar usuário:', error);
        alert('Erro ao desativar usuário');
    }
    
    usuarioParaDesativar = null;
}

// Fechar modal de usuário
function fecharModal() {
    document.getElementById('modalUsuario').style.display = 'none';
}

// Fechar modal de confirmação
function fecharModalConfirmacao() {
    document.getElementById('modalConfirmacao').style.display = 'none';
    usuarioParaDesativar = null;
}

// Fechar modais com ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        fecharModal();
        fecharModalConfirmacao();
    }
});
