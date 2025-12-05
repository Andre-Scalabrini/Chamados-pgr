// Dashboard JavaScript

let chartPorDia = null;
let chartPorCategoria = null;
let chartPorStatus = null;
let chartPorUrgencia = null;

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    await carregarUsuario();
    await carregarDashboard();
    await verificarWhatsApp();
    
    // Atualizar a cada 30 segundos
    setInterval(carregarDashboard, 30000);
    setInterval(verificarWhatsApp, 30000);
});

// Carregar dados do usuário logado
async function carregarUsuario() {
    try {
        const response = await fetch('/admin/api/me');
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('userName').textContent = data.data.nome;
            document.getElementById('userRole').textContent = data.data.role === 'admin' ? 'Administrador' : 'Técnico';
            
            // Esconder menu de usuários se não for admin
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

// Verificar status do WhatsApp
async function verificarWhatsApp() {
    try {
        const response = await fetch('/api/whatsapp/status');
        const data = await response.json();
        
        const statusEl = document.getElementById('whatsappStatus');
        const textEl = statusEl.querySelector('.status-text');
        
        if (data.status === 'connected') {
            statusEl.className = 'whatsapp-status connected';
            textEl.textContent = 'WhatsApp Conectado';
        } else {
            statusEl.className = 'whatsapp-status disconnected';
            textEl.textContent = 'WhatsApp Desconectado';
        }
    } catch (error) {
        console.error('Erro ao verificar WhatsApp:', error);
    }
}

// Carregar dados do dashboard
async function carregarDashboard() {
    try {
        const response = await fetch('/admin/api/dashboard');
        const data = await response.json();
        
        if (!data.success) {
            console.error('Erro ao carregar dashboard:', data.message);
            return;
        }
        
        const stats = data.data;
        
        // Atualizar cards
        document.getElementById('totalChamados').textContent = stats.total || 0;
        document.getElementById('abertosHoje').textContent = stats.abertosHoje || 0;
        
        // Calcular totais por status
        const abertos = stats.porStatus?.find(s => s.status === 'aberto')?.total || 0;
        const emAndamento = stats.porStatus?.find(s => s.status === 'em_andamento')?.total || 0;
        const criticos = stats.porUrgencia?.find(u => u.urgencia === 'critica')?.total || 0;
        
        document.getElementById('chamadosAbertos').textContent = abertos;
        document.getElementById('chamadosAndamento').textContent = emAndamento;
        document.getElementById('chamadosCriticos').textContent = criticos;
        
        // Tempo médio
        const tempoMedio = stats.tempoMedioResolucao || 0;
        document.getElementById('tempoMedio').textContent = `${tempoMedio.toFixed(1)}h`;
        
        // Gráficos
        atualizarGraficoPorDia(stats.porDia || []);
        atualizarGraficoPorCategoria(stats.porCategoria || []);
        atualizarGraficoPorStatus(stats.porStatus || []);
        atualizarGraficoPorUrgencia(stats.porUrgencia || []);
        
        // Tabela de técnicos
        atualizarTabelaTecnicos(stats.porTecnico || []);
        
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
    }
}

// Gráfico de chamados por dia
function atualizarGraficoPorDia(dados) {
    const ctx = document.getElementById('chartPorDia').getContext('2d');
    
    const labels = dados.map(d => {
        const date = new Date(d.data);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    });
    const values = dados.map(d => d.total);
    
    if (chartPorDia) {
        chartPorDia.data.labels = labels;
        chartPorDia.data.datasets[0].data = values;
        chartPorDia.update();
    } else {
        chartPorDia = new Chart(ctx, {
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
}

// Gráfico de chamados por categoria
function atualizarGraficoPorCategoria(dados) {
    const ctx = document.getElementById('chartPorCategoria').getContext('2d');
    
    const labels = dados.slice(0, 6).map(d => d.categoria);
    const values = dados.slice(0, 6).map(d => d.total);
    
    const colors = [
        '#2563eb', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'
    ];
    
    if (chartPorCategoria) {
        chartPorCategoria.data.labels = labels;
        chartPorCategoria.data.datasets[0].data = values;
        chartPorCategoria.update();
    } else {
        chartPorCategoria = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Chamados',
                    data: values,
                    backgroundColor: colors
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
}

// Gráfico de chamados por status
function atualizarGraficoPorStatus(dados) {
    const ctx = document.getElementById('chartPorStatus').getContext('2d');
    
    const statusLabels = {
        'aberto': 'Aberto',
        'em_andamento': 'Em Andamento',
        'resolvido': 'Resolvido',
        'fechado': 'Fechado'
    };
    
    const statusColors = {
        'aberto': '#3b82f6',
        'em_andamento': '#f59e0b',
        'resolvido': '#22c55e',
        'fechado': '#64748b'
    };
    
    const labels = dados.map(d => statusLabels[d.status] || d.status);
    const values = dados.map(d => d.total);
    const colors = dados.map(d => statusColors[d.status] || '#94a3b8');
    
    if (chartPorStatus) {
        chartPorStatus.data.labels = labels;
        chartPorStatus.data.datasets[0].data = values;
        chartPorStatus.data.datasets[0].backgroundColor = colors;
        chartPorStatus.update();
    } else {
        chartPorStatus = new Chart(ctx, {
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
                        position: 'bottom'
                    }
                }
            }
        });
    }
}

// Gráfico de chamados por urgência
function atualizarGraficoPorUrgencia(dados) {
    const ctx = document.getElementById('chartPorUrgencia').getContext('2d');
    
    const urgenciaLabels = {
        'critica': 'Crítica',
        'alta': 'Alta',
        'media': 'Média',
        'baixa': 'Baixa'
    };
    
    const urgenciaColors = {
        'critica': '#ef4444',
        'alta': '#f97316',
        'media': '#eab308',
        'baixa': '#22c55e'
    };
    
    const labels = dados.map(d => urgenciaLabels[d.urgencia] || d.urgencia);
    const values = dados.map(d => d.total);
    const colors = dados.map(d => urgenciaColors[d.urgencia] || '#94a3b8');
    
    if (chartPorUrgencia) {
        chartPorUrgencia.data.labels = labels;
        chartPorUrgencia.data.datasets[0].data = values;
        chartPorUrgencia.data.datasets[0].backgroundColor = colors;
        chartPorUrgencia.update();
    } else {
        chartPorUrgencia = new Chart(ctx, {
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
                        position: 'bottom'
                    }
                }
            }
        });
    }
}

// Atualizar tabela de técnicos
function atualizarTabelaTecnicos(dados) {
    const tbody = document.getElementById('tabelaTecnicos');
    
    if (!dados || dados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">Nenhum técnico com chamados atribuídos</td></tr>';
        return;
    }
    
    tbody.innerHTML = dados.map(t => {
        const taxa = t.total_atribuidos > 0 
            ? ((t.total_resolvidos / t.total_atribuidos) * 100).toFixed(1)
            : 0;
        
        return `
            <tr>
                <td>${escapeHtml(t.nome)}</td>
                <td>${t.total_atribuidos}</td>
                <td>${t.total_resolvidos}</td>
                <td>${taxa}%</td>
            </tr>
        `;
    }).join('');
}

// Escape HTML para prevenir XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
