const { dbRun, dbGet, dbAll } = require('../config/database');

class Categoria {
    static async listarTodas() {
        return await dbAll('SELECT * FROM categorias ORDER BY ordem');
    }

    static async buscarPorId(id) {
        return await dbGet('SELECT * FROM categorias WHERE id = ?', [id]);
    }

    static async listarSubcategorias(categoria_id) {
        return await dbAll('SELECT * FROM subcategorias WHERE categoria_id = ? ORDER BY nome', [categoria_id]);
    }

    static async buscarSubcategoria(id) {
        return await dbGet('SELECT * FROM subcategorias WHERE id = ?', [id]);
    }

    static async buscarSubcategoriaPorNome(categoria_id, nome) {
        return await dbGet(
            'SELECT * FROM subcategorias WHERE categoria_id = ? AND nome = ?',
            [categoria_id, nome]
        );
    }

    // Retorna as categorias formatadas para exibição no WhatsApp
    static async getMenuFormatado() {
        const categorias = await this.listarTodas();
        let menu = '📋 *MENU DE CATEGORIAS*\n\n';
        menu += 'Selecione o número da categoria do seu problema:\n\n';
        
        categorias.forEach((cat, index) => {
            menu += `${cat.emoji} *${index + 1}.* ${cat.nome}\n`;
        });
        
        menu += '\n_Responda apenas com o número da opção desejada._';
        return menu;
    }

    static async getSubcategoriasFormatadas(categoria_id) {
        const categoria = await this.buscarPorId(categoria_id);
        const subcategorias = await this.listarSubcategorias(categoria_id);
        
        let menu = `${categoria.emoji} *${categoria.nome}*\n\n`;
        menu += 'Selecione o problema específico:\n\n';
        
        subcategorias.forEach((sub, index) => {
            menu += `*${index + 1}.* ${sub.nome}\n`;
        });
        
        menu += '\n*0.* ↩️ Voltar ao menu principal\n';
        menu += '\n_Responda apenas com o número da opção._';
        return menu;
    }

    static categoriasData() {
        return [
            { id: 1, nome: 'Computador / Notebook', emoji: '🖥️', requerSistema: false },
            { id: 2, nome: 'Rede / Internet', emoji: '🌐', requerSistema: false },
            { id: 3, nome: 'Impressoras', emoji: '🖨️', requerSistema: false },
            { id: 4, nome: 'Acessos e Usuários', emoji: '🔐', requerSistema: false },
            { id: 5, nome: 'Sistemas', emoji: '💻', requerSistema: true },
            { id: 6, nome: 'E-mail', emoji: '📧', requerSistema: false },
            { id: 7, nome: 'Equipamentos (Periféricos)', emoji: '🧰', requerSistema: false },
            { id: 8, nome: 'Telefonia / Ramal', emoji: '☎️', requerSistema: false },
            { id: 9, nome: 'Pastas, Servidores e Permissões', emoji: '📁', requerSistema: false },
            { id: 10, nome: 'Solicitações Gerais', emoji: '🛠️', requerSistema: false },
            { id: 11, nome: 'Outros', emoji: '❓', requerSistema: false }
        ];
    }
}

module.exports = Categoria;
