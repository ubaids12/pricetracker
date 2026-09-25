import test from 'node:test';
import assert from 'node:assert/strict';
import { scrapeWithHttp } from '../../src/scraper/httpScraper.js';

test('http scraper returns its selected strategy', async () => {
	const html = encodeURIComponent('<div class="price">$12.50</div><div class="stock">In Stock</div>');
	const result = await scrapeWithHttp(`data:text/html,${html}`);
	assert.equal(result.strategy, 'http');
	assert.equal(result.price, 12.5);
	assert.equal(result.inStock, true);
});
