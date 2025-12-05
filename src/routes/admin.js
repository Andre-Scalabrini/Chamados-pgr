const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { autenticarSessao, apenasAdmin } = require('../middleware/auth');
const { validarLogin, validarUsuario, validarChamado, validarNota, sanitizarBody } = require('../middleware/validation');

// Sanitizar todas as requisições
router.use(sanitizarBody);

// ============================================
// ROTAS PÚBLICAS (sem autenticação)
// ============================================

// Página de login
router.get('/login', adminController.renderLogin);

// Processar login
router.post('/login', validarLogin, adminController.processarLogin);

// ============================================
// ROTAS PROTEGIDAS (requer autenticação)
// ============================================

// Logout
router.get('/logout', adminController.logout);

// Dashboard
router.get('/dashboard', autenticarSessao, adminController.renderDashboard);
router.get('/api/dashboard', autenticarSessao, adminController.getDashboard);

// Página de chamados
router.get('/chamados', autenticarSessao, adminController.renderChamados);

// API de chamados
router.get('/api/chamados', autenticarSessao, adminController.listarChamados);
router.get('/api/chamados/:id', autenticarSessao, adminController.getChamado);
router.put('/api/chamados/:id', autenticarSessao, validarChamado, adminController.atualizarChamado);
router.post('/api/chamados/:id/atribuir', autenticarSessao, adminController.atribuirChamado);
router.post('/api/chamados/:id/notas', autenticarSessao, validarNota, adminController.adicionarNota);

// API de técnicos
router.get('/api/tecnicos', autenticarSessao, adminController.listarTecnicos);

// API de categorias
router.get('/api/categorias', autenticarSessao, adminController.listarCategorias);

// Usuário logado
router.get('/api/me', autenticarSessao, adminController.getUsuarioLogado);

// ============================================
// ROTAS DE ADMIN (requer role admin)
// ============================================

// Página de usuários
router.get('/usuarios', autenticarSessao, apenasAdmin, adminController.renderUsuarios);

// API de usuários
router.get('/api/usuarios', autenticarSessao, apenasAdmin, adminController.listarUsuarios);
router.get('/api/usuarios/:id', autenticarSessao, apenasAdmin, adminController.getUsuario);
router.post('/api/usuarios', autenticarSessao, apenasAdmin, validarUsuario, adminController.criarUsuario);
router.put('/api/usuarios/:id', autenticarSessao, apenasAdmin, validarUsuario, adminController.atualizarUsuario);
router.delete('/api/usuarios/:id', autenticarSessao, apenasAdmin, adminController.deletarUsuario);

// Redirecionar raiz do admin para dashboard
router.get('/', (req, res) => {
    res.redirect('/admin/dashboard');
});

module.exports = router;
