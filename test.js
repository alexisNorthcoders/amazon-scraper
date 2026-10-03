import { scrape } from "./scraper.js";

const data = await scrape('https://www.amazon.co.uk/dp/B01D8KOZF4')

console.log(data)