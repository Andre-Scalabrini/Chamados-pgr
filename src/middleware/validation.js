/**
 * Middleware de validação de dados
 */

/**
 * Valida email
 * @param {string} email 
 * @returns {boolean}
 */
const validarEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};

/**
 * Valida senha (mínimo 6 caracteres)
 * @param {string} senha 
 * @returns {boolean}
 */
const validarSenha = (senha) => {
    return senha && senha.length >= 6;
};

/**
 * Middleware para validar dados de login
 */
const validarLogin = (req, res, next) => {
    const { email, senha } = req.body;
    
    const erros = [];
    
    if (!email || !validarEmail(email)) {
        erros.push('Email inválido');
    }
    
    if (!senha || senha.length < 1) {
        erros.push('Senha é obrigatória');
    }
    
    if (erros.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Dados inválidos',
            errors: erros
        });
    }
    
    next();
};

/**
 * Middleware para validar dados de usuário
 */
const validarUsuario = (req, res, next) => {
    const { nome, email, senha } = req.body;
    const isAtualizacao = req.method === 'PUT';
    
    const erros = [];
    
    if (!isAtualizacao || nome !== undefined) {
        if (!nome || nome.length < 3) {
            erros.push('Nome deve ter no mínimo 3 caracteres');
        }
    }
    
    if (!isAtualizacao || email !== undefined) {
        if (!email || !validarEmail(email)) {
            erros.push('Email inválido');
        }
    }
    
    if (!isAtualizacao && senha !== undefined) {
        if (!validarSenha(senha)) {
            erros.push('Senha deve ter no mínimo 6 caracteres');
        }
    }
    
    if (isAtualizacao && senha !== undefined && senha !== '') {
        if (!validarSenha(senha)) {
            erros.push('Senha deve ter no mínimo 6 caracteres');
        }
    }
    
    if (erros.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Dados inválidos',
            errors: erros
        });
    }
    
    next();
};

/**
 * Middleware para validar dados de chamado
 */
const validarChamado = (req, res, next) => {
    const { status, urgencia, atribuido_a } = req.body;
    
    const erros = [];
    
    const statusValidos = ['aberto', 'em_andamento', 'resolvido', 'fechado'];
    const urgenciasValidas = ['critica', 'alta', 'media', 'baixa'];
    
    if (status !== undefined && !statusValidos.includes(status)) {
        erros.push('Status inválido');
    }
    
    if (urgencia !== undefined && !urgenciasValidas.includes(urgencia)) {
        erros.push('Urgência inválida');
    }
    
    if (atribuido_a !== undefined && atribuido_a !== null && typeof atribuido_a !== 'number') {
        erros.push('Técnico inválido');
    }
    
    if (erros.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Dados inválidos',
            errors: erros
        });
    }
    
    next();
};

/**
 * Middleware para validar nota
 */
const validarNota = (req, res, next) => {
    const { conteudo } = req.body;
    
    if (!conteudo || conteudo.trim().length < 1) {
        return res.status(400).json({
            success: false,
            message: 'Conteúdo da nota é obrigatório'
        });
    }
    
    next();
};

/**
 * Sanitiza string para prevenir XSS
 * @param {string} str 
 * @returns {string}
 */
const sanitizarString = (str) => {
    if (typeof str !== 'string') return str;
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
};

/**
 * Middleware para sanitizar body
 */
const sanitizarBody = (req, res, next) => {
    if (req.body) {
        for (const key in req.body) {
            if (typeof req.body[key] === 'string') {
                req.body[key] = req.body[key].trim();
            }
        }
    }
    next();
};

module.exports = {
    validarLogin,
    validarUsuario,
    validarChamado,
    validarNota,
    sanitizarBody,
    sanitizarString,
    validarEmail,
    validarSenha
};
