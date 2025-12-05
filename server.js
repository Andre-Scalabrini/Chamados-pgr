const { app, initApp } = require('./src/app');
const config = require('./src/config/env');
const { initWhatsAppClient, getClient } = require('./src/config/whatsapp-client');
const whatsappController = require('./src/controllers/whatsappController');

const PORT = config.port;

// Iniciar servidor
const startServer = async () => {
    try {
        // Inicializar aplicação (banco de dados, etc)
        await initApp();
        
        // Iniciar servidor HTTP
        const server = app.listen(PORT, () => {
            console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🖥️  SISTEMA DE CHAMADOS T.I                              ║
║                                                            ║
║   Servidor rodando em: http://localhost:${PORT}              ║
║   Painel Admin: http://localhost:${PORT}/admin               ║
║                                                            ║
║   Credenciais padrão:                                      ║
║   Email: admin@admin.com                                   ║
║   Senha: admin123                                          ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
            `);
        });
        
        // Inicializar WhatsApp (em background)
        console.log('\n📱 Iniciando conexão com WhatsApp...\n');
        
        initWhatsAppClient()
            .then(() => {
                // Configurar handler de mensagens após conexão
                whatsappController.inicializarHandler();
            })
            .catch(error => {
                console.error('⚠️  Aviso: WhatsApp não conectado:', error.message);
                console.log('O sistema continua funcionando. Escaneie o QR Code quando aparecer.');
            });
        
        // Graceful shutdown
        process.on('SIGTERM', () => {
            console.log('\n🛑 Recebido SIGTERM. Encerrando servidor...');
            server.close(() => {
                console.log('✅ Servidor encerrado');
                process.exit(0);
            });
        });
        
        process.on('SIGINT', () => {
            console.log('\n🛑 Recebido SIGINT. Encerrando servidor...');
            server.close(() => {
                console.log('✅ Servidor encerrado');
                process.exit(0);
            });
        });
        
    } catch (error) {
        console.error('❌ Erro ao iniciar servidor:', error);
        process.exit(1);
    }
};

startServer();
