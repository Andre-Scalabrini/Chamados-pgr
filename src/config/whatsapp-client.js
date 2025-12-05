const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const path = require('path');
const config = require('./env');

let client = null;
let isReady = false;
let qrCodeData = null;
let initializationError = null;

const initWhatsAppClient = () => {
    return new Promise((resolve, reject) => {
        try {
            client = new Client({
                authStrategy: new LocalAuth({
                    dataPath: config.whatsappSessionPath
                }),
                puppeteer: {
                    headless: true,
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-accelerated-2d-canvas',
                        '--no-first-run',
                        '--no-zygote',
                        '--disable-gpu'
                    ]
                }
            });

            client.on('qr', (qr) => {
                console.log('\n📱 Escaneie o QR Code abaixo para conectar o WhatsApp:');
                qrcode.generate(qr, { small: true });
                qrCodeData = qr;
            });

            client.on('ready', () => {
                console.log('✅ WhatsApp Client está pronto!');
                isReady = true;
                qrCodeData = null;
                initializationError = null;
                resolve(client);
            });

            client.on('authenticated', () => {
                console.log('🔐 WhatsApp autenticado com sucesso!');
            });

            client.on('auth_failure', (msg) => {
                console.error('❌ Falha na autenticação do WhatsApp:', msg);
                isReady = false;
                initializationError = 'Falha na autenticação';
                reject(new Error('Falha na autenticação'));
            });

            client.on('disconnected', (reason) => {
                console.log('📴 WhatsApp desconectado:', reason);
                isReady = false;
            });

            console.log('🚀 Inicializando cliente WhatsApp...');
            
            // Inicializar e capturar erros de inicialização
            client.initialize().catch(error => {
                console.error('❌ Erro na inicialização do WhatsApp:', error.message);
                initializationError = error.message;
                isReady = false;
                reject(error);
            });

        } catch (error) {
            console.error('Erro ao inicializar WhatsApp Client:', error);
            initializationError = error.message;
            reject(error);
        }
    });
};

const getClient = () => client;
const getIsReady = () => isReady;
const getQRCode = () => qrCodeData;
const getInitializationError = () => initializationError;

const sendMessage = async (phoneNumber, message) => {
    if (!client || !isReady) {
        throw new Error('Cliente WhatsApp não está pronto');
    }
    
    // Formatar número para o formato do WhatsApp
    const formattedNumber = phoneNumber.includes('@c.us') 
        ? phoneNumber 
        : `${phoneNumber.replace(/\D/g, '')}@c.us`;
    
    return await client.sendMessage(formattedNumber, message);
};

module.exports = {
    initWhatsAppClient,
    getClient,
    getIsReady,
    getQRCode,
    getInitializationError,
    sendMessage
};
