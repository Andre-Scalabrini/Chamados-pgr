const { dbRun, dbGet, dbAll } = require('../config/database');
const bcrypt = require('bcryptjs');

class Usuario {
    static async criar(dados) {
        const { nome, email, senha, role = 'tecnico' } = dados;
        const senhaHash = await bcrypt.hash(senha, 10);
        
        const result = await dbRun(
            `INSERT INTO usuarios (nome, email, senha, role) VALUES (?, ?, ?, ?)`,
            [nome, email, senhaHash, role]
        );
        
        return result.lastID;
    }

    static async buscarPorId(id) {
        return await dbGet('SELECT id, nome, email, role, ativo, criado_em FROM usuarios WHERE id = ?', [id]);
    }

    static async buscarPorEmail(email) {
        return await dbGet('SELECT * FROM usuarios WHERE email = ?', [email]);
    }

    static async verificarSenha(senha, senhaHash) {
        return await bcrypt.compare(senha, senhaHash);
    }

    static async listarTodos() {
        return await dbAll('SELECT id, nome, email, role, ativo, criado_em FROM usuarios ORDER BY nome');
    }

    static async listarTecnicos() {
        return await dbAll('SELECT id, nome, email, role, ativo FROM usuarios WHERE ativo = 1 ORDER BY nome');
    }

    static async atualizar(id, dados) {
        const campos = [];
        const valores = [];
        
        if (dados.nome) {
            campos.push('nome = ?');
            valores.push(dados.nome);
        }
        if (dados.email) {
            campos.push('email = ?');
            valores.push(dados.email);
        }
        if (dados.role) {
            campos.push('role = ?');
            valores.push(dados.role);
        }
        if (dados.ativo !== undefined) {
            campos.push('ativo = ?');
            valores.push(dados.ativo ? 1 : 0);
        }
        if (dados.senha) {
            campos.push('senha = ?');
            valores.push(await bcrypt.hash(dados.senha, 10));
        }
        
        campos.push('atualizado_em = CURRENT_TIMESTAMP');
        valores.push(id);
        
        await dbRun(`UPDATE usuarios SET ${campos.join(', ')} WHERE id = ?`, valores);
    }

    static async deletar(id) {
        await dbRun('UPDATE usuarios SET ativo = 0 WHERE id = ?', [id]);
    }
}

module.exports = Usuario;
