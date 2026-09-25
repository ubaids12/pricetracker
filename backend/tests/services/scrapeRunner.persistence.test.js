import test from 'node:test';
import assert from 'node:assert/strict';
import { runScrapeForTrackedProducts } from '../../src/services/scrapeRunner.service.js';

test('scrape runner persists attempts and successful observations', async () => {
  const logs = [];
  const observations = [];
  const result = await runScrapeForTrackedProducts({
    products: [{ id: 'p1', url: 'https://store.test/item/1', selected_option: 'Standard' }],
    scrapeProduct: async (_product, options) => {
      await options.onAttempt({ attempt: 1, strategy: 'browser', selectedOption: 'Standard', outcome: 'success', startedAt: '2026-01-01T00:00:00.000Z', finishedAt: '2026-01-01T00:00:01.000Z' });
      return { outcome: 'success', strategy: 'browser', option: 'Standard', price: 42, inStock: true, retries: [] };
    },
    recordScrapeLog: async (log) => { logs.push(log); },
    recordObservation: async (observation) => { observations.push(observation); }
  });
  assert.equal(result.results[0].outcome, 'success');
  assert.equal(logs[0].outcome, 'success');
  assert.equal(logs[0].selected_option, 'Standard');
  assert.equal(observations[0].price, 42);
});
