import { scrapeWithBrowser } from './browserScraper.js';
import { scrapeWithHttp } from './httpScraper.js';
import { selectStrategy } from './strategySelector.js';
import { withRetry } from './retry.js';
import { failedResult, successResult } from './scrapeResult.js';

export async function scrapeProduct(product, options = {}) {
  const attempts = options.attempts || 3;
  const retries = [];
  const initialStrategy = selectStrategy(product);
  const httpScraper = options.httpScraper || scrapeWithHttp;
  const browserScraper = options.browserScraper || scrapeWithBrowser;
  const run = (strategy) => strategy === 'browser' ? browserScraper(product, options) : httpScraper(product, options);
  const attemptLogger = (strategy) => (event) => options.onAttempt?.({ ...event, strategy, selectedOption: product.selectedOption?.name || product.selectedOption?.value || product.selectedOption || null });

  try {
    const result = await withRetry(() => run(initialStrategy), {
      attempts,
      delayMs: options.delayMs || 500,
      maxDelayMs: options.maxDelayMs || 5000,
      returnMeta: true,
      onAttempt: attemptLogger(initialStrategy),
      onRetry: (event) => retries.push({ ...event, strategy: initialStrategy })
    });
    return { ...successResult(result.value), strategy: initialStrategy, attempts: result.attempts, retries };
  } catch (error) {
    if (initialStrategy === 'http' && options.browserFallback !== false) {
      try {
        const fallback = await withRetry(() => run('browser'), {
          attempts: options.browserAttempts || 2,
          delayMs: options.delayMs || 500,
          returnMeta: true,
          onAttempt: attemptLogger('browser'),
          onRetry: (event) => retries.push({ ...event, strategy: 'browser' })
        });
        return { ...successResult(fallback.value), strategy: 'browser', attempts: fallback.attempts, retries, fallback: true };
      } catch (fallbackError) {
        return { ...failedResult(fallbackError), strategy: 'browser', attempts, retries, fallback: true };
      }
    }
    return { ...failedResult(error), strategy: initialStrategy, attempts, retries };
  }
}