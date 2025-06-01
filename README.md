# 🕵️‍♂️ Amazon Price Tracker

This Node.js app tracks the price of a specific Amazon product every 30 minutes.

---

## 📦 Features

- ✅ Scrapes product title and price from an Amazon product page
- ✅ Saves every check with a POST request
- ✅ Detects price changes with a GET request
- ✅ Sends an email when a price change is detected
- ✅ Runs automatically every 30 minutes using `node-cron`

---

## 🛠 Tech Stack

- [Node.js](https://nodejs.org/)
- [Puppeteer](https://pptr.dev/) – headless browser for scraping
- [node-cron](https://www.npmjs.com/package/node-cron) – for scheduling
- [Nodemailer](https://nodemailer.com/) – local mail server (already running)
