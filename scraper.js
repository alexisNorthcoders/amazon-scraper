import puppeteer from 'puppeteer';

export async function scrape(url) {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium-browser',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  );

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

    const title = await page.$eval('#productTitle', el => el.textContent.trim());
    const price = await page.$eval('#tp_price_block_total_price_ww .a-offscreen', el => el.textContent.trim());

    return { title, price, timestamp: new Date().toISOString() };
  } catch (err) {
    console.error('Scraping error:', err.message);
    return null;
  } finally {
    await browser.close();
  }
}
