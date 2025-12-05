const jwt = require('jsonwebtoken');
const config = require('../config/env');
const Usuario = require('../models/Usuario');

/**
 * Middleware de autenticação via JWT
 */
const autenticarJWT = async (req, res, next) => {
    try {
        // Verificar header de autorização
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Token de autenticação não fornecido'
            });
        }
        
        const token = authHeader.split(' ')[1];
        
        // Verificar token
        const decoded = jwt.verify(token, config.jwtSecret);
        
        // Buscar usuário
        const usuario = await Usuario.buscarPorId(decoded.id);
        
        if (!usuario) {
            return res.status(401).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }
        
        if (!usuario.ativo) {
            return res.status(401).json({
                success: false,
                message: 'Usuário desativado'
            });
        }
        
        // Adicionar usuário ao request
        req.usuario = usuario;
        next();
        
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Token inválido'
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expirado'
            });
        }
        
        console.error('Erro na autenticação:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

/**
 * Middleware de autenticação via sessão (para painel admin)
 */
const autenticarSessao = (req, res, next) => {
    if (!req.session || !req.session.usuario) {
        // Se for requisição AJAX, retornar JSON
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(401).json({
                success: false,
                message: 'Não autenticado'
            });
        }
        // Redirecionar para login
        return res.redirect('/admin/login');
    }
    
    req.usuario = req.session.usuario;
    next();
};

/**
 * Middleware para verificar se é admin
 */
const apenasAdmin = (req, res, next) => {
    if (!req.usuario || req.usuario.role !== 'admin') {
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado. Apenas administradores.'
            });
        }
        return res.status(403).send('Acesso negado');
    }
    next();
};

/**
 * Gerar token JWT
 */
const gerarToken = (usuario) => {
    return jwt.sign(
        { id: usuario.id, email: usuario.email, role: usuario.role },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
    );
};

module.exports = {
    autenticarJWT,
    autenticarSessao,
    apenasAdmin,
    gerarToken
};
