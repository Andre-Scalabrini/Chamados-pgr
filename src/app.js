const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const config = require('./config/env');
const { initDatabase } = require('./config/database');
const adminRoutes = require('./routes/admin');
const apiRoutes = require('./routes/api');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configurar sessão
app.use(session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: config.nodeEnv === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
}));

// Arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

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
