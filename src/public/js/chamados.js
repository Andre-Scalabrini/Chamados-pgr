// Chamados JavaScript

let tecnicos = [];
let categorias = [];

// Carregar dados ao iniciar
document.addEventListener('DOMContentLoaded', function() {
    carregarUsuarioLogado();
    carregarTecnicos();
    carregarCategorias();
    carregarChamados();
});

// Carregar informações do usuário logado
async function carregarUsuarioLogado() {
    try {
        const response = await fetch('/admin/me');
        const data = await response.json();
        
        if (data.usuario) {
            document.getElementById('userInfo').innerHTML = `
                <span class="user-avatar">👤</span>
                <span class="user-name">${data.usuario.nome}</span>
            `;
        }
    } catch (error) {
        console.error('Erro ao carregar usuário:', error);
    }
}

// Carregar lista de técnicos
async function carregarTecnicos() {
    try {
        const response = await fetch('/api/tecnicos');
        const data = await response.json();
        tecnicos = data.tecnicos || [];
    } catch (error) {
        console.error('Erro ao carregar técnicos:', error);
    }
}

// Carregar categorias para filtro
async function carregarCategorias() {
    try {
        const response = await fetch('/api/categorias');
        const data = await response.json();
        categorias = data.categorias || [];
        
        const select = document.getElementById('filtroCategoria');
        categorias.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.nome;
            option.textContent = `${cat.emoji} ${cat.nome}`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar categorias:', error);
    }
}

// Carregar lista de chamados
async function carregarChamados() {
    const container = document.getElementById('chamadosList');
    container.innerHTML = '<div class="loading-placeholder"><p>Carregando chamados...</p></div>';
    
    try {
        const filtros = new URLSearchParams();
        
        const status = document.getElementById('filtroStatus').value;
        const urgencia = document.getElementById('filtroUrgencia').value;
        const categoria = document.getElementById('filtroCategoria').value;
        
        if (status) filtros.append('status', status);
        if (urgencia) filtros.append('urgencia', urgencia);
        if (categoria) filtros.append('categoria', categoria);
        
        const response = await fetch(`/api/chamados?${filtros.toString()}`);
        const data = await response.json();
        
        if (!data.chamados || data.chamados.length === 0) {
            container.innerHTML = '<div class="loading-placeholder"><p>Nenhum chamado encontrado</p></div>';
            return;
        }
        
        container.innerHTML = data.chamados.map(chamado => renderizarCardChamado(chamado)).join('');
        
    } catch (error) {
        console.error('Erro ao carregar chamados:', error);
        container.innerHTML = '<div class="loading-placeholder"><p>Erro ao carregar chamados</p></div>';
    }
}

// Renderizar card de chamado
function renderizarCardChamado(chamado) {
    const dataFormatada = new Date(chamado.criado_em).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    return `
        <div class="chamado-card urgencia-${chamado.urgencia}" onclick="abrirDetalhes(${chamado.id})">
            <div class="chamado-header">
                <span class="chamado-numero">${chamado.numero}</span>
                <div class="chamado-badges">
                    <span class="badge badge-status ${chamado.status}">${formatarStatus(chamado.status)}</span>
                    <span class="badge badge-urgencia ${chamado.urgencia}">${chamado.urgencia}</span>
                </div>
            </div>
            <div class="chamado-info">
                <div class="chamado-info-item">
                    <span class="chamado-info-label">Categoria</span>
                    <span class="chamado-info-value">${chamado.categoria}</span>
                </div>
                <div class="chamado-info-item">
                    <span class="chamado-info-label">Problema</span>
                    <span class="chamado-info-value">${chamado.subcategoria}</span>
                </div>
                <div class="chamado-info-item">
                    <span class="chamado-info-label">Técnico</span>
                    <span class="chamado-info-value">${chamado.tecnico_nome || 'Não atribuído'}</span>
                </div>
                <div class="chamado-info-item">
                    <span class="chamado-info-label">Data</span>
                    <span class="chamado-info-value">${dataFormatada}</span>
                </div>
            </div>
            ${chamado.descricao ? `<p class="chamado-descricao">${chamado.descricao}</p>` : ''}
        </div>
    `;
}

// Formatar status para exibição
function formatarStatus(status) {
    const statusMap = {
        'ABERTO': 'Aberto',
        'EM_ANDAMENTO': 'Em Andamento',
        'RESOLVIDO': 'Resolvido',
        'FECHADO': 'Fechado'
    };
    return statusMap[status] || status;
}

// Abrir modal de detalhes
async function abrirDetalhes(chamadoId) {
    const modal = document.getElementById('modalDetalhes');
    const modalBody = document.getElementById('modalBody');
    
    modal.style.display = 'flex';
    modalBody.innerHTML = '<p>Carregando detalhes...</p>';
    
    try {
        const response = await fetch(`/api/chamados/${chamadoId}`);
        const data = await response.json();
        
        if (!data.chamado) {
            modalBody.innerHTML = '<p>Chamado não encontrado</p>';
            return;
        }
        
        modalBody.innerHTML = renderizarDetalhesChamado(data.chamado, data.notas);
        
    } catch (error) {
        console.error('Erro ao carregar detalhes:', error);
        modalBody.innerHTML = '<p>Erro ao carregar detalhes</p>';
    }
}

// Renderizar detalhes do chamado
function renderizarDetalhesChamado(chamado, notas) {
    const dataFormatada = new Date(chamado.criado_em).toLocaleString('pt-BR');
    const dataAtualizada = new Date(chamado.atualizado_em).toLocaleString('pt-BR');
    const dataResolvida = chamado.resolvido_em ? new Date(chamado.resolvido_em).toLocaleString('pt-BR') : '-';
    
    const optionsTecnicos = tecnicos.map(t => 
        `<option value="${t.id}" ${chamado.atribuido_a === t.id ? 'selected' : ''}>${t.nome}</option>`
    ).join('');
    
    return `
        <div class="chamado-detail-section">
            <h3>Informações do Chamado</h3>
            <div class="detail-grid">
                <div class="detail-item">
                    <span class="detail-label">Número</span>
                    <span class="detail-value">${chamado.numero}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Status</span>
                    <span class="detail-value">
                        <span class="badge badge-status ${chamado.status}">${formatarStatus(chamado.status)}</span>
                    </span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Categoria</span>
                    <span class="detail-value">${chamado.categoria}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Subcategoria</span>
                    <span class="detail-value">${chamado.subcategoria}</span>
                </div>
                ${chamado.sistema ? `
                <div class="detail-item">
                    <span class="detail-label">Sistema</span>
                    <span class="detail-value">${chamado.sistema}</span>
                </div>
                ` : ''}
                <div class="detail-item">
                    <span class="detail-label">Urgência</span>
                    <span class="detail-value">
                        <span class="badge badge-urgencia ${chamado.urgencia}">${chamado.urgencia}</span>
                    </span>
                </div>
            </div>
        </div>
        
        <div class="chamado-detail-section">
            <h3>Usuário</h3>
            <div class="detail-grid">
                <div class="detail-item">
                    <span class="detail-label">Nome</span>
                    <span class="detail-value">${chamado.nome_usuario || '-'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Telefone</span>
                    <span class="detail-value">${chamado.telefone_usuario}</span>
                </div>
            </div>
        </div>
        
        <div class="chamado-detail-section">
            <h3>Descrição</h3>
            <p style="white-space: pre-wrap;">${chamado.descricao || 'Sem descrição adicional'}</p>
        </div>
        
        <div class="chamado-detail-section">
            <h3>Datas</h3>
            <div class="detail-grid">
                <div class="detail-item">
                    <span class="detail-label">Criado em</span>
                    <span class="detail-value">${dataFormatada}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Atualizado em</span>
                    <span class="detail-value">${dataAtualizada}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Resolvido em</span>
                    <span class="detail-value">${dataResolvida}</span>
                </div>
            </div>
        </div>
        
        <div class="chamado-detail-section">
            <h3>Ações</h3>
            <div class="acoes-chamado">
                <select id="selectStatus" class="btn btn-secondary" onchange="alterarStatus(${chamado.id}, this.value)">
                    <option value="">Alterar Status</option>
                    <option value="ABERTO">Aberto</option>
                    <option value="EM_ANDAMENTO">Em Andamento</option>
                    <option value="RESOLVIDO">Resolvido</option>
                    <option value="FECHADO">Fechado</option>
                </select>
                
                <select id="selectTecnico" class="btn btn-secondary" onchange="atribuirTecnico(${chamado.id}, this.value)">
                    <option value="">Atribuir Técnico</option>
                    ${optionsTecnicos}
                </select>
            </div>
        </div>
        
        <div class="chamado-detail-section">
            <h3>Notas / Histórico</h3>
            <div class="notas-list" id="notasList">
                ${notas && notas.length > 0 ? notas.map(nota => `
                    <div class="nota-item tipo-${nota.tipo}">
                        <div class="nota-header">
                            <span>${nota.usuario_nome || 'Sistema'}</span>
                            <span>${new Date(nota.criado_em).toLocaleString('pt-BR')}</span>
                        </div>
                        <div class="nota-conteudo">${nota.conteudo}</div>
                    </div>
                `).join('') : '<p style="color: var(--text-light);">Nenhuma nota registrada</p>'}
            </div>
            
            <div class="nota-form">
                <textarea id="novaNota" placeholder="Adicionar nota..."></textarea>
                <button class="btn btn-primary" onclick="adicionarNota(${chamado.id})">
                    Adicionar
                </button>
            </div>
        </div>
    `;
}

// Alterar status do chamado
async function alterarStatus(chamadoId, novoStatus) {
    if (!novoStatus) return;
    
    try {
        const response = await fetch(`/api/chamados/${chamadoId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: novoStatus })
        });
        
        if (response.ok) {
            alert('Status atualizado com sucesso!');
            abrirDetalhes(chamadoId);
            carregarChamados();
        } else {
            const data = await response.json();
            alert(data.erro || 'Erro ao atualizar status');
        }
    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        alert('Erro ao atualizar status');
    }
}

// Atribuir técnico ao chamado
async function atribuirTecnico(chamadoId, tecnicoId) {
    if (!tecnicoId) return;
    
    try {
        const response = await fetch(`/api/chamados/${chamadoId}/atribuir`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tecnico_id: parseInt(tecnicoId) })
        });
        
        if (response.ok) {
            alert('Técnico atribuído com sucesso!');
            abrirDetalhes(chamadoId);
            carregarChamados();
        } else {
            const data = await response.json();
            alert(data.erro || 'Erro ao atribuir técnico');
        }
    } catch (error) {
        console.error('Erro ao atribuir técnico:', error);
        alert('Erro ao atribuir técnico');
    }
}

// Adicionar nota ao chamado
async function adicionarNota(chamadoId) {
    const textarea = document.getElementById('novaNota');
    const conteudo = textarea.value.trim();
    
    if (!conteudo) {
        alert('Digite o conteúdo da nota');
        return;
    }
    
    try {
        const response = await fetch(`/api/chamados/${chamadoId}/notas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conteudo })
        });
        
        if (response.ok) {
            textarea.value = '';
            abrirDetalhes(chamadoId);
        } else {
            const data = await response.json();
            alert(data.erro || 'Erro ao adicionar nota');
        }
    } catch (error) {
        console.error('Erro ao adicionar nota:', error);
        alert('Erro ao adicionar nota');
    }
}

// Fechar modal
function fecharModal() {
    document.getElementById('modalDetalhes').style.display = 'none';
}

// Fechar modal ao clicar fora
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        fecharModal();
    }
});
