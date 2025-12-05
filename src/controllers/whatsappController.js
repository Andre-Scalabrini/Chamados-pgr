const { getClient, getIsReady, getInitializationError } = require('../config/whatsapp-client');
const whatsappService = require('../services/whatsappService');

/**
 * Inicializa o handler de mensagens do WhatsApp
 */
const inicializarHandler = () => {
    const client = getClient();
    
    if (!client) {
        console.error('Cliente WhatsApp não inicializado');
        return;
    }
    
    // Handler de mensagens
    client.on('message', async (message) => {
        try {
            // Ignorar mensagens de grupo
            if (message.from.includes('@g.us')) {
                return;
            }
            
            // Ignorar mensagens do próprio bot
            if (message.fromMe) {
                return;
            }
            
            console.log(`📩 Mensagem recebida de ${message.from}: ${message.body}`);
            
            // Processar mensagem
            const resposta = await whatsappService.processarMensagem(message);
            
            if (resposta) {
                await message.reply(resposta);
                console.log(`📤 Resposta enviada para ${message.from}`);
            }
            
        } catch (error) {
            console.error('Erro ao processar mensagem:', error);
            
            try {
                await message.reply(
                    '❌ Desculpe, ocorreu um erro ao processar sua mensagem.\n\n' +
                    'Por favor, tente novamente ou digite *MENU* para reiniciar.'
                );
            } catch (replyError) {
                console.error('Erro ao enviar mensagem de erro:', replyError);
            }
        }
    });
    
    // Handler de mensagem criada (enviada pelo bot)
    client.on('message_create', (message) => {
        if (message.fromMe) {
            console.log(`📤 Mensagem enviada: ${message.body.substring(0, 50)}...`);
        }
    });
    
    console.log('✅ Handler de mensagens WhatsApp inicializado');
};

/**
 * Retorna o status do WhatsApp
 */
const getStatus = (req, res) => {
    const isReady = getIsReady();
    const error = getInitializationError();
    
    res.json({
        success: true,
        status: isReady ? 'connected' : 'disconnected',
        message: isReady ? 'WhatsApp conectado' : (error || 'WhatsApp desconectado'),
        error: error || null
    });
};

module.exports = {
    inicializarHandler,
    getStatus
};
