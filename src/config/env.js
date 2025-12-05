require('dotenv').config();

module.exports = {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    jwtSecret: process.env.JWT_SECRET || 'default_secret_key_change_in_production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    sessionSecret: process.env.SESSION_SECRET || 'default_session_secret_change_in_production',
    databasePath: process.env.DATABASE_PATH || './database/chamados.db',
    whatsappSessionPath: process.env.WHATSAPP_SESSION_PATH || './whatsapp-session'
};
