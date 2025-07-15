const express = require('express');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const app = express();
app.use(express.json());

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('QR Code received, scan it with your WhatsApp mobile app.');
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('message', message => {
    console.log(`Received message: ${message.body}`);
});

app.post('/send-message', async (req, res) => {
    const { number, message, image_url } = req.body;
    const formattedNumber = `${number.replace(/^0/, '98')}@c.us`;

    let errorOccurred = false;

    // تلاش برای ارسال پیام متنی
    try {
        const sentMessage = await client.sendMessage(formattedNumber, message);
        console.log('متن ارسال شد:', sentMessage);
    } catch (error) {
        errorOccurred = true;
        console.error('خطا در ارسال پیام متنی:', error);
    }

    // تلاش برای ارسال عکس (در صورت وجود)
    if (image_url) {
        try {
            const media = await MessageMedia.fromUrl(image_url);
            const sentMedia = await client.sendMessage(formattedNumber, media, { caption: message });
            console.log('عکس ارسال شد:', sentMedia);
        } catch (imgErr) {
            errorOccurred = true;
            console.error('خطا در ارسال عکس:', imgErr);
        }
    }

    if (errorOccurred) {
        res.json({ status: 'warning', message: 'پیام احتمالاً ارسال شده اما خطا رخ داده است!' });
    } else {
        res.json({ status: 'success', message: 'پیام با موفقیت ارسال شد!' });
    }
});

client.initialize();

app.listen(3000, () => {
    console.log('Server is listening on port 3000');
});
