const { dbRun, dbGet, dbAll } = require('../config/database');

class Chamado {
    static gerarNumero() {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `TI${timestamp}${random}`;
    }

    static async criar(dados) {
        const numero = this.gerarNumero();
        const {
            telefone_usuario,
            nome_usuario,
            categoria,
            subcategoria,
            sistema,
            descricao,
            urgencia = 'MEDIA'
        } = dados;
        
        const result = await dbRun(
            `INSERT INTO chamados (numero, telefone_usuario, nome_usuario, categoria, subcategoria, sistema, descricao, urgencia)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [numero, telefone_usuario, nome_usuario, categoria, subcategoria, sistema, descricao, urgencia]
        );
        
        return { id: result.lastID, numero };
    }

    static async buscarPorId(id) {
        return await dbGet(`
            SELECT c.*, u.nome as tecnico_nome
            FROM chamados c
            LEFT JOIN usuarios u ON c.atribuido_a = u.id
            WHERE c.id = ?
        `, [id]);
    }

    static async buscarPorNumero(numero) {
        return await dbGet('SELECT * FROM chamados WHERE numero = ?', [numero]);
    }

    static async buscarPorTelefone(telefone) {
        return await dbAll('SELECT * FROM chamados WHERE telefone_usuario = ? ORDER BY criado_em DESC', [telefone]);
    }

    static async listarTodos(filtros = {}) {
        let query = `
            SELECT c.*, u.nome as tecnico_nome
            FROM chamados c
            LEFT JOIN usuarios u ON c.atribuido_a = u.id
            WHERE 1=1
        `;
        const params = [];
        
        if (filtros.status) {
            query += ' AND c.status = ?';
            params.push(filtros.status);
        }
        if (filtros.urgencia) {
            query += ' AND c.urgencia = ?';
            params.push(filtros.urgencia);
        }
        if (filtros.categoria) {
            query += ' AND c.categoria = ?';
            params.push(filtros.categoria);
        }
        if (filtros.atribuido_a) {
            query += ' AND c.atribuido_a = ?';
            params.push(filtros.atribuido_a);
        }
        if (filtros.data_inicio) {
            query += ' AND DATE(c.criado_em) >= ?';
            params.push(filtros.data_inicio);
        }
        if (filtros.data_fim) {
            query += ' AND DATE(c.criado_em) <= ?';
            params.push(filtros.data_fim);
        }
        
        query += ' ORDER BY c.criado_em DESC';
        
        if (filtros.limit) {
            query += ' LIMIT ?';
            params.push(filtros.limit);
        }
        
        return await dbAll(query, params);
    }

    static async atualizarStatus(id, status, usuario_id = null) {
        let updates = 'status = ?, atualizado_em = CURRENT_TIMESTAMP';
        const params = [status];
        
        if (status === 'RESOLVIDO' || status === 'FECHADO') {
            updates += ', resolvido_em = CURRENT_TIMESTAMP';
        }
        
        params.push(id);
        await dbRun(`UPDATE chamados SET ${updates} WHERE id = ?`, params);
        
        // Adicionar nota de mudança de status
        if (usuario_id) {
            await dbRun(
                'INSERT INTO notas (chamado_id, usuario_id, conteudo, tipo) VALUES (?, ?, ?, ?)',
                [id, usuario_id, `Status alterado para ${status}`, 'STATUS']
            );
        }
    }

    static async atribuir(id, tecnico_id, usuario_id = null) {
        await dbRun(
            'UPDATE chamados SET atribuido_a = ?, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?',
            [tecnico_id, id]
        );
        
        if (usuario_id) {
            await dbRun(
                'INSERT INTO notas (chamado_id, usuario_id, conteudo, tipo) VALUES (?, ?, ?, ?)',
                [id, usuario_id, `Chamado atribuído ao técnico ID ${tecnico_id}`, 'ATRIBUICAO']
            );
        }
    }

    static async adicionarNota(chamado_id, usuario_id, conteudo) {
        await dbRun(
            'INSERT INTO notas (chamado_id, usuario_id, conteudo) VALUES (?, ?, ?)',
            [chamado_id, usuario_id, conteudo]
        );
    }

    static async buscarNotas(chamado_id) {
        return await dbAll(`
            SELECT n.*, u.nome as usuario_nome
            FROM notas n
            LEFT JOIN usuarios u ON n.usuario_id = u.id
            WHERE n.chamado_id = ?
            ORDER BY n.criado_em ASC
        `, [chamado_id]);
    }

    // Estatísticas para o Dashboard
    static async contarPorStatus() {
        return await dbAll(`
            SELECT status, COUNT(*) as total
            FROM chamados
            GROUP BY status
        `);
    }

    static async contarPorUrgencia() {
        return await dbAll(`
            SELECT urgencia, COUNT(*) as total
            FROM chamados
            GROUP BY urgencia
        `);
    }

    static async contarPorCategoria() {
        return await dbAll(`
            SELECT categoria, COUNT(*) as total
            FROM chamados
            GROUP BY categoria
            ORDER BY total DESC
        `);
    }

    static async contarPorData(dias = 30) {
        return await dbAll(`
            SELECT DATE(criado_em) as data, COUNT(*) as total
            FROM chamados
            WHERE criado_em >= date('now', '-${dias} days')
            GROUP BY DATE(criado_em)
            ORDER BY data
        `);
    }

    static async tempoMedioResolucao() {
        const result = await dbGet(`
            SELECT AVG(
                (julianday(resolvido_em) - julianday(criado_em)) * 24
            ) as horas_media
            FROM chamados
            WHERE resolvido_em IS NOT NULL
        `);
        return result ? result.horas_media : 0;
    }

    static async resolucaoPorTecnico() {
        return await dbAll(`
            SELECT 
                u.id,
                u.nome,
                COUNT(*) as total_resolvidos,
                AVG((julianday(c.resolvido_em) - julianday(c.criado_em)) * 24) as tempo_medio_horas
            FROM chamados c
            JOIN usuarios u ON c.atribuido_a = u.id
            WHERE c.resolvido_em IS NOT NULL
            GROUP BY u.id, u.nome
            ORDER BY total_resolvidos DESC
        `);
    }

    static async subcategoriasMaisFrequentes(limite = 10) {
        return await dbAll(`
            SELECT categoria, subcategoria, COUNT(*) as total
            FROM chamados
            GROUP BY categoria, subcategoria
            ORDER BY total DESC
            LIMIT ?
        `, [limite]);
    }

    static async totalChamados() {
        const result = await dbGet('SELECT COUNT(*) as total FROM chamados');
        return result ? result.total : 0;
    }
}

module.exports = Chamado;
