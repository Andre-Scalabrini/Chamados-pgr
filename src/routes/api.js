const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');
const whatsappController = require('../controllers/whatsappController');
const { autenticarJWT } = require('../middleware/auth');
const { validarLogin, validarChamado, sanitizarBody } = require('../middleware/validation');

// Sanitizar todas as requisições
router.use(sanitizarBody);

// ============================================
// ROTAS PÚBLICAS
// ============================================

// Health check
router.get('/health', apiController.healthCheck);

// Login
router.post('/auth/login', validarLogin, apiController.login);

// Status do WhatsApp
router.get('/whatsapp/status', whatsappController.getStatus);

// ============================================
// ROTAS PROTEGIDAS (requer JWT)
// ============================================

// Chamados
router.get('/chamados', autenticarJWT, apiController.listarChamados);
router.get('/chamados/:id', autenticarJWT, apiController.getChamado);
router.put('/chamados/:id', autenticarJWT, validarChamado, apiController.atualizarChamado);

// Estatísticas
router.get('/estatisticas', autenticarJWT, apiController.getEstatisticas);

// Categorias
router.get('/categorias', autenticarJWT, apiController.listarCategorias);

// Técnicos
router.get('/tecnicos', autenticarJWT, apiController.listarTecnicos);

module.exports = router;
