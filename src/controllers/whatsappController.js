const WhatsAppService = require('../services/whatsappService');

/**
 * Controller para processar mensagens do WhatsApp via Twilio
 */
class WhatsAppController {
    /**
     * Webhook para receber mensagens do Twilio
     * POST /webhook/whatsapp
     */
    static async receberMensagem(req, res) {
        try {
            // Dados vindos do Twilio
            const telefone = req.body.From || req.body.from;
            const mensagem = req.body.Body || req.body.body;
            const nomeUsuario = req.body.ProfileName || req.body.profileName;

            if (!telefone || !mensagem) {
                console.log('Requisição inválida:', req.body);
                return res.status(400).send('Dados incompletos');
            }

            console.log(`[WhatsApp] Mensagem de ${telefone}: ${mensagem}`);

            // Processar a mensagem
            await WhatsAppService.processarMensagem(telefone, mensagem, nomeUsuario);

            // Twilio espera uma resposta TwiML vazia ou com conteúdo
            res.type('text/xml');
            res.send('<Response></Response>');
        } catch (error) {
            console.error('Erro ao processar mensagem WhatsApp:', error);
            res.status(500).send('Erro interno');
        }
    }

    /**
     * Endpoint para enviar mensagem manualmente (para testes ou notificações)
     * POST /api/whatsapp/enviar
     */
    static async enviarMensagem(req, res) {
        try {
            const { telefone, mensagem } = req.body;

            if (!telefone || !mensagem) {
                return res.status(400).json({ erro: 'Telefone e mensagem são obrigatórios' });
            }

            const { sendWhatsAppMessage } = require('../config/twilio');
            const result = await sendWhatsAppMessage(telefone, mensagem);

            res.json({ 
                sucesso: true, 
                mensagem: 'Mensagem enviada com sucesso',
                sid: result.sid 
            });
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            res.status(500).json({ erro: 'Erro ao enviar mensagem' });
        }
    }

    /**
     * Simular recebimento de mensagem (para testes locais)
     * POST /api/whatsapp/simular
     */
    static async simularMensagem(req, res) {
        try {
            const { telefone, mensagem, nome } = req.body;

            if (!telefone || !mensagem) {
                return res.status(400).json({ erro: 'Telefone e mensagem são obrigatórios' });
            }

            // Processar como se fosse uma mensagem real
            await WhatsAppService.processarMensagem(telefone, mensagem, nome);

            res.json({ 
                sucesso: true, 
                mensagem: 'Mensagem processada com sucesso (simulação)' 
            });
        } catch (error) {
            console.error('Erro na simulação:', error);
            res.status(500).json({ erro: 'Erro ao simular mensagem' });
        }
    }
}

module.exports = WhatsAppController;
