import test from 'node:test';
import assert from 'node:assert/strict';
import { runScrapeForTrackedProducts } from '../../src/services/scrapeRunner.service.js';

test('scrape runner reports an empty completed run', async () => { assert.deepEqual(await runScrapeForTrackedProducts({ products: [] }), { status: 'completed', processed: 0, results: [] }); });
