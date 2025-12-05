require('dotenv').config();

const nodeEnv = process.env.NODE_ENV || 'development';

// In production, require JWT_SECRET and SESSION_SECRET to be set
if (nodeEnv === 'production') {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET environment variable is required in production');
    }
    if (!process.env.SESSION_SECRET) {
        throw new Error('SESSION_SECRET environment variable is required in production');
    }
}

module.exports = {
    port: process.env.PORT || 3000,
    nodeEnv,
    jwtSecret: process.env.JWT_SECRET || 'dev_secret_key_not_for_production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    sessionSecret: process.env.SESSION_SECRET || 'dev_session_secret_not_for_production',
    databasePath: process.env.DATABASE_PATH || './database/chamados.db',
    whatsappSessionPath: process.env.WHATSAPP_SESSION_PATH || './whatsapp-session'
};
