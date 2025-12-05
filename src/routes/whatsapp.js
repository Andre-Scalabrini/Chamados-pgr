const express = require('express');
const router = express.Router();
const WhatsAppController = require('../controllers/whatsappController');

// Webhook do Twilio - recebe mensagens
router.post('/webhook/whatsapp', WhatsAppController.receberMensagem);

// Endpoint alternativo para compatibilidade
router.post('/incoming', WhatsAppController.receberMensagem);

module.exports = router;
