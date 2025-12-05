// Dashboard JavaScript

let chartPorData = null;
let chartPorCategoria = null;

// Carregar dados ao iniciar
document.addEventListener('DOMContentLoaded', function() {
    carregarUsuarioLogado();
    carregarDados();
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

// Carregar dados do dashboard
async function carregarDados() {
    try {
        const response = await fetch('/api/dashboard/estatisticas');
        const data = await response.json();
        
        // Atualizar cards de status
        document.getElementById('totalChamados').textContent = data.total || 0;
        document.getElementById('chamadosAbertos').textContent = data.porStatus.ABERTO || 0;
        document.getElementById('chamadosAndamento').textContent = data.porStatus.EM_ANDAMENTO || 0;
        document.getElementById('chamadosResolvidos').textContent = 
            (data.porStatus.RESOLVIDO || 0) + (data.porStatus.FECHADO || 0);
        
        // Atualizar cards de urgência
        document.getElementById('urgenciaCritica').textContent = data.porUrgencia.CRITICA || 0;
        document.getElementById('urgenciaAlta').textContent = data.porUrgencia.ALTA || 0;
        document.getElementById('urgenciaMedia').textContent = data.porUrgencia.MEDIA || 0;
        document.getElementById('urgenciaBaixa').textContent = data.porUrgencia.BAIXA || 0;
        
        // Tempo médio
        document.getElementById('tempoMedio').textContent = data.tempoMedioResolucao || '0';
        
        // Gráficos
        renderizarGraficoPorData(data.porData);
        renderizarGraficoPorCategoria(data.porCategoria);
        
        // Tabelas
        renderizarTabelaFrequentes(data.maisFrequentes);
        renderizarTabelaTecnicos(data.resolucaoPorTecnico);
        
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
    }
}

// Gráfico de chamados por data
function renderizarGraficoPorData(dados) {
    const ctx = document.getElementById('chartPorData').getContext('2d');
    
    if (chartPorData) {
        chartPorData.destroy();
    }
    
    const labels = dados.map(d => {
        const date = new Date(d.data);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    });
    
    const values = dados.map(d => d.total);
    
    chartPorData = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Chamados',
                data: values,
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Gráfico de chamados por categoria
function renderizarGraficoPorCategoria(dados) {
    const ctx = document.getElementById('chartPorCategoria').getContext('2d');
    
    if (chartPorCategoria) {
        chartPorCategoria.destroy();
    }
    
    const labels = dados.slice(0, 8).map(d => d.categoria);
    const values = dados.slice(0, 8).map(d => d.total);
    
    const colors = [
        '#2563eb', '#7c3aed', '#db2777', '#dc2626',
        '#ea580c', '#ca8a04', '#16a34a', '#0891b2'
    ];
    
    chartPorCategoria = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

// Tabela de problemas mais frequentes
function renderizarTabelaFrequentes(dados) {
    const tbody = document.getElementById('tabelaFrequentes');
    
    if (!dados || dados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="loading">Nenhum dado encontrado</td></tr>';
        return;
    }
    
    tbody.innerHTML = dados.map(item => `
        <tr>
            <td>${item.categoria}</td>
            <td>${item.subcategoria}</td>
            <td><strong>${item.total}</strong></td>
        </tr>
    `).join('');
}

// Tabela de resolução por técnico
function renderizarTabelaTecnicos(dados) {
    const tbody = document.getElementById('tabelaTecnicos');
    
    if (!dados || dados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="loading">Nenhum dado encontrado</td></tr>';
        return;
    }
    
    tbody.innerHTML = dados.map(item => `
        <tr>
            <td>${item.nome}</td>
            <td><strong>${item.total_resolvidos}</strong></td>
            <td>${item.tempo_medio_horas ? item.tempo_medio_horas.toFixed(1) + 'h' : '-'}</td>
        </tr>
    `).join('');
}
