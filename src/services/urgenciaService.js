class UrgenciaService {
    // Palavras-chave que indicam urgência crítica
    static palavrasChaveCritica = [
        'não liga', 'nao liga', 'não funciona', 'nao funciona',
        'sem internet', 'fora do ar', 'parou', 'tela azul', 'bsod',
        'sistema fora', 'servidor fora', 'pabx', 'travou completamente',
        'urgente', 'emergência', 'emergencia', 'crítico', 'critico'
    ];

    // Palavras-chave que indicam urgência alta
    static palavrasChaveAlta = [
        'lento', 'travando', 'não imprime', 'nao imprime', 'offline',
        'não conecta', 'nao conecta', 'sem acesso', 'bloqueado', 'bloqueada',
        'erro', 'falha', 'não abre', 'nao abre', 'não envia', 'nao envia',
        'não recebe', 'nao recebe', 'corrompido', 'corrompida', 'sumiu'
    ];

    // Palavras-chave que indicam urgência baixa
    static palavrasChaveBaixa = [
        'dúvida', 'duvida', 'solicitação', 'solicitacao', 'instalar',
        'instalação', 'instalacao', 'novo', 'nova', 'criar', 'atualizar',
        'backup', 'quando possível', 'quando possivel', 'sem pressa'
    ];

    // Subcategorias com urgência pré-definida (CRÍTICA)
    static subcategoriasCriticas = [
        'Tela azul (BSOD)',
        'Computador não liga',
        'Sem internet',
        'Sistema não abre',
        'Sistema fora do ar',
        'Problema no PABX'
    ];

    // Subcategorias com urgência pré-definida (ALTA)
    static subcategoriasAltas = [
        'Computador travando',
        'Computador liga, mas não inicia o Windows',
        'Falha no HD/SSD',
        'Sem vídeo no monitor',
        'Superaquecimento',
        'Internet lenta',
        'Wi-Fi não conecta',
        'Sem acesso ao servidor',
        'Queda de conexão frequente',
        'Impressora não imprime',
        'Impressora de etiquetas não imprime',
        'Conta bloqueada',
        'Erro de login',
        'Erro ao acessar o sistema',
        'Erro em cadastro',
        'Erro em integração',
        'Problema após atualização',
        'Não recebe e-mails',
        'Não envia e-mails',
        'E-mail suspeito / possível vírus',
        'Teclado não funciona',
        'Mouse não funciona',
        'Monitor sem imagem',
        'Leitor de código de barras com falha',
        'Telefone sem linha',
        'Telefone mudo',
        'Sem acesso à pasta de rede',
        'Pasta sumiu',
        'Restauração de backup'
    ];

    // Subcategorias com urgência pré-definida (BAIXA)
    static subcategoriasBaixas = [
        'Sem som',
        'Criação de usuário',
        'Solicitação de acesso ao sistema',
        'Solicitação de permissão no sistema',
        'Atualização de sistema',
        'Solicitação de criação de e-mail',
        'Alteração de ramal',
        'Novo ramal',
        'Instalação de software',
        'Atualização de software',
        'Novo equipamento',
        'Outro problema não listado',
        'Dúvida técnica',
        'Solicitação especial'
    ];

    /**
     * Determina a urgência baseada na subcategoria e descrição
     * @param {string} subcategoria - Nome da subcategoria
     * @param {string} descricao - Descrição do problema
     * @returns {string} - Nível de urgência: CRITICA, ALTA, MEDIA, BAIXA
     */
    static determinarUrgencia(subcategoria, descricao = '') {
        // Primeiro, verificar urgência pela subcategoria
        if (this.subcategoriasCriticas.includes(subcategoria)) {
            return 'CRITICA';
        }
        if (this.subcategoriasAltas.includes(subcategoria)) {
            return 'ALTA';
        }
        if (this.subcategoriasBaixas.includes(subcategoria)) {
            return 'BAIXA';
        }

        // Se não estiver nas listas, analisar a descrição
        if (descricao) {
            const descricaoLower = descricao.toLowerCase();

            // Verificar palavras-chave críticas
            for (const palavra of this.palavrasChaveCritica) {
                if (descricaoLower.includes(palavra)) {
                    return 'CRITICA';
                }
            }

            // Verificar palavras-chave de alta urgência
            for (const palavra of this.palavrasChaveAlta) {
                if (descricaoLower.includes(palavra)) {
                    return 'ALTA';
                }
            }

            // Verificar palavras-chave de baixa urgência
            for (const palavra of this.palavrasChaveBaixa) {
                if (descricaoLower.includes(palavra)) {
                    return 'BAIXA';
                }
            }
        }

        // Padrão: MEDIA
        return 'MEDIA';
    }

    /**
     * Retorna a cor associada à urgência (para UI)
     * @param {string} urgencia 
     * @returns {string} - Cor hexadecimal
     */
    static getCorUrgencia(urgencia) {
        const cores = {
            'CRITICA': '#dc3545',
            'ALTA': '#fd7e14',
            'MEDIA': '#ffc107',
            'BAIXA': '#28a745'
        };
        return cores[urgencia] || '#6c757d';
    }

    /**
     * Retorna o emoji associado à urgência
     * @param {string} urgencia 
     * @returns {string} - Emoji
     */
    static getEmojiUrgencia(urgencia) {
        const emojis = {
            'CRITICA': '🔴',
            'ALTA': '🟠',
            'MEDIA': '🟡',
            'BAIXA': '🟢'
        };
        return emojis[urgencia] || '⚪';
    }

    /**
     * Retorna a descrição da urgência
     * @param {string} urgencia 
     * @returns {string}
     */
    static getDescricaoUrgencia(urgencia) {
        const descricoes = {
            'CRITICA': 'Crítica - Atendimento imediato necessário',
            'ALTA': 'Alta - Atendimento prioritário',
            'MEDIA': 'Média - Atendimento em horário normal',
            'BAIXA': 'Baixa - Pode aguardar'
        };
        return descricoes[urgencia] || 'Não definida';
    }
}

module.exports = UrgenciaService;
