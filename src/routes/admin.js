const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const { verificarSessao, verificarAdmin } = require('../middleware/auth');
const { validarLogin } = require('../middleware/validation');

// Páginas públicas
router.get('/login', AdminController.loginPage);
router.post('/login', validarLogin, AdminController.login);
router.get('/logout', AdminController.logout);

// Páginas protegidas
router.get('/dashboard', verificarSessao, AdminController.dashboardPage);
router.get('/chamados', verificarSessao, AdminController.chamadosPage);
router.get('/usuarios', verificarSessao, verificarAdmin, AdminController.usuariosPage);

// API de sessão
router.get('/me', verificarSessao, AdminController.usuarioLogado);

// Redirect padrão
router.get('/', (req, res) => {
    res.redirect('/admin/login');
});

module.exports = router;
