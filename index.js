import cron from 'node-cron';
import axios from 'axios';
import { scrape } from './scraper.js';

const EMAIL_ENDPOINT = 'http://localhost:5555/contact';
const API = 'http://localhost:7000'
const products = [
    { url: 'https://www.amazon.co.uk/dp/B0D9BX8S9V', name: 'pullbar' },
    { url: 'https://www.amazon.co.uk/dp/B08JH7M643', name: 'yoyo' }
];

async function sendEmail(title, oldPrice, newPrice) {
    const message = `Price of "${title}" changed from ${oldPrice || 'N/A'} to ${newPrice}.`;

    await axios.post(EMAIL_ENDPOINT, {
        firstName: 'Price',
        lastName: 'Alert',
        email: 'bot@example.com',
        phone: 'N/A',
        subject: 'Amazon-tracker price alert',
        message
    });

    console.log('📧 Email sent:', message);
}

async function getLastPriceFromAPI(url) {
    try {
        const res = await axios.get(`${API}/amazon-prices/last`, {
            params: { url }
        });
        return res.data.lastPrice;
    } catch (error) {
        console.error("❌ Failed to fetch last price from API:", error.message);
        return null;
    }
}

async function savePriceToAPI(data) {
    try {
        await axios.post(`${API}/amazon-prices`, data);
        console.log("✅ Price saved to API");
    } catch (error) {
        console.error("❌ Failed to save price to API:", error.message);
    }
}

async function run() {
    for (let i = 0; i < products.length; i++) {
        const product = products[i];
        const data = await scrape(product.url);
        if (!data) return;

        const { title, price, timestamp } = data;
        const lastPrice = await getLastPriceFromAPI(product.url);

        await savePriceToAPI({ url: product.url, title, price, timestamp });

        if (lastPrice !== price) {
            console.log(`🔔 Price changed: ${lastPrice} → ${price}`);
            await sendEmail(title, lastPrice, price);
        } else {
            console.log("No price change detected.");
        }
    }
}

cron.schedule('*/30 * * * *', () => {
    console.log('\n⏱ Running scheduled scrape at', new Date().toISOString());
    run();
});

run();
