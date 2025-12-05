// Usuários JavaScript

let usuarioEditando = null;

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    await carregarUsuario();
    await carregarUsuarios();
});

// Carregar dados do usuário logado
async function carregarUsuario() {
    try {
        const response = await fetch('/admin/api/me');
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('userName').textContent = data.data.nome;
            document.getElementById('userRole').textContent = data.data.role === 'admin' ? 'Administrador' : 'Técnico';
        }
    } catch (error) {
        console.error('Erro ao carregar usuário:', error);
    }
}

// Carregar lista de usuários
async function carregarUsuarios() {
    try {
        const response = await fetch('/admin/api/usuarios');
        const data = await response.json();
        
        if (!data.success) {
            console.error('Erro ao carregar usuários:', data.message);
            return;
        }
        
        renderizarUsuarios(data.data);
        
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
    }
}

// Renderizar tabela de usuários
function renderizarUsuarios(usuarios) {
    const tbody = document.getElementById('tabelaUsuarios');
    
    if (!usuarios || usuarios.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Nenhum usuário encontrado</td></tr>';
        return;
    }
    
    tbody.innerHTML = usuarios.map(u => {
        const dataFormatada = new Date(u.criado_em).toLocaleDateString('pt-BR');
        const statusClass = u.ativo ? 'ativo' : 'inativo';
        const statusTexto = u.ativo ? 'Ativo' : 'Inativo';
        
        return `
            <tr>
                <td>${u.id}</td>
                <td>${escapeHtml(u.nome)}</td>
                <td>${escapeHtml(u.email)}</td>
                <td><span class="badge badge-${u.role}">${u.role === 'admin' ? 'Administrador' : 'Técnico'}</span></td>
                <td><span class="badge badge-${statusClass}">${statusTexto}</span></td>
                <td>${dataFormatada}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editarUsuario(${u.id})">
                        ✏️ Editar
                    </button>
                    ${u.id !== 1 ? `
                        <button class="btn btn-sm btn-danger" onclick="confirmarExcluir(${u.id}, '${escapeHtml(u.nome)}')">
                            🗑️
                        </button>
                    ` : ''}
                </td>
            </tr>
        `;
    }).join('');
}

// Abrir modal para novo usuário
function abrirModalNovoUsuario() {
    usuarioEditando = null;
    
    document.getElementById('modalTitulo').textContent = 'Novo Usuário';
    document.getElementById('formUsuario').reset();
    document.getElementById('usuarioId').value = '';
    document.getElementById('senha').required = true;
    document.getElementById('senhaObrigatoria').style.display = 'inline';
    document.getElementById('senhaHint').style.display = 'none';
    document.getElementById('statusGroup').style.display = 'none';
    document.getElementById('errorMessage').style.display = 'none';
    
    document.getElementById('modalUsuario').classList.add('active');
}

// Editar usuário existente
async function editarUsuario(id) {
    try {
        const response = await fetch(`/admin/api/usuarios/${id}`);
        const data = await response.json();
        
        if (!data.success) {
            alert('Erro ao carregar usuário');
            return;
        }
        
        usuarioEditando = data.data;
        
        document.getElementById('modalTitulo').textContent = 'Editar Usuário';
        document.getElementById('usuarioId').value = usuarioEditando.id;
        document.getElementById('nome').value = usuarioEditando.nome;
        document.getElementById('email').value = usuarioEditando.email;
        document.getElementById('senha').value = '';
        document.getElementById('senha').required = false;
        document.getElementById('senhaObrigatoria').style.display = 'none';
        document.getElementById('senhaHint').style.display = 'block';
        document.getElementById('role').value = usuarioEditando.role;
        document.getElementById('ativo').value = usuarioEditando.ativo ? '1' : '0';
        document.getElementById('statusGroup').style.display = 'block';
        document.getElementById('errorMessage').style.display = 'none';
        
        document.getElementById('modalUsuario').classList.add('active');
        
    } catch (error) {
        console.error('Erro ao editar usuário:', error);
        alert('Erro ao carregar usuário');
    }
}

// Salvar usuário
async function salvarUsuario(event) {
    event.preventDefault();
    
    const id = document.getElementById('usuarioId').value;
    const dados = {
        nome: document.getElementById('nome').value.trim(),
        email: document.getElementById('email').value.trim(),
        role: document.getElementById('role').value
    };
    
    const senha = document.getElementById('senha').value;
    if (senha) {
        dados.senha = senha;
    }
    
    if (id) {
        dados.ativo = document.getElementById('ativo').value === '1';
    }
    
    try {
        const url = id ? `/admin/api/usuarios/${id}` : '/admin/api/usuarios';
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dados)
        });
        
        const data = await response.json();
        
        if (data.success) {
            fecharModal();
            carregarUsuarios();
            alert(id ? 'Usuário atualizado com sucesso!' : 'Usuário criado com sucesso!');
        } else {
            const errorDiv = document.getElementById('errorMessage');
            errorDiv.textContent = data.message || 'Erro ao salvar usuário';
            if (data.errors) {
                errorDiv.textContent += ': ' + data.errors.join(', ');
            }
            errorDiv.style.display = 'block';
        }
        
    } catch (error) {
        console.error('Erro ao salvar usuário:', error);
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.textContent = 'Erro de conexão. Tente novamente.';
        errorDiv.style.display = 'block';
    }
}

// Fechar modal
function fecharModal() {
    document.getElementById('modalUsuario').classList.remove('active');
    usuarioEditando = null;
}

// Confirmar exclusão
function confirmarExcluir(id, nome) {
    document.getElementById('idExcluir').value = id;
    document.getElementById('nomeExcluir').textContent = nome;
    document.getElementById('modalConfirmacao').classList.add('active');
}

// Fechar modal de confirmação
function fecharModalConfirmacao() {
    document.getElementById('modalConfirmacao').classList.remove('active');
}

// Confirmar exclusão
async function confirmarExclusao() {
    const id = document.getElementById('idExcluir').value;
    
    try {
        const response = await fetch(`/admin/api/usuarios/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            fecharModalConfirmacao();
            carregarUsuarios();
            alert('Usuário desativado com sucesso!');
        } else {
            alert('Erro ao desativar usuário: ' + data.message);
        }
        
    } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        alert('Erro ao desativar usuário');
    }
}

// Escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
