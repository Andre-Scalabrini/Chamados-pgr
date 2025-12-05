require('dotenv').config();

module.exports = {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    jwtSecret: process.env.JWT_SECRET || 'default_jwt_secret_change_me',
    sessionSecret: process.env.SESSION_SECRET || 'default_session_secret_change_me',
    databasePath: process.env.DATABASE_PATH || './database/chamados.db',
    twilio: {
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN,
        whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER
    }
};
