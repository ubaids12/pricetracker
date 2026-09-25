import { listTrackedProducts } from '../db/repositories/trackedProducts.repository.js';
import { recordObservation } from '../db/repositories/priceHistory.repository.js';
import { recordScrapeLog } from '../db/repositories/scrapeLogs.repository.js';
import { scrapeProduct } from '../scraper/scrapeProduct.js';
import { nowUtc } from '../utils/time.js';

export async function runScrapeForTrackedProducts(options = {}) {
  const loadProducts = options.listTrackedProducts || listTrackedProducts;
  const saveObservation = options.recordObservation || recordObservation;
  const saveScrapeLog = options.recordScrapeLog || recordScrapeLog;
  const runProductScrape = options.scrapeProduct || scrapeProduct;
  const products = options.products || await loadProducts();
  const results = [];
  for (const product of products) {
    const result = await runProductScrape({
      url: product.url,
      selectedOption: { name: product.selected_option },
      requiresBrowser: product.requires_browser
    }, {
      ...options,
      onAttempt: (attempt) => saveScrapeLog({
        product_id: product.id,
        selected_option: attempt.selectedOption || product.selected_option,
        attempt_number: attempt.attempt,
        strategy: attempt.strategy,
        status: attempt.outcome,
        outcome: attempt.outcome,
        error_message: attempt.error?.message || null,
        started_at: attempt.startedAt,
        finished_at: attempt.finishedAt
      })
    });
    const finishedAt = nowUtc();
    if (result.outcome === 'success') {
      await saveObservation({ product_id: product.id, selected_option: result.option || product.selected_option, price: result.price, in_stock: result.inStock, observed_at: finishedAt });
    }
    results.push({ productId: product.id, outcome: result.outcome, price: result.price, inStock: result.inStock });
  }
  return { status: 'completed', processed: results.length, results };
}
