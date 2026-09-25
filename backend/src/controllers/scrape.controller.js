import { runScrapeForTrackedProducts } from '../services/scrapeRunner.service.js';

export async function runScrape(_request, response, next) {
  try { response.json({ data: await runScrapeForTrackedProducts() }); } catch (error) { next(error); }
}
