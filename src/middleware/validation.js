// Middleware de validação de dados

// Valida dados de login
const validarLogin = (req, res, next) => {
    const { email, senha } = req.body;
    
    if (!email || !senha) {
        return res.status(400).json({ erro: 'Email e senha são obrigatórios' });
    }
    
    if (!email.includes('@')) {
        return res.status(400).json({ erro: 'Email inválido' });
    }
    
    next();
};

// Valida dados de criação de usuário
const validarUsuario = (req, res, next) => {
    const { nome, email, senha } = req.body;
    
    if (!nome || nome.length < 3) {
        return res.status(400).json({ erro: 'Nome deve ter pelo menos 3 caracteres' });
    }
    
    if (!email || !email.includes('@')) {
        return res.status(400).json({ erro: 'Email inválido' });
    }
    
    if (!senha || senha.length < 6) {
        return res.status(400).json({ erro: 'Senha deve ter pelo menos 6 caracteres' });
    }
    
    next();
};

// Valida atualização de status do chamado
const validarStatusChamado = (req, res, next) => {
    const statusValidos = ['ABERTO', 'EM_ANDAMENTO', 'RESOLVIDO', 'FECHADO'];
    const { status } = req.body;
    
    if (status && !statusValidos.includes(status)) {
        return res.status(400).json({ 
            erro: 'Status inválido', 
            statusValidos 
        });
    }
    
    next();
};

// Valida nota do chamado
const validarNota = (req, res, next) => {
    const { conteudo } = req.body;
    
    if (!conteudo || conteudo.length < 3) {
        return res.status(400).json({ erro: 'Conteúdo da nota deve ter pelo menos 3 caracteres' });
    }
    
    next();
};

// Sanitiza strings para prevenir XSS básico
const sanitizarString = (str) => {
    if (typeof str !== 'string') return str;
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
};

// Middleware para sanitizar body
const sanitizarBody = (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
        for (const key in req.body) {
            if (typeof req.body[key] === 'string') {
                req.body[key] = sanitizarString(req.body[key]);
            }
        }
    }
    next();
};

module.exports = {
    validarLogin,
    validarUsuario,
    validarStatusChamado,
    validarNota,
    sanitizarBody,
    sanitizarString
};
