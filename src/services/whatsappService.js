const { runQuery, getOne, getAll } = require('../config/database');
const Chamado = require('../models/Chamado');
const { sendMessage } = require('../config/whatsapp-client');
const categorizacaoService = require('./categorizacaoService');
const urgenciaService = require('./urgenciaService');

// Passos do fluxo de conversação
const PASSOS = {
    INICIO: 'inicio',
    AGUARDANDO_NOME: 'aguardando_nome',
    MENU_CATEGORIAS: 'menu_categorias',
    MENU_SUBCATEGORIAS: 'menu_subcategorias',
    AGUARDANDO_SISTEMA: 'aguardando_sistema',
    AGUARDANDO_DESCRICAO: 'aguardando_descricao',
    CONFIRMACAO: 'confirmacao'
};

/**
 * Obtém ou cria sessão do usuário
 * @param {string} telefone - Número do telefone
 * @returns {Promise<Object>} - Sessão do usuário
 */
const obterSessao = async (telefone) => {
    const sql = 'SELECT * FROM sessoes_whatsapp WHERE telefone = ?';
    let sessao = await getOne(sql, [telefone]);
    
    if (!sessao) {
        await runQuery(
            'INSERT INTO sessoes_whatsapp (telefone, passo_atual) VALUES (?, ?)',
            [telefone, PASSOS.INICIO]
        );
        sessao = await getOne(sql, [telefone]);
    }
    
    // Parse dos dados temporários
    if (sessao.dados_temporarios) {
        try {
            sessao.dados_temporarios = JSON.parse(sessao.dados_temporarios);
        } catch (error) {
            console.error('Erro ao parsear dados temporários da sessão:', error.message);
            sessao.dados_temporarios = {};
        }
    } else {
        sessao.dados_temporarios = {};
    }
    
    return sessao;
};

/**
 * Atualiza a sessão do usuário
 * @param {string} telefone - Número do telefone
 * @param {Object} dados - Dados para atualizar
 */
const atualizarSessao = async (telefone, dados) => {
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
    
    if (dados.dados_temporarios !== undefined) {
        campos.push('dados_temporarios = ?');
        valores.push(JSON.stringify(dados.dados_temporarios));
    }
    
    if (dados.nome_usuario !== undefined) {
        campos.push('nome_usuario = ?');
        valores.push(dados.nome_usuario);
    }
    
    campos.push('atualizado_em = CURRENT_TIMESTAMP');
    valores.push(telefone);
    
    const sql = `UPDATE sessoes_whatsapp SET ${campos.join(', ')} WHERE telefone = ?`;
    await runQuery(sql, valores);
};

/**
 * Limpa a sessão do usuário
 * @param {string} telefone - Número do telefone
 */
const limparSessao = async (telefone) => {
    await runQuery(
        `UPDATE sessoes_whatsapp 
         SET passo_atual = ?, categoria_selecionada = NULL, 
             subcategoria_selecionada = NULL, dados_temporarios = NULL,
             atualizado_em = CURRENT_TIMESTAMP
         WHERE telefone = ?`,
        [PASSOS.INICIO, telefone]
    );
};

/**
 * Gera mensagem de boas-vindas
 * @returns {string}
 */
const getMensagemBoasVindas = () => {
    return `🖥️ *BEM-VINDO AO SUPORTE DE T.I!*

Olá! Sou o assistente virtual do setor de Tecnologia da Informação.

Estou aqui para ajudá-lo a registrar chamados técnicos de forma rápida e eficiente.

📝 Para iniciar, por favor, digite seu *nome completo*:`;
};

/**
 * Gera mensagem de opção inválida
 * @returns {string}
 */
const getMensagemOpcaoInvalida = () => {
    return '❌ *Opção inválida!*\n\nPor favor, digite apenas o número correspondente à opção desejada.';
};

/**
 * Processa mensagem recebida
 * @param {Object} message - Mensagem do WhatsApp
 * @returns {Promise<string>} - Resposta a ser enviada
 */
const processarMensagem = async (message) => {
    const telefone = message.from;
    const texto = message.body.trim();
    
    // Verificar comandos especiais
    if (texto.toLowerCase() === 'menu' || texto.toLowerCase() === 'inicio' || texto === '0') {
        await limparSessao(telefone);
        return getMensagemBoasVindas();
    }
    
    // Verificar status de chamados
    if (texto.toLowerCase() === 'status' || texto.toLowerCase() === 'meus chamados') {
        const chamados = await Chamado.buscarPorTelefone(telefone);
        if (chamados.length === 0) {
            return '📋 Você não possui chamados registrados.\n\nDigite *MENU* para abrir um novo chamado.';
        }
        
        let resposta = '📋 *SEUS CHAMADOS:*\n\n';
        chamados.slice(0, 5).forEach(c => {
            const statusEmoji = {
                aberto: '🔵',
                em_andamento: '🟡',
                resolvido: '🟢',
                fechado: '⚫'
            };
            resposta += `${statusEmoji[c.status] || '⚪'} *${c.numero}*\n`;
            resposta += `   📁 ${c.categoria} - ${c.subcategoria}\n`;
            resposta += `   📊 Status: ${c.status.replace('_', ' ')}\n\n`;
        });
        
        resposta += '\n_Digite *MENU* para abrir um novo chamado._';
        return resposta;
    }
    
    // Obter sessão atual
    const sessao = await obterSessao(telefone);
    
    // Processar baseado no passo atual
    switch (sessao.passo_atual) {
        case PASSOS.INICIO:
            return await processarInicio(telefone, texto, sessao);
            
        case PASSOS.AGUARDANDO_NOME:
            return await processarNome(telefone, texto, sessao);
            
        case PASSOS.MENU_CATEGORIAS:
            return await processarCategoria(telefone, texto, sessao);
            
        case PASSOS.MENU_SUBCATEGORIAS:
            return await processarSubcategoria(telefone, texto, sessao);
            
        case PASSOS.AGUARDANDO_SISTEMA:
            return await processarSistema(telefone, texto, sessao);
            
        case PASSOS.AGUARDANDO_DESCRICAO:
            return await processarDescricao(telefone, texto, sessao);
            
        default:
            await limparSessao(telefone);
            return getMensagemBoasVindas();
    }
};

/**
 * Processa o passo inicial
 */
const processarInicio = async (telefone, texto, sessao) => {
    // Primeira mensagem - mostrar boas vindas e pedir nome
    await atualizarSessao(telefone, { passo_atual: PASSOS.AGUARDANDO_NOME });
    return getMensagemBoasVindas();
};

/**
 * Processa o nome do usuário
 */
const processarNome = async (telefone, texto, sessao) => {
    if (texto.length < 3) {
        return '❌ Por favor, digite seu nome completo (mínimo 3 caracteres).';
    }
    
    // Salvar nome e mostrar menu de categorias
    await atualizarSessao(telefone, {
        nome_usuario: texto,
        passo_atual: PASSOS.MENU_CATEGORIAS,
        dados_temporarios: { nome: texto }
    });
    
    const { menu } = await categorizacaoService.obterMenuPrincipal();
    return `Olá, *${texto}*! 👋\n\n${menu}`;
};

/**
 * Processa seleção de categoria
 */
const processarCategoria = async (telefone, texto, sessao) => {
    const categoria = await categorizacaoService.validarSelecaoCategoria(texto);
    
    if (!categoria) {
        const { menu } = await categorizacaoService.obterMenuPrincipal();
        return `${getMensagemOpcaoInvalida()}\n\n${menu}`;
    }
    
    // Atualizar sessão
    const dadosTemp = sessao.dados_temporarios || {};
    dadosTemp.categoria = categoria.nome;
    dadosTemp.categoria_id = categoria.id;
    
    await atualizarSessao(telefone, {
        categoria_selecionada: categoria.id,
        passo_atual: PASSOS.MENU_SUBCATEGORIAS,
        dados_temporarios: dadosTemp
    });
    
    // Mostrar subcategorias
    const menuSub = await categorizacaoService.obterMenuSubcategorias(categoria.id);
    return menuSub.menu;
};

/**
 * Processa seleção de subcategoria
 */
const processarSubcategoria = async (telefone, texto, sessao) => {
    const subcategoria = await categorizacaoService.validarSelecaoSubcategoria(
        sessao.categoria_selecionada,
        texto
    );
    
    if (!subcategoria) {
        const menuSub = await categorizacaoService.obterMenuSubcategorias(sessao.categoria_selecionada);
        return `${getMensagemOpcaoInvalida()}\n\n${menuSub.menu}`;
    }
    
    const dadosTemp = sessao.dados_temporarios || {};
    dadosTemp.subcategoria = subcategoria.nome;
    dadosTemp.subcategoria_id = subcategoria.id;
    
    // Verificar se a categoria exige sistema
    if (categorizacaoService.exigeSistema(sessao.categoria_selecionada)) {
        await atualizarSessao(telefone, {
            subcategoria_selecionada: subcategoria.id,
            passo_atual: PASSOS.AGUARDANDO_SISTEMA,
            dados_temporarios: dadosTemp
        });
        
        return `💻 *INFORMAÇÃO OBRIGATÓRIA*

Você selecionou a categoria *Sistemas*.

Por favor, informe o *nome do sistema* em que está tendo o problema:

_Exemplo: SAP, TOTVS, Sistema de Vendas, etc._`;
    }
    
    // Se não exige sistema, pedir descrição
    await atualizarSessao(telefone, {
        subcategoria_selecionada: subcategoria.id,
        passo_atual: PASSOS.AGUARDANDO_DESCRICAO,
        dados_temporarios: dadosTemp
    });
    
    return `📝 *DESCRIÇÃO DO PROBLEMA*

Por favor, descreva detalhadamente o problema ou a solicitação.

_Quanto mais detalhes, mais rápido poderemos ajudá-lo._

_(Digite "pular" para não adicionar descrição)_`;
};

/**
 * Processa informação do sistema
 */
const processarSistema = async (telefone, texto, sessao) => {
    if (texto.length < 2) {
        return '❌ Por favor, informe o nome do sistema (mínimo 2 caracteres).';
    }
    
    const dadosTemp = sessao.dados_temporarios || {};
    dadosTemp.sistema = texto;
    
    await atualizarSessao(telefone, {
        passo_atual: PASSOS.AGUARDANDO_DESCRICAO,
        dados_temporarios: dadosTemp
    });
    
    return `📝 *DESCRIÇÃO DO PROBLEMA*

Por favor, descreva detalhadamente o problema ou a solicitação.

_Quanto mais detalhes, mais rápido poderemos ajudá-lo._

_(Digite "pular" para não adicionar descrição)_`;
};

/**
 * Processa descrição e finaliza chamado
 */
const processarDescricao = async (telefone, texto, sessao) => {
    const dadosTemp = sessao.dados_temporarios || {};
    
    // Verificar se quer pular
    if (texto.toLowerCase() !== 'pular') {
        dadosTemp.descricao = texto;
    }
    
    // Determinar urgência
    const urgencia = urgenciaService.determinarUrgencia({
        subcategoria: dadosTemp.subcategoria,
        descricao: dadosTemp.descricao
    });
    
    // Criar o chamado
    const chamado = await Chamado.criar({
        telefone_usuario: telefone,
        nome_usuario: dadosTemp.nome || sessao.nome_usuario,
        categoria: dadosTemp.categoria,
        subcategoria: dadosTemp.subcategoria,
        sistema: dadosTemp.sistema || null,
        descricao: dadosTemp.descricao || null,
        urgencia
    });
    
    // Limpar sessão
    await limparSessao(telefone);
    
    // Formatar confirmação
    const mensagemConfirmacao = categorizacaoService.formatarConfirmacaoChamado({
        numero: chamado.numero,
        categoria: dadosTemp.categoria,
        subcategoria: dadosTemp.subcategoria,
        sistema: dadosTemp.sistema,
        descricao: dadosTemp.descricao,
        urgencia
    });
    
    return mensagemConfirmacao + '\n\n_Digite *MENU* para abrir outro chamado ou *STATUS* para ver seus chamados._';
};

/**
 * Notifica usuário sobre atualização do chamado
 * @param {string} telefone - Número do telefone
 * @param {Object} chamado - Dados do chamado
 * @param {string} mensagem - Mensagem adicional
 */
const notificarAtualizacao = async (telefone, chamado, mensagem) => {
    const statusEmoji = {
        aberto: '🔵 Aberto',
        em_andamento: '🟡 Em Andamento',
        resolvido: '🟢 Resolvido',
        fechado: '⚫ Fechado'
    };
    
    let notificacao = `📢 *ATUALIZAÇÃO DO CHAMADO*\n\n`;
    notificacao += `📝 *Número:* ${chamado.numero}\n`;
    notificacao += `📊 *Status:* ${statusEmoji[chamado.status] || chamado.status}\n`;
    
    if (mensagem) {
        notificacao += `\n💬 *Mensagem:*\n${mensagem}`;
    }
    
    try {
        await sendMessage(telefone, notificacao);
    } catch (error) {
        console.error('Erro ao enviar notificação:', error);
    }
};

module.exports = {
    processarMensagem,
    obterSessao,
    atualizarSessao,
    limparSessao,
    notificarAtualizacao,
    PASSOS
};
