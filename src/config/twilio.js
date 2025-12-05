const env = require('./env');

let twilioClient = null;

// Only initialize Twilio if credentials are provided
if (env.twilio.accountSid && env.twilio.authToken) {
    const twilio = require('twilio');
    twilioClient = twilio(env.twilio.accountSid, env.twilio.authToken);
}

const sendWhatsAppMessage = async (to, body) => {
    if (!twilioClient) {
        console.log('[DEV] Mensagem WhatsApp (sem Twilio configurado):', { to, body });
        return { sid: 'mock_sid_' + Date.now() };
    }

    try {
        const message = await twilioClient.messages.create({
            body: body,
            from: env.twilio.whatsappNumber,
            to: to.startsWith('whatsapp:') ? to : `whatsapp:${to}`
        });
        return message;
    } catch (error) {
        console.error('Erro ao enviar mensagem WhatsApp:', error);
        throw error;
    }
};

module.exports = {
    twilioClient,
    sendWhatsAppMessage
};
