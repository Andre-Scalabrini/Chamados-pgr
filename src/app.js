const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const env = require('./config/env');
const { initDatabase } = require('./config/database');

// Routes
const whatsappRoutes = require('./routes/whatsapp');
const adminRoutes = require('./routes/admin');
const apiRoutes = require('./routes/api');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    secret: env.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: env.nodeEnv === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', whatsappRoutes);
app.use('/admin', adminRoutes);
app.use('/api', apiRoutes);

// Root redirect
app.get('/', (req, res) => {
    res.redirect('/admin/login');
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Erro:', err);
    res.status(500).json({ erro: 'Erro interno do servidor' });
});

// Initialize database and export
const initApp = async () => {
    await initDatabase();
    return app;
};

module.exports = { app, initApp };
