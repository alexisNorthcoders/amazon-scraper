import cron from 'node-cron';
import axios from 'axios';
import { scrape } from './scraper.js';
import fs from 'fs/promises';

const EMAIL_ENDPOINT = 'http://localhost:5555/contact';
const API = 'http://localhost:7000'


async function getProducts() {
    try {
        const data = await fs.readFile('./products.json', 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('❌ Failed to load products.json:', error);
        return [];
    }
}

async function saveProducts(products) {
    try {
        await fs.writeFile('./products.json', JSON.stringify(products, null, 2));
        console.log("✅ Products list updated.");
    } catch (error) {
        console.error("❌ Failed to update products.json:", error);
    }
}

async function addProductCLI(url, name) {
    if (!url || !name) {
        console.error('❌ Please provide both URL and name.');
        process.exit(1);
    }

    const products = await getProducts();

    if (products.find(p => p.url === url)) {
        console.error('❌ Product already exists in products.json');
        process.exit(1);
    }

    const newProduct = { url, name };
    products.push(newProduct);

    await saveProducts(products);
    await checkProduct(newProduct);
}

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

async function checkProduct(product) {
    const data = await scrape(product.url);
    if (!data) return;

    const { title, price, timestamp } = data;
    const lastPrice = await getLastPriceFromAPI(product.url);

    await savePriceToAPI({ url: product.url, title, price, timestamp });

    // if lastPrice is null it means there is no record of it in the API, so it must be a new product
    if (lastPrice == null) {
        console.log(`🆕 New product added: ${title} with price ${price}`);
    } else if (lastPrice !== price) {
        console.log(`🔔 Price changed for ${title}: ${lastPrice} → ${price}`);
        await sendEmail(title, lastPrice, price);
    } else {
        console.log(`No price change detected for ${title}.`);
    }
}

async function run() {
    const products = await getProducts();
    for (const product of products) {
        await checkProduct(product);
    }
}

if (process.argv.length > 2) {
    // Example usage:
    // node index.js add-product "https://www.amazon.co.uk/dp/B00TEST1234" "Test Product"
    const command = process.argv[2];

    if (command === 'add-product') {
        const url = process.argv[3];
        const name = process.argv[4];
        addProductCLI(url, name).then(() => process.exit(0));
    } else {
        console.error('❌ Unknown command');
        process.exit(1);
    }
} else {
    // No CLI command: run scheduled scraping as usual
    cron.schedule('*/30 * * * *', () => {
        console.log('\n⏱ Running scheduled scrape at', new Date().toISOString());
        run();
    });

    run();
}
