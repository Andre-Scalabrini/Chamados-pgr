const { dbRun, dbGet, dbAll } = require('../config/database');
const { sendWhatsAppMessage } = require('../config/twilio');
const CategorizacaoService = require('./categorizacaoService');
const UrgenciaService = require('./urgenciaService');
const Chamado = require('../models/Chamado');
const Categoria = require('../models/Categoria');

// Estados da conversa
const ESTADOS = {
    MENU_INICIAL: 'MENU_INICIAL',
    AGUARDANDO_CATEGORIA: 'AGUARDANDO_CATEGORIA',
    AGUARDANDO_SUBCATEGORIA: 'AGUARDANDO_SUBCATEGORIA',
    AGUARDANDO_SISTEMA: 'AGUARDANDO_SISTEMA',
    AGUARDANDO_DESCRICAO: 'AGUARDANDO_DESCRICAO',
    CONFIRMACAO: 'CONFIRMACAO'
};

class WhatsAppService {
    /**
     * Obtém ou cria uma sessão para o telefone
     */
    static async obterSessao(telefone) {
        let sessao = await dbGet('SELECT * FROM sessoes_whatsapp WHERE telefone = ?', [telefone]);
        
        if (!sessao) {
            await dbRun(
                'INSERT INTO sessoes_whatsapp (telefone, passo_atual) VALUES (?, ?)',
                [telefone, ESTADOS.MENU_INICIAL]
            );
            sessao = await dbGet('SELECT * FROM sessoes_whatsapp WHERE telefone = ?', [telefone]);
        }
        
        return sessao;
    }

    /**
     * Atualiza a sessão do usuário
     */
    static async atualizarSessao(telefone, dados) {
        const campos = [];
        const valores = [];
        
        if (dados.passo_atual !== undefined) {
            campos.push('passo_atual = ?');
            valores.push(dados.passo_atual);
        }
        if (dados.categoria_selecionada !== undefined) {
            campos.push('categoria_selecionada = ?');
            valores.push(dados.categoria_selecionada);
        }
        if (dados.subcategoria_selecionada !== undefined) {
            campos.push('subcategoria_selecionada = ?');
            valores.push(dados.subcategoria_selecionada);
        }
        if (dados.sistema_informado !== undefined) {
            campos.push('sistema_informado = ?');
            valores.push(dados.sistema_informado);
        }
        if (dados.dados_temporarios !== undefined) {
            campos.push('dados_temporarios = ?');
            valores.push(typeof dados.dados_temporarios === 'object' 
                ? JSON.stringify(dados.dados_temporarios) 
                : dados.dados_temporarios);
        }
        
        campos.push('atualizado_em = CURRENT_TIMESTAMP');
        valores.push(telefone);
        
        await dbRun(`UPDATE sessoes_whatsapp SET ${campos.join(', ')} WHERE telefone = ?`, valores);
    }

    /**
     * Limpa/reinicia a sessão do usuário
     */
    static async limparSessao(telefone) {
        await dbRun(
            `UPDATE sessoes_whatsapp SET 
                passo_atual = ?,
                categoria_selecionada = NULL,
                subcategoria_selecionada = NULL,
                sistema_informado = NULL,
                dados_temporarios = NULL,
                atualizado_em = CURRENT_TIMESTAMP
             WHERE telefone = ?`,
            [ESTADOS.MENU_INICIAL, telefone]
        );
    }

    /**
     * Processa a mensagem recebida do WhatsApp
     */
    static async processarMensagem(telefone, mensagem, nomeUsuario = null) {
        const sessao = await this.obterSessao(telefone);
        const msgLower = mensagem.toLowerCase().trim();

        // Comandos globais
        if (msgLower === 'menu' || msgLower === 'inicio' || msgLower === 'início') {
            await this.limparSessao(telefone);
            return await this.enviarMenuInicial(telefone);
        }

        if (msgLower === 'status' || msgLower === 'meus chamados') {
            return await this.enviarStatusChamados(telefone);
        }

        // Processar baseado no estado atual
        switch (sessao.passo_atual) {
            case ESTADOS.MENU_INICIAL:
            case ESTADOS.AGUARDANDO_CATEGORIA:
                return await this.processarEscolhaCategoria(telefone, mensagem);
                
            case ESTADOS.AGUARDANDO_SUBCATEGORIA:
                return await this.processarEscolhaSubcategoria(telefone, mensagem, sessao);
                
            case ESTADOS.AGUARDANDO_SISTEMA:
                return await this.processarSistema(telefone, mensagem, sessao);
                
            case ESTADOS.AGUARDANDO_DESCRICAO:
                return await this.processarDescricao(telefone, mensagem, sessao, nomeUsuario);
                
            default:
                await this.limparSessao(telefone);
                return await this.enviarMenuInicial(telefone);
        }
    }

    /**
     * Envia o menu inicial
     */
    static async enviarMenuInicial(telefone) {
        const menu = await CategorizacaoService.getMenuInicial();
        const saudacao = `🤖 *Olá! Bem-vindo ao Suporte T.I*\n\n${menu}`;
        
        await this.atualizarSessao(telefone, { passo_atual: ESTADOS.AGUARDANDO_CATEGORIA });
        return await sendWhatsAppMessage(telefone, saudacao);
    }

    /**
     * Processa a escolha da categoria
     */
    static async processarEscolhaCategoria(telefone, mensagem) {
        const escolha = mensagem.trim();
        
        if (!CategorizacaoService.validarEscolhaCategoria(escolha)) {
            return await sendWhatsAppMessage(telefone, 
                '❌ Opção inválida. Por favor, digite um número de 1 a 11.');
        }

        const categoriaId = parseInt(escolha);
        const categoria = await CategorizacaoService.getCategoriaInfo(categoriaId);
        
        if (!categoria) {
            return await sendWhatsAppMessage(telefone, 
                '❌ Categoria não encontrada. Por favor, tente novamente.');
        }

        await this.atualizarSessao(telefone, {
            passo_atual: ESTADOS.AGUARDANDO_SUBCATEGORIA,
            categoria_selecionada: categoriaId
        });

        const submenu = await CategorizacaoService.getSubcategorias(categoriaId);
        return await sendWhatsAppMessage(telefone, submenu);
    }

    /**
     * Processa a escolha da subcategoria
     */
    static async processarEscolhaSubcategoria(telefone, mensagem, sessao) {
        const escolha = mensagem.trim();
        
        // Voltar ao menu
        if (escolha === '0') {
            await this.limparSessao(telefone);
            return await this.enviarMenuInicial(telefone);
        }

        const categoriaId = sessao.categoria_selecionada;
        const valido = await CategorizacaoService.validarEscolhaSubcategoria(categoriaId, escolha);
        
        if (!valido) {
            const subcategorias = await Categoria.listarSubcategorias(categoriaId);
            return await sendWhatsAppMessage(telefone, 
                `❌ Opção inválida. Por favor, digite um número de 1 a ${subcategorias.length} ou 0 para voltar.`);
        }

        const subcategoriaInfo = await CategorizacaoService.getSubcategoriaInfo(categoriaId, parseInt(escolha));
        
        await this.atualizarSessao(telefone, {
            subcategoria_selecionada: subcategoriaInfo.id,
            dados_temporarios: JSON.stringify({ subcategoria_nome: subcategoriaInfo.nome })
        });

        // Verificar se precisa informar sistema
        if (CategorizacaoService.requerSistema(categoriaId)) {
            await this.atualizarSessao(telefone, { passo_atual: ESTADOS.AGUARDANDO_SISTEMA });
            return await sendWhatsAppMessage(telefone, CategorizacaoService.getMensagemSistema());
        }

        // Ir direto para descrição
        await this.atualizarSessao(telefone, { passo_atual: ESTADOS.AGUARDANDO_DESCRICAO });
        return await sendWhatsAppMessage(telefone, CategorizacaoService.getMensagemDescricao());
    }

    /**
     * Processa o nome do sistema informado
     */
    static async processarSistema(telefone, mensagem, sessao) {
        const sistema = mensagem.trim();
        
        if (sistema.length < 2) {
            return await sendWhatsAppMessage(telefone, 
                '❌ Por favor, informe o nome do sistema (mínimo 2 caracteres).');
        }

        await this.atualizarSessao(telefone, {
            passo_atual: ESTADOS.AGUARDANDO_DESCRICAO,
            sistema_informado: sistema
        });

        return await sendWhatsAppMessage(telefone, CategorizacaoService.getMensagemDescricao());
    }

    /**
     * Processa a descrição e cria o chamado
     */
    static async processarDescricao(telefone, mensagem, sessao, nomeUsuario) {
        const descricao = mensagem.trim();
        
        if (descricao.length < 10) {
            return await sendWhatsAppMessage(telefone, 
                '❌ Por favor, forneça uma descrição mais detalhada (mínimo 10 caracteres).');
        }

        // Obter informações da categoria e subcategoria
        const categoria = await CategorizacaoService.getCategoriaInfo(sessao.categoria_selecionada);
        const subcategoria = await CategorizacaoService.getSubcategoriaInfo(
            sessao.categoria_selecionada, 
            sessao.subcategoria_selecionada
        );

        // Se subcategoria veio como ID, buscar novamente
        let subcategoriaNome = subcategoria ? subcategoria.nome : '';
        if (!subcategoriaNome && sessao.dados_temporarios) {
            try {
                const dados = JSON.parse(sessao.dados_temporarios);
                subcategoriaNome = dados.subcategoria_nome || '';
            } catch (e) {
                subcategoriaNome = '';
            }
        }

        // Determinar urgência
        const urgencia = UrgenciaService.determinarUrgencia(subcategoriaNome, descricao);

        // Criar o chamado
        const chamado = await Chamado.criar({
            telefone_usuario: telefone,
            nome_usuario: nomeUsuario || 'Não informado',
            categoria: categoria.nome,
            subcategoria: subcategoriaNome,
            sistema: sessao.sistema_informado,
            descricao: descricao,
            urgencia: urgencia
        });

        // Limpar sessão
        await this.limparSessao(telefone);

        // Enviar confirmação
        const urgenciaEmoji = UrgenciaService.getEmojiUrgencia(urgencia);
        const confirmacao = `✅ *CHAMADO REGISTRADO COM SUCESSO!*\n\n` +
            `📋 *Número:* ${chamado.numero}\n` +
            `📁 *Categoria:* ${categoria.emoji} ${categoria.nome}\n` +
            `🔹 *Problema:* ${subcategoriaNome}\n` +
            (sessao.sistema_informado ? `💻 *Sistema:* ${sessao.sistema_informado}\n` : '') +
            `${urgenciaEmoji} *Urgência:* ${urgencia}\n\n` +
            `📝 *Descrição:*\n${descricao}\n\n` +
            `⏰ Nossa equipe analisará seu chamado em breve.\n\n` +
            `_Digite *status* para acompanhar seus chamados._\n` +
            `_Digite *menu* para abrir um novo chamado._`;

        return await sendWhatsAppMessage(telefone, confirmacao);
    }

    /**
     * Envia status dos chamados do usuário
     */
    static async enviarStatusChamados(telefone) {
        const chamados = await Chamado.buscarPorTelefone(telefone);
        
        if (!chamados || chamados.length === 0) {
            return await sendWhatsAppMessage(telefone, 
                '📭 Você não possui chamados registrados.\n\nDigite *menu* para abrir um novo chamado.');
        }

        let mensagem = '📋 *SEUS CHAMADOS*\n\n';
        
        const chamadosRecentes = chamados.slice(0, 5);
        
        for (const c of chamadosRecentes) {
            const statusEmoji = this.getStatusEmoji(c.status);
            const urgenciaEmoji = UrgenciaService.getEmojiUrgencia(c.urgencia);
            
            mensagem += `${statusEmoji} *${c.numero}*\n`;
            mensagem += `   📁 ${c.categoria}\n`;
            mensagem += `   🔹 ${c.subcategoria}\n`;
            mensagem += `   ${urgenciaEmoji} Urgência: ${c.urgencia}\n`;
            mensagem += `   📅 ${new Date(c.criado_em).toLocaleDateString('pt-BR')}\n\n`;
        }

        if (chamados.length > 5) {
            mensagem += `_Exibindo os 5 chamados mais recentes de ${chamados.length} total._\n`;
        }

        mensagem += '\n_Digite *menu* para abrir um novo chamado._';
        
        return await sendWhatsAppMessage(telefone, mensagem);
    }

    /**
     * Retorna emoji do status
     */
    static getStatusEmoji(status) {
        const emojis = {
            'ABERTO': '🆕',
            'EM_ANDAMENTO': '🔄',
            'RESOLVIDO': '✅',
            'FECHADO': '📦'
        };
        return emojis[status] || '❓';
    }
}

module.exports = WhatsAppService;
