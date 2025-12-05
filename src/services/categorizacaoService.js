const Categoria = require('../models/Categoria');

// Categorias que exigem informação de sistema
const CATEGORIA_SISTEMAS_ID = 5;
const CATEGORIA_SISTEMAS_NOME = 'Sistemas';

/**
 * Verifica se a categoria exige informação de sistema
 * @param {number|string} categoriaIdOuNome - ID ou nome da categoria
 * @returns {boolean}
 */
const exigeSistema = (categoriaIdOuNome) => {
    if (typeof categoriaIdOuNome === 'number') {
        return categoriaIdOuNome === CATEGORIA_SISTEMAS_ID;
    }
    return categoriaIdOuNome === CATEGORIA_SISTEMAS_NOME;
};

/**
 * Obtém o menu principal de categorias
 * @returns {Promise<Object>} - Menu formatado e lista de categorias
 */
const obterMenuPrincipal = async () => {
    return await Categoria.obterMenuCategorias();
};

/**
 * Obtém o menu de subcategorias para uma categoria
 * @param {number} categoriaId - ID da categoria
 * @returns {Promise<Object|null>} - Menu formatado ou null
 */
const obterMenuSubcategorias = async (categoriaId) => {
    return await Categoria.obterMenuSubcategorias(categoriaId);
};

/**
 * Valida a seleção de categoria
 * @param {string} opcao - Opção digitada pelo usuário
 * @returns {Promise<Object|null>} - Categoria selecionada ou null
 */
const validarSelecaoCategoria = async (opcao) => {
    const numero = parseInt(opcao);
    if (isNaN(numero) || numero < 1) {
        return null;
    }
    return await Categoria.buscarPorNumeroMenu(numero);
};

/**
 * Valida a seleção de subcategoria
 * @param {number} categoriaId - ID da categoria
 * @param {string} opcao - Opção digitada pelo usuário
 * @returns {Promise<Object|null>} - Subcategoria selecionada ou null
 */
const validarSelecaoSubcategoria = async (categoriaId, opcao) => {
    const numero = parseInt(opcao);
    if (isNaN(numero) || numero < 1) {
        return null;
    }
    return await Categoria.buscarSubcategoriaPorNumeroMenu(categoriaId, numero);
};

/**
 * Formata os dados do chamado para confirmação
 * @param {Object} dados - Dados do chamado
 * @returns {string} - Mensagem formatada
 */
const formatarConfirmacaoChamado = (dados) => {
    const { categoria, subcategoria, sistema, descricao, urgencia, numero } = dados;
    
    const urgenciaEmoji = {
        critica: '🔴 CRÍTICA',
        alta: '🟠 ALTA',
        media: '🟡 MÉDIA',
        baixa: '🟢 BAIXA'
    };

    let mensagem = '✅ *CHAMADO REGISTRADO COM SUCESSO!*\n\n';
    mensagem += `📝 *Número:* ${numero}\n`;
    mensagem += `📁 *Categoria:* ${categoria}\n`;
    mensagem += `🔹 *Problema:* ${subcategoria}\n`;
    
    if (sistema) {
        mensagem += `💻 *Sistema:* ${sistema}\n`;
    }
    
    if (descricao) {
        mensagem += `📋 *Descrição:* ${descricao}\n`;
    }
    
    mensagem += `⚡ *Urgência:* ${urgenciaEmoji[urgencia] || urgencia}\n`;
    mensagem += '\n_Um técnico irá analisar seu chamado em breve._\n';
    mensagem += '_Você receberá atualizações por aqui._';
    
    return mensagem;
};

/**
 * Lista todas as categorias
 * @returns {Promise<Array>}
 */
const listarCategorias = async () => {
    return await Categoria.listarTodas();
};

/**
 * Lista subcategorias de uma categoria
 * @param {number} categoriaId - ID da categoria
 * @returns {Promise<Array>}
 */
const listarSubcategorias = async (categoriaId) => {
    return await Categoria.listarSubcategorias(categoriaId);
};

module.exports = {
    exigeSistema,
    obterMenuPrincipal,
    obterMenuSubcategorias,
    validarSelecaoCategoria,
    validarSelecaoSubcategoria,
    formatarConfirmacaoChamado,
    listarCategorias,
    listarSubcategorias,
    CATEGORIA_SISTEMAS_ID,
    CATEGORIA_SISTEMAS_NOME
};
