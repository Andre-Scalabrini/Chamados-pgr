// Chamados JavaScript

let chamadoAtual = null;
let tecnicos = [];
let categorias = [];

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    await carregarUsuario();
    await carregarFiltros();
    await carregarChamados();
});

// Carregar dados do usuário logado
async function carregarUsuario() {
    try {
        const response = await fetch('/admin/api/me');
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('userName').textContent = data.data.nome;
            document.getElementById('userRole').textContent = data.data.role === 'admin' ? 'Administrador' : 'Técnico';
            
            if (data.data.role !== 'admin') {
                const menuUsuarios = document.getElementById('menuUsuarios');
                if (menuUsuarios) {
                    menuUsuarios.style.display = 'none';
                }
            }
        }
    } catch (error) {
        console.error('Erro ao carregar usuário:', error);
    }
}

// Carregar opções de filtros
async function carregarFiltros() {
    try {
        // Carregar categorias
        const catResponse = await fetch('/admin/api/categorias');
        const catData = await catResponse.json();
        
        if (catData.success) {
            categorias = catData.data;
            const selectCat = document.getElementById('filtroCategoria');
            categorias.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.nome;
                option.textContent = `${cat.emoji} ${cat.nome}`;
                selectCat.appendChild(option);
            });
        }
        
        // Carregar técnicos
        const tecResponse = await fetch('/admin/api/tecnicos');
        const tecData = await tecResponse.json();
        
        if (tecData.success) {
            tecnicos = tecData.data;
            const selectTec = document.getElementById('filtroTecnico');
            const selectEdit = document.getElementById('editTecnico');
            
            tecnicos.forEach(tec => {
                const option1 = document.createElement('option');
                option1.value = tec.id;
                option1.textContent = tec.nome;
                selectTec.appendChild(option1);
                
                const option2 = document.createElement('option');
                option2.value = tec.id;
                option2.textContent = tec.nome;
                selectEdit.appendChild(option2);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar filtros:', error);
    }
}

// Carregar chamados
async function carregarChamados() {
    try {
        const params = new URLSearchParams();
        
        const status = document.getElementById('filtroStatus').value;
        const urgencia = document.getElementById('filtroUrgencia').value;
        const categoria = document.getElementById('filtroCategoria').value;
        const tecnico = document.getElementById('filtroTecnico').value;
        const dataInicio = document.getElementById('filtroDataInicio').value;
        const dataFim = document.getElementById('filtroDataFim').value;
        
        if (status) params.append('status', status);
        if (urgencia) params.append('urgencia', urgencia);
        if (categoria) params.append('categoria', categoria);
        if (tecnico) params.append('atribuido_a', tecnico);
        if (dataInicio) params.append('data_inicio', dataInicio);
        if (dataFim) params.append('data_fim', dataFim);
        
        const response = await fetch(`/admin/api/chamados?${params.toString()}`);
        const data = await response.json();
        
        if (!data.success) {
            console.error('Erro ao carregar chamados:', data.message);
            return;
        }
        
        renderizarChamados(data.data);
        
    } catch (error) {
        console.error('Erro ao carregar chamados:', error);
    }
}

// Renderizar tabela de chamados
function renderizarChamados(chamados) {
    const tbody = document.getElementById('tabelaChamados');
    
    if (!chamados || chamados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center">Nenhum chamado encontrado</td></tr>';
        return;
    }
    
    tbody.innerHTML = chamados.map(c => {
        const dataFormatada = new Date(c.criado_em).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        return `
            <tr>
                <td><strong>${escapeHtml(c.numero)}</strong></td>
                <td>${escapeHtml(c.nome_usuario) || 'N/A'}</td>
                <td>${escapeHtml(c.categoria)}</td>
                <td>${escapeHtml(c.subcategoria)}</td>
                <td><span class="badge badge-${c.urgencia}">${formatarUrgencia(c.urgencia)}</span></td>
                <td><span class="badge badge-${c.status}">${formatarStatus(c.status)}</span></td>
                <td>${escapeHtml(c.tecnico_nome) || '<em>Não atribuído</em>'}</td>
                <td>${dataFormatada}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="abrirChamado(${c.id})">
                        👁️ Ver
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Formatar status
function formatarStatus(status) {
    const labels = {
        'aberto': 'Aberto',
        'em_andamento': 'Em Andamento',
        'resolvido': 'Resolvido',
        'fechado': 'Fechado'
    };
    return labels[status] || status;
}

// Formatar urgência
function formatarUrgencia(urgencia) {
    const labels = {
        'critica': '🔴 Crítica',
        'alta': '🟠 Alta',
        'media': '🟡 Média',
        'baixa': '🟢 Baixa'
    };
    return labels[urgencia] || urgencia;
}

// Aplicar filtros
function aplicarFiltros() {
    carregarChamados();
}

// Limpar filtros
function limparFiltros() {
    document.getElementById('filtroStatus').value = '';
    document.getElementById('filtroUrgencia').value = '';
    document.getElementById('filtroCategoria').value = '';
    document.getElementById('filtroTecnico').value = '';
    document.getElementById('filtroDataInicio').value = '';
    document.getElementById('filtroDataFim').value = '';
    carregarChamados();
}

// Abrir modal do chamado
async function abrirChamado(id) {
    try {
        const response = await fetch(`/admin/api/chamados/${id}`);
        const data = await response.json();
        
        if (!data.success) {
            alert('Erro ao carregar chamado');
            return;
        }
        
        chamadoAtual = data.data;
        
        // Preencher dados
        document.getElementById('modalNumero').textContent = chamadoAtual.numero;
        document.getElementById('detalheUsuario').textContent = chamadoAtual.nome_usuario || 'N/A';
        document.getElementById('detalheTelefone').textContent = chamadoAtual.telefone_usuario;
        document.getElementById('detalheCategoria').textContent = chamadoAtual.categoria;
        document.getElementById('detalheSubcategoria').textContent = chamadoAtual.subcategoria;
        
        // Sistema (se houver)
        const sistemaRow = document.getElementById('sistemaRow');
        if (chamadoAtual.sistema) {
            sistemaRow.style.display = 'grid';
            document.getElementById('detalheSistema').textContent = chamadoAtual.sistema;
        } else {
            sistemaRow.style.display = 'none';
        }
        
        document.getElementById('detalheDescricao').textContent = chamadoAtual.descricao || 'Sem descrição';
        
        // Selects
        document.getElementById('editUrgencia').value = chamadoAtual.urgencia;
        document.getElementById('editStatus').value = chamadoAtual.status;
        document.getElementById('editTecnico').value = chamadoAtual.atribuido_a || '';
        
        // Data
        const dataFormatada = new Date(chamadoAtual.criado_em).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        document.getElementById('detalheCriadoEm').textContent = dataFormatada;
        
        // Notas
        renderizarNotas(chamadoAtual.notas || []);
        
        // Abrir modal
        document.getElementById('modalChamado').classList.add('active');
        
    } catch (error) {
        console.error('Erro ao abrir chamado:', error);
        alert('Erro ao carregar chamado');
    }
}

// Renderizar notas
function renderizarNotas(notas) {
    const container = document.getElementById('notasList');
    
    if (!notas || notas.length === 0) {
        container.innerHTML = '<p class="text-muted">Nenhuma nota registrada.</p>';
        return;
    }
    
    container.innerHTML = notas.map(n => {
        const data = new Date(n.criado_em).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        return `
            <div class="nota-item">
                <div class="nota-header">
                    <span><strong>${escapeHtml(n.usuario_nome) || 'Sistema'}</strong></span>
                    <span>${data}</span>
                </div>
                <div class="nota-content">${escapeHtml(n.conteudo)}</div>
            </div>
        `;
    }).join('');
}

// Fechar modal
function fecharModal() {
    document.getElementById('modalChamado').classList.remove('active');
    chamadoAtual = null;
    document.getElementById('novaNota').value = '';
}

// Salvar alterações do chamado
async function salvarChamado() {
    if (!chamadoAtual) return;
    
    try {
        const dados = {
            urgencia: document.getElementById('editUrgencia').value,
            status: document.getElementById('editStatus').value,
            atribuido_a: document.getElementById('editTecnico').value || null
        };
        
        const response = await fetch(`/admin/api/chamados/${chamadoAtual.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dados)
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Chamado atualizado com sucesso!');
            fecharModal();
            carregarChamados();
        } else {
            alert('Erro ao atualizar chamado: ' + data.message);
        }
        
    } catch (error) {
        console.error('Erro ao salvar chamado:', error);
        alert('Erro ao salvar chamado');
    }
}

// Adicionar nota
async function adicionarNota() {
    if (!chamadoAtual) return;
    
    const conteudo = document.getElementById('novaNota').value.trim();
    
    if (!conteudo) {
        alert('Digite o conteúdo da nota');
        return;
    }
    
    try {
        const response = await fetch(`/admin/api/chamados/${chamadoAtual.id}/notas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ conteudo })
        });
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('novaNota').value = '';
            renderizarNotas(data.data);
        } else {
            alert('Erro ao adicionar nota: ' + data.message);
        }
        
    } catch (error) {
        console.error('Erro ao adicionar nota:', error);
        alert('Erro ao adicionar nota');
    }
}

// Exportar chamados (CSV simples)
function exportarChamados() {
    // Coletar dados da tabela atual
    const table = document.querySelector('.data-table');
    const rows = table.querySelectorAll('tbody tr');
    
    let csv = 'Número;Usuário;Categoria;Problema;Urgência;Status;Técnico;Data\n';
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length > 1) {
            const rowData = [];
            cells.forEach((cell, index) => {
                if (index < 8) { // Ignorar coluna de ações
                    rowData.push(cell.textContent.trim().replace(/;/g, ','));
                }
            });
            csv += rowData.join(';') + '\n';
        }
    });
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `chamados_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

// Escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
