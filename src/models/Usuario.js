const { runQuery, getOne, getAll } = require('../config/database');
const bcrypt = require('bcryptjs');

class Usuario {
    // Criar novo usuário
    static async criar(dados) {
        const { nome, email, senha, role = 'tecnico' } = dados;
        
        // Hash da senha
        const senhaHash = await bcrypt.hash(senha, 10);
        
        const sql = `
            INSERT INTO usuarios (nome, email, senha, role)
            VALUES (?, ?, ?, ?)
        `;
        
        const result = await runQuery(sql, [nome, email, senhaHash, role]);
        return result.lastID;
    }

    // Buscar usuário por ID
    static async buscarPorId(id) {
        const sql = 'SELECT id, nome, email, role, ativo, criado_em FROM usuarios WHERE id = ?';
        return await getOne(sql, [id]);
    }

    // Buscar usuário por email
    static async buscarPorEmail(email) {
        const sql = 'SELECT * FROM usuarios WHERE email = ?';
        return await getOne(sql, [email]);
    }

    // Listar todos os usuários
    static async listarTodos() {
        const sql = 'SELECT id, nome, email, role, ativo, criado_em FROM usuarios ORDER BY nome';
        return await getAll(sql);
    }

    // Listar apenas técnicos ativos
    static async listarTecnicos() {
        const sql = `
            SELECT id, nome, email, role, criado_em 
            FROM usuarios 
            WHERE ativo = 1 
            ORDER BY nome
        `;
        return await getAll(sql);
    }

    // Atualizar usuário
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
        if (dados.senha) {
            const senhaHash = await bcrypt.hash(dados.senha, 10);
            campos.push('senha = ?');
            valores.push(senhaHash);
        }
        if (dados.role) {
            campos.push('role = ?');
            valores.push(dados.role);
        }
        if (typeof dados.ativo !== 'undefined') {
            campos.push('ativo = ?');
            valores.push(dados.ativo ? 1 : 0);
        }

        campos.push('atualizado_em = CURRENT_TIMESTAMP');
        valores.push(id);

        const sql = `UPDATE usuarios SET ${campos.join(', ')} WHERE id = ?`;
        return await runQuery(sql, valores);
    }

    // Deletar usuário (soft delete - desativar)
    static async deletar(id) {
        const sql = 'UPDATE usuarios SET ativo = 0, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?';
        return await runQuery(sql, [id]);
    }

    // Deletar usuário permanentemente
    static async deletarPermanente(id) {
        const sql = 'DELETE FROM usuarios WHERE id = ?';
        return await runQuery(sql, [id]);
    }

    // Verificar senha
    static async verificarSenha(senha, senhaHash) {
        return await bcrypt.compare(senha, senhaHash);
    }

    // Autenticar usuário
    static async autenticar(email, senha) {
        const usuario = await this.buscarPorEmail(email);
        
        if (!usuario) {
            return null;
        }

        if (!usuario.ativo) {
            return null;
        }

        const senhaValida = await this.verificarSenha(senha, usuario.senha);
        
        if (!senhaValida) {
            return null;
        }

        // Retornar usuário sem a senha
        const { senha: _, ...usuarioSemSenha } = usuario;
        return usuarioSemSenha;
    }
}

module.exports = Usuario;
