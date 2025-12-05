const { app, initApp } = require('./src/app');
const env = require('./src/config/env');

const PORT = env.port;

initApp().then(() => {
    app.listen(PORT, () => {
        console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🎫 Sistema de Chamados T.I via WhatsApp                ║
║                                                           ║
║   Servidor rodando em: http://localhost:${PORT}            ║
║                                                           ║
║   Endpoints:                                              ║
║   - Admin Panel: http://localhost:${PORT}/admin           ║
║   - API: http://localhost:${PORT}/api                     ║
║   - WhatsApp Webhook: POST /webhook/whatsapp              ║
║                                                           ║
║   Credenciais padrão:                                     ║
║   - Email: admin@empresa.com                              ║
║   - Senha: admin123                                       ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
        `);
    });
}).catch(err => {
    console.error('Erro ao iniciar servidor:', err);
    process.exit(1);
});
