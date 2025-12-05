const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const config = require('./config/env');
const { initDatabase } = require('./config/database');
const adminRoutes = require('./routes/admin');
const apiRoutes = require('./routes/api');

const app = express();

// Rate limiting para prevenir ataques de força bruta
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo de 100 requisições por IP
    message: {
        success: false,
        message: 'Muitas requisições. Tente novamente em 15 minutos.'
    }
});

// Rate limiting mais restritivo para login
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // máximo de 5 tentativas de login por IP
    message: {
        success: false,
        message: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
    }
});

// Middleware
app.use(limiter);
app.use(cors({
    origin: config.nodeEnv === 'production' ? false : true,
    credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configurar sessão com cookie seguro
app.use(session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: config.nodeEnv === 'production',
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
}));

// Arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Aplicar rate limiting mais restritivo para rotas de login
app.use('/admin/login', loginLimiter);
app.use('/api/auth/login', loginLimiter);

// Rotas
app.use('/admin', adminRoutes);
app.use('/api', apiRoutes);

// Rota raiz - redirecionar para admin
app.get('/', (req, res) => {
    res.redirect('/admin/login');
});

// Tratamento de erros 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Rota não encontrada'
    });
});

// Tratamento de erros gerais
app.use((err, req, res, next) => {
    console.error('Erro:', err);
    res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
    });
});

// Inicializar banco de dados
const initApp = async () => {
    try {
        await initDatabase();
        console.log('✅ Aplicação inicializada');
    } catch (error) {
        console.error('❌ Erro ao inicializar aplicação:', error);
        throw error;
    }
};

module.exports = { app, initApp };
