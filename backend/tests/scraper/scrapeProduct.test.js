import test from 'node:test';
import assert from 'node:assert/strict';
import { scrapeProduct } from '../../src/scraper/scrapeProduct.js';

test('scrape product falls back from HTTP to browser', async () => {
  const strategies = [];
  const result = await scrapeProduct({ url: 'https://store.test/item/1', selectedOption: 'Standard' }, {
    attempts: 1,
    browserAttempts: 1,
    delayMs: 0,
    httpScraper: async () => { strategies.push('http'); throw new Error('dynamic page'); },
    browserScraper: async () => { strategies.push('browser'); return { price: 99, inStock: true, option: 'Standard' }; }
  });
  assert.deepEqual(strategies, ['http', 'browser']);
  assert.equal(result.outcome, 'success');
  assert.equal(result.strategy, 'browser');
  assert.equal(result.price, 99);
});
