const jwt = require('jsonwebtoken');
const env = require('../config/env');
const Usuario = require('../models/Usuario');

// Middleware para verificar JWT em APIs
const verificarToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ erro: 'Token não fornecido' });
    }

    try {
        const decoded = jwt.verify(token, env.jwtSecret);
        const usuario = await Usuario.buscarPorId(decoded.id);
        
        if (!usuario || !usuario.ativo) {
            return res.status(401).json({ erro: 'Usuário inválido ou inativo' });
        }
        
        req.usuario = usuario;
        next();
    } catch (error) {
        return res.status(403).json({ erro: 'Token inválido' });
    }
};

// Middleware para verificar sessão em rotas admin (HTML)
const verificarSessao = async (req, res, next) => {
    if (!req.session || !req.session.usuario) {
        return res.redirect('/admin/login');
    }

    const usuario = await Usuario.buscarPorId(req.session.usuario.id);
    
    if (!usuario || !usuario.ativo) {
        req.session.destroy();
        return res.redirect('/admin/login');
    }
    
    req.usuario = usuario;
    next();
};

// Middleware para verificar se é admin
const verificarAdmin = (req, res, next) => {
    if (req.usuario && req.usuario.role === 'admin') {
        return next();
    }
    
    if (req.headers['accept'] && req.headers['accept'].includes('application/json')) {
        return res.status(403).json({ erro: 'Acesso negado. Permissão de administrador necessária.' });
    }
    
    return res.status(403).send('Acesso negado. Permissão de administrador necessária.');
};

// Gerar token JWT
const gerarToken = (usuario) => {
    return jwt.sign(
        { id: usuario.id, email: usuario.email, role: usuario.role },
        env.jwtSecret,
        { expiresIn: '24h' }
    );
};

module.exports = {
    verificarToken,
    verificarSessao,
    verificarAdmin,
    gerarToken
};
