const express = require('express');
const router = express.Router();
const ApiController = require('../controllers/apiController');
const WhatsAppController = require('../controllers/whatsappController');
const { verificarSessao, verificarToken, verificarAdmin } = require('../middleware/auth');
const { validarUsuario, validarStatusChamado, validarNota, sanitizarBody } = require('../middleware/validation');

// Middleware para aceitar sessão ou token
const autenticar = async (req, res, next) => {
    // Tentar sessão primeiro
    if (req.session && req.session.usuario) {
        const Usuario = require('../models/Usuario');
        req.usuario = await Usuario.buscarPorId(req.session.usuario.id);
        if (req.usuario && req.usuario.ativo) {
            return next();
        }
    }
    
    // Tentar token JWT
    return verificarToken(req, res, next);
};

// Aplicar sanitização em todas as rotas
router.use(sanitizarBody);

// ============== CHAMADOS ==============
router.get('/chamados', autenticar, ApiController.listarChamados);
router.get('/chamados/:id', autenticar, ApiController.buscarChamado);
router.patch('/chamados/:id/status', autenticar, validarStatusChamado, ApiController.atualizarStatusChamado);
router.patch('/chamados/:id/atribuir', autenticar, ApiController.atribuirChamado);
router.post('/chamados/:id/notas', autenticar, validarNota, ApiController.adicionarNota);

// ============== DASHBOARD ==============
router.get('/dashboard/estatisticas', autenticar, ApiController.estatisticasDashboard);

// ============== USUÁRIOS ==============
router.get('/usuarios', autenticar, verificarAdmin, ApiController.listarUsuarios);
router.post('/usuarios', autenticar, verificarAdmin, validarUsuario, ApiController.criarUsuario);
router.put('/usuarios/:id', autenticar, verificarAdmin, ApiController.atualizarUsuario);
router.delete('/usuarios/:id', autenticar, verificarAdmin, ApiController.deletarUsuario);

// ============== TÉCNICOS ==============
router.get('/tecnicos', autenticar, ApiController.listarTecnicos);

// ============== CATEGORIAS ==============
router.get('/categorias', autenticar, ApiController.listarCategorias);

// ============== WHATSAPP (para testes) ==============
router.post('/whatsapp/enviar', autenticar, WhatsAppController.enviarMensagem);
router.post('/whatsapp/simular', autenticar, WhatsAppController.simularMensagem);

module.exports = router;
