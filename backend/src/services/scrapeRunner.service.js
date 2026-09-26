import { listTrackedProducts } from '../db/repositories/trackedProducts.repository.js';
import { recordObservation } from '../db/repositories/priceHistory.repository.js';
import { recordScrapeLog } from '../db/repositories/scrapeLogs.repository.js';
import { scrapeProduct } from '../scraper/scrapeProduct.js';
import { nowUtc } from '../utils/time.js';

export async function runScrapeForTrackedProducts(options = {}) {
  console.log('=================================');
  console.log('SCRAPE JOB STARTED');
  console.log('=================================');

  const loadProducts = options.listTrackedProducts || listTrackedProducts;
  const saveObservation = options.recordObservation || recordObservation;
  const saveScrapeLog = options.recordScrapeLog || recordScrapeLog;
  const runProductScrape = options.scrapeProduct || scrapeProduct;

  console.log('Fetching tracked products...');

  const products = options.products || await loadProducts();

  console.log(`Found ${products.length} tracked products`);

  const results = [];

  for (const product of products) {
    console.log('---------------------------------');
    console.log(`Starting product: ${product.id}`);
    console.log(`URL: ${product.url}`);
    console.log(`Option: ${product.selected_option}`);
    console.log('---------------------------------');

    const result = await runProductScrape(
      {
        url: product.url,
        selectedOption: { name: product.selected_option },
        requiresBrowser: product.requires_browser
      },
      {
        ...options,

        onAttempt: (attempt) => {
          console.log(
            `Attempt ${attempt.attempt} | ` +
            `Strategy: ${attempt.strategy} | ` +
            `Outcome: ${attempt.outcome}`
          );

          return saveScrapeLog({
            product_id: product.id,
            selected_option:
              attempt.selectedOption || product.selected_option,
            attempt_number: attempt.attempt,
            strategy: attempt.strategy,
            status: attempt.outcome,
            outcome: attempt.outcome,
            error_message: attempt.error?.message || null,
            started_at: attempt.startedAt,
            finished_at: attempt.finishedAt
          });
        }
      }
    );

    console.log(`Product ${product.id} finished`);
    console.log(`Outcome: ${result.outcome}`);
    console.log(`Price: ${result.price}`);
    console.log(`Stock: ${result.inStock}`);

    const finishedAt = nowUtc();

    if (
      result.outcome === 'success' &&
      typeof result.price === 'number' &&
      Number.isFinite(result.price) &&
      result.price >= 0 &&
      typeof result.inStock === 'boolean' &&
      typeof (result.option || product.selected_option) === 'string'
    ) {
      console.log('Saving price observation...');

      await saveObservation({
        product_id: product.id,
        selected_option:
          result.option || product.selected_option,
        price: result.price,
        in_stock: result.inStock,
        observed_at: finishedAt
      });

      console.log('Price observation saved');
    } else {
      console.log(
        'Observation NOT saved because scrape result was invalid/failed'
      );
    }

    results.push({
      productId: product.id,
      outcome: result.outcome,
      price: result.price,
      inStock: result.inStock
    });
  }

  console.log('=================================');
  console.log('SCRAPE JOB FINISHED');
  console.log(`Processed: ${results.length}`);
  console.log('=================================');

  return {
    status: 'completed',
    processed: results.length,
    results
  };
}