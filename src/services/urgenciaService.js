// Palavras-chave para determinação de urgência
const palavrasChaveUrgencia = {
    critica: [
        'não liga', 'desligado', 'sem energia', 'fora do ar', 'indisponivel', 'down',
        'tela azul', 'bsod', 'sem internet', 'parou de funcionar', 'urgente',
        'critico', 'emergencia', 'servidor caiu', 'sistema caiu', 'produção parada'
    ],
    alta: [
        'travando', 'trava', 'congela', 'não inicia', 'boot', 'lenta', 'lento',
        'não imprime', 'parou', 'não conecta', 'servidor', 'erro', 'falha',
        'bloqueada', 'bloqueio', 'login', 'não abre', 'não funciona',
        'offline', 'desconectado', 'virus', 'suspeito', 'corrompido'
    ],
    media: [
        'instavel', 'caindo', 'oscilando', 'borrada', 'cortada', 'spooler',
        'senha', 'reset', 'cheia', 'lotada', 'permissao', 'negada',
        'lentidão', 'demora', 'backup', 'restaurar'
    ],
    baixa: [
        'duvida', 'pergunta', 'ajuda', 'criar', 'novo', 'solicitar',
        'instalar', 'atualizar', 'configurar', 'configuracao', 'alterar',
        'especial', 'outro'
    ]
};

// Subcategorias com urgência crítica automática
const subcategoriasUrgenciaCritica = [
    'Computador não liga',
    'Sem internet',
    'Sistema fora do ar',
    'Tela azul (BSOD)'
];

// Subcategorias com urgência alta automática
const subcategoriasUrgenciaAlta = [
    'Computador travando',
    'Internet lenta',
    'Impressora não imprime',
    'Sem acesso ao servidor',
    'Conta bloqueada',
    'Sistema não abre',
    'Erro ao acessar o sistema'
];

// Subcategorias com urgência média automática
const subcategoriasUrgenciaMedia = [
    'Computador lento',
    'Wi-Fi instável',
    'Arquivo corrompido'
];

// Subcategorias com urgência baixa automática
const subcategoriasUrgenciaBaixa = [
    'Dúvida técnica',
    'Solicitação especial',
    'Outro problema não listado'
];

/**
 * Determina a urgência baseada na subcategoria selecionada
 * @param {string} subcategoria - Nome da subcategoria
 * @returns {string} - Nível de urgência
 */
const determinarUrgenciaPorSubcategoria = (subcategoria) => {
    if (subcategoriasUrgenciaCritica.includes(subcategoria)) {
        return 'critica';
    }
    if (subcategoriasUrgenciaAlta.includes(subcategoria)) {
        return 'alta';
    }
    if (subcategoriasUrgenciaMedia.includes(subcategoria)) {
        return 'media';
    }
    if (subcategoriasUrgenciaBaixa.includes(subcategoria)) {
        return 'baixa';
    }
    return 'media'; // Padrão
};

/**
 * Analisa o texto da descrição para ajustar a urgência
 * @param {string} descricao - Descrição do problema
 * @param {string} urgenciaAtual - Urgência determinada pela subcategoria
 * @returns {string} - Urgência ajustada
 */
const analisarDescricao = (descricao, urgenciaAtual) => {
    if (!descricao) return urgenciaAtual;
    
    const textoLower = descricao.toLowerCase();
    
    // Verificar palavras-chave críticas
    for (const palavra of palavrasChaveUrgencia.critica) {
        if (textoLower.includes(palavra)) {
            return 'critica';
        }
    }
    
    // Se já é crítica, não diminuir
    if (urgenciaAtual === 'critica') return urgenciaAtual;
    
    // Verificar palavras-chave de alta urgência
    for (const palavra of palavrasChaveUrgencia.alta) {
        if (textoLower.includes(palavra)) {
            return 'alta';
        }
    }
    
    return urgenciaAtual;
};

/**
 * Determina a urgência final do chamado
 * @param {Object} dados - Dados do chamado
 * @returns {string} - Urgência final
 */
const determinarUrgencia = (dados) => {
    const { subcategoria, descricao } = dados;
    
    // Primeiro, determinar pela subcategoria
    let urgencia = determinarUrgenciaPorSubcategoria(subcategoria);
    
    // Depois, analisar a descrição para possível ajuste
    urgencia = analisarDescricao(descricao, urgencia);
    
    return urgencia;
};

/**
 * Retorna o emoji correspondente à urgência
 * @param {string} urgencia - Nível de urgência
 * @returns {string} - Emoji
 */
const getEmojiUrgencia = (urgencia) => {
    const emojis = {
        critica: '🔴',
        alta: '🟠',
        media: '🟡',
        baixa: '🟢'
    };
    return emojis[urgencia] || '⚪';
};

/**
 * Retorna a descrição da urgência
 * @param {string} urgencia - Nível de urgência
 * @returns {string} - Descrição
 */
const getDescricaoUrgencia = (urgencia) => {
    const descricoes = {
        critica: 'CRÍTICA - Atendimento imediato necessário',
        alta: 'ALTA - Atendimento prioritário',
        media: 'MÉDIA - Atendimento normal',
        baixa: 'BAIXA - Pode aguardar'
    };
    return descricoes[urgencia] || 'Não definida';
};

module.exports = {
    determinarUrgencia,
    determinarUrgenciaPorSubcategoria,
    analisarDescricao,
    getEmojiUrgencia,
    getDescricaoUrgencia,
    palavrasChaveUrgencia
};
