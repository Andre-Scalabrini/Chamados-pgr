const Categoria = require('../models/Categoria');
const { dbGet, dbAll } = require('../config/database');

class CategorizacaoService {
    // Obtém as categorias para o menu inicial
    static async getMenuInicial() {
        return await Categoria.getMenuFormatado();
    }

    // Obtém subcategorias de uma categoria
    static async getSubcategorias(categoriaId) {
        return await Categoria.getSubcategoriasFormatadas(categoriaId);
    }

    // Valida se a escolha de categoria é válida
    static validarEscolhaCategoria(escolha) {
        const num = parseInt(escolha);
        return num >= 1 && num <= 11;
    }

    // Retorna os dados da categoria selecionada
    static async getCategoriaInfo(numero) {
        const categorias = Categoria.categoriasData();
        return categorias[numero - 1] || null;
    }

    // Valida escolha de subcategoria
    static async validarEscolhaSubcategoria(categoriaId, escolha) {
        if (escolha === '0') return true; // Voltar ao menu
        
        const subcategorias = await Categoria.listarSubcategorias(categoriaId);
        const num = parseInt(escolha);
        return num >= 1 && num <= subcategorias.length;
    }

    // Obtém subcategoria selecionada
    static async getSubcategoriaInfo(categoriaId, numero) {
        const subcategorias = await Categoria.listarSubcategorias(categoriaId);
        return subcategorias[numero - 1] || null;
    }

    // Verifica se a categoria requer informar o sistema
    static requerSistema(categoriaId) {
        const categorias = Categoria.categoriasData();
        const categoria = categorias.find(c => c.id === categoriaId);
        return categoria ? categoria.requerSistema : false;
    }

    // Gera mensagem de solicitação de sistema
    static getMensagemSistema() {
        return '💻 *SISTEMA NECESSÁRIO*\n\n' +
               'Por favor, informe o nome do sistema que você está utilizando.\n\n' +
               '_Exemplo: SAP, TOTVS, Protheus, Office 365, etc._';
    }

    // Gera mensagem de solicitação de descrição
    static getMensagemDescricao() {
        return '📝 *DESCRIÇÃO DO PROBLEMA*\n\n' +
               'Descreva detalhadamente o problema que você está enfrentando.\n\n' +
               '_Inclua mensagens de erro, quando começou e qualquer outra informação relevante._';
    }
}

module.exports = CategorizacaoService;
