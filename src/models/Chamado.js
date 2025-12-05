const { runQuery, getOne, getAll } = require('../config/database');

class Chamado {
    // Gerar número único do chamado
    static gerarNumero() {
        const data = new Date();
        const ano = data.getFullYear();
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const dia = String(data.getDate()).padStart(2, '0');
        const hora = String(data.getHours()).padStart(2, '0');
        const min = String(data.getMinutes()).padStart(2, '0');
        const seg = String(data.getSeconds()).padStart(2, '0');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        
        return `CHM${ano}${mes}${dia}${hora}${min}${seg}${random}`;
    }

    // Criar novo chamado
    static async criar(dados) {
        const numero = this.gerarNumero();
        const {
            telefone_usuario,
            nome_usuario,
            categoria,
            subcategoria,
            sistema = null,
            descricao = null,
            urgencia = 'media'
        } = dados;

        const sql = `
            INSERT INTO chamados (numero, telefone_usuario, nome_usuario, categoria, subcategoria, sistema, descricao, urgencia)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const result = await runQuery(sql, [
            numero,
            telefone_usuario,
            nome_usuario,
            categoria,
            subcategoria,
            sistema,
            descricao,
            urgencia
        ]);

        return { id: result.lastID, numero };
    }

    // Buscar chamado por ID
    static async buscarPorId(id) {
        const sql = `
            SELECT c.*, u.nome as tecnico_nome
            FROM chamados c
            LEFT JOIN usuarios u ON c.atribuido_a = u.id
            WHERE c.id = ?
        `;
        return await getOne(sql, [id]);
    }

    // Buscar chamado por número
    static async buscarPorNumero(numero) {
        const sql = `
            SELECT c.*, u.nome as tecnico_nome
            FROM chamados c
            LEFT JOIN usuarios u ON c.atribuido_a = u.id
            WHERE c.numero = ?
        `;
        return await getOne(sql, [numero]);
    }

    // Listar todos os chamados com filtros
    static async listar(filtros = {}) {
        let sql = `
            SELECT c.*, u.nome as tecnico_nome
            FROM chamados c
            LEFT JOIN usuarios u ON c.atribuido_a = u.id
            WHERE 1=1
        `;
        const params = [];

        if (filtros.status) {
            sql += ' AND c.status = ?';
            params.push(filtros.status);
        }

        if (filtros.urgencia) {
            sql += ' AND c.urgencia = ?';
            params.push(filtros.urgencia);
        }

        if (filtros.categoria) {
            sql += ' AND c.categoria = ?';
            params.push(filtros.categoria);
        }

        if (filtros.atribuido_a) {
            sql += ' AND c.atribuido_a = ?';
            params.push(filtros.atribuido_a);
        }

        if (filtros.data_inicio) {
            sql += ' AND DATE(c.criado_em) >= ?';
            params.push(filtros.data_inicio);
        }

        if (filtros.data_fim) {
            sql += ' AND DATE(c.criado_em) <= ?';
            params.push(filtros.data_fim);
        }

        if (filtros.telefone) {
            sql += ' AND c.telefone_usuario LIKE ?';
            params.push(`%${filtros.telefone}%`);
        }

        sql += ' ORDER BY c.criado_em DESC';

        if (filtros.limite) {
            sql += ' LIMIT ?';
            params.push(filtros.limite);
        }

        return await getAll(sql, params);
    }

    // Atualizar chamado
    static async atualizar(id, dados) {
        const campos = [];
        const valores = [];

        const camposPermitidos = [
            'status', 'urgencia', 'atribuido_a', 'descricao',
            'categoria', 'subcategoria', 'sistema'
        ];

        for (const campo of camposPermitidos) {
            if (dados[campo] !== undefined) {
                campos.push(`${campo} = ?`);
                valores.push(dados[campo]);
            }
        }

        // Se o status for resolvido, atualizar data de resolução
        if (dados.status === 'resolvido' || dados.status === 'fechado') {
            campos.push('resolvido_em = CURRENT_TIMESTAMP');
        }

        campos.push('atualizado_em = CURRENT_TIMESTAMP');
        valores.push(id);

        const sql = `UPDATE chamados SET ${campos.join(', ')} WHERE id = ?`;
        return await runQuery(sql, valores);
    }

    // Atribuir chamado a técnico
    static async atribuir(chamadoId, tecnicoId) {
        const sql = `
            UPDATE chamados 
            SET atribuido_a = ?, status = 'em_andamento', atualizado_em = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        return await runQuery(sql, [tecnicoId, chamadoId]);
    }

    // Buscar chamados por telefone do usuário
    static async buscarPorTelefone(telefone) {
        const sql = `
            SELECT * FROM chamados
            WHERE telefone_usuario = ?
            ORDER BY criado_em DESC
        `;
        return await getAll(sql, [telefone]);
    }

    // Estatísticas para dashboard
    static async estatisticas() {
        const stats = {};

        // Total por status
        stats.porStatus = await getAll(`
            SELECT status, COUNT(*) as total 
            FROM chamados 
            GROUP BY status
        `);

        // Total por urgência
        stats.porUrgencia = await getAll(`
            SELECT urgencia, COUNT(*) as total 
            FROM chamados 
            GROUP BY urgencia
        `);

        // Total por categoria
        stats.porCategoria = await getAll(`
            SELECT categoria, COUNT(*) as total 
            FROM chamados 
            GROUP BY categoria
            ORDER BY total DESC
        `);

        // Chamados por dia (últimos 30 dias)
        stats.porDia = await getAll(`
            SELECT DATE(criado_em) as data, COUNT(*) as total 
            FROM chamados 
            WHERE criado_em >= DATE('now', '-30 days')
            GROUP BY DATE(criado_em)
            ORDER BY data
        `);

        // Tempo médio de resolução (em horas)
        const tempoMedio = await getOne(`
            SELECT AVG((JULIANDAY(resolvido_em) - JULIANDAY(criado_em)) * 24) as tempo_medio
            FROM chamados 
            WHERE resolvido_em IS NOT NULL
        `);
        stats.tempoMedioResolucao = tempoMedio ? Math.round(tempoMedio.tempo_medio * 100) / 100 : 0;

        // Taxa de resolução por técnico
        stats.porTecnico = await getAll(`
            SELECT u.nome, 
                   COUNT(*) as total_atribuidos,
                   SUM(CASE WHEN c.status IN ('resolvido', 'fechado') THEN 1 ELSE 0 END) as total_resolvidos
            FROM chamados c
            JOIN usuarios u ON c.atribuido_a = u.id
            GROUP BY c.atribuido_a
            ORDER BY total_resolvidos DESC
        `);

        // Total geral
        const totais = await getOne('SELECT COUNT(*) as total FROM chamados');
        stats.total = totais.total;

        // Abertos hoje
        const hoje = await getOne(`
            SELECT COUNT(*) as total 
            FROM chamados 
            WHERE DATE(criado_em) = DATE('now')
        `);
        stats.abertosHoje = hoje.total;

        return stats;
    }

    // Adicionar nota ao chamado
    static async adicionarNota(chamadoId, usuarioId, conteudo, tipo = 'interna') {
        const sql = `
            INSERT INTO notas (chamado_id, usuario_id, conteudo, tipo)
            VALUES (?, ?, ?, ?)
        `;
        const result = await runQuery(sql, [chamadoId, usuarioId, conteudo, tipo]);
        return result.lastID;
    }

    // Buscar notas do chamado
    static async buscarNotas(chamadoId) {
        const sql = `
            SELECT n.*, u.nome as usuario_nome
            FROM notas n
            LEFT JOIN usuarios u ON n.usuario_id = u.id
            WHERE n.chamado_id = ?
            ORDER BY n.criado_em ASC
        `;
        return await getAll(sql, [chamadoId]);
    }
}

module.exports = Chamado;
