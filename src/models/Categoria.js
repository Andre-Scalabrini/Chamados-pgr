const { runQuery, getOne, getAll } = require('../config/database');

class Categoria {
    // Listar todas as categorias ativas
    static async listarTodas() {
        const sql = `
            SELECT * FROM categorias 
            WHERE ativo = 1 
            ORDER BY ordem
        `;
        return await getAll(sql);
    }

    // Buscar categoria por ID
    static async buscarPorId(id) {
        const sql = 'SELECT * FROM categorias WHERE id = ?';
        return await getOne(sql, [id]);
    }

    // Listar subcategorias de uma categoria
    static async listarSubcategorias(categoriaId) {
        const sql = `
            SELECT * FROM subcategorias 
            WHERE categoria_id = ? AND ativo = 1
            ORDER BY id
        `;
        return await getAll(sql, [categoriaId]);
    }

    // Buscar subcategoria por ID
    static async buscarSubcategoriaPorId(id) {
        const sql = `
            SELECT s.*, c.nome as categoria_nome 
            FROM subcategorias s
            JOIN categorias c ON s.categoria_id = c.id
            WHERE s.id = ?
        `;
        return await getOne(sql, [id]);
    }

    // Obter menu formatado para WhatsApp
    static async obterMenuCategorias() {
        const categorias = await this.listarTodas();
        
        let menu = '📋 *MENU DE CATEGORIAS*\n\n';
        menu += 'Por favor, digite o *número* da categoria:\n\n';
        
        categorias.forEach((cat, index) => {
            menu += `${cat.emoji} *${index + 1}.* ${cat.nome}\n`;
        });
        
        menu += '\n_Digite apenas o número da opção desejada._';
        
        return { menu, categorias };
    }

    // Obter menu de subcategorias formatado
    static async obterMenuSubcategorias(categoriaId) {
        const categoria = await this.buscarPorId(categoriaId);
        const subcategorias = await this.listarSubcategorias(categoriaId);
        
        if (!categoria || subcategorias.length === 0) {
            return null;
        }
        
        let menu = `${categoria.emoji} *${categoria.nome.toUpperCase()}*\n\n`;
        menu += 'Selecione o problema:\n\n';
        
        subcategorias.forEach((sub, index) => {
            menu += `*${index + 1}.* ${sub.nome}\n`;
        });
        
        menu += '\n_Digite apenas o número da opção desejada._';
        
        return { menu, subcategorias, categoria };
    }

    // Buscar categoria por número (índice do menu)
    static async buscarPorNumeroMenu(numero) {
        const categorias = await this.listarTodas();
        const index = parseInt(numero) - 1;
        
        if (index >= 0 && index < categorias.length) {
            return categorias[index];
        }
        return null;
    }

    // Buscar subcategoria por número (índice do menu)
    static async buscarSubcategoriaPorNumeroMenu(categoriaId, numero) {
        const subcategorias = await this.listarSubcategorias(categoriaId);
        const index = parseInt(numero) - 1;
        
        if (index >= 0 && index < subcategorias.length) {
            return subcategorias[index];
        }
        return null;
    }
}

module.exports = Categoria;
