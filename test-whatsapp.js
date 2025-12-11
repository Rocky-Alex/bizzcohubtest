const { Client, LocalAuth } = require('whatsapp-web.js');

console.log('Starting standalone test...');

const client = new Client({
    authStrategy: new LocalAuth({ dataPath: './.wwebjs_auth_test' }),
    puppeteer: {
        headless: true,
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ]
    }
});

client.on('qr', (qr) => {
    console.log('QR RECEIVED (Success)');
    process.exit(0);
});

client.on('ready', () => {
    console.log('CLIENT IS READY');
    process.exit(0);
});

client.on('auth_failure', msg => {
    console.error('AUTHENTICATION FAILURE', msg);
    process.exit(1);
});

client.on('disconnected', (reason) => {
    console.log('Client was disconnected', reason);
});

async function run() {
    try {
        console.log('Initializing...');
        await client.initialize();
        console.log('Initialize called.');
    } catch (err) {
        console.error('Initialization error:', err);
        process.exit(1);
    }
}

run();
