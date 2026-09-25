import test from 'node:test';
import assert from 'node:assert/strict';
import { parseProductHtml } from '../../src/scraper/parser.js';

test('parser reads visible price and stock', () => {
	const html = '<h1>Desk Lamp</h1><div class="price">$39.99</div><div class="stock">InStock</div>';
	assert.deepEqual(parseProductHtml(html), { name: 'Desk Lamp', price: 39.99, inStock: true, option: null });
});

test('parser rejects incomplete pages instead of returning empty data', () => {
	assert.throws(() => parseProductHtml('<html></html>'), /complete price and stock/);
});

test('parser reads the INE unlocked offer panel', () => {
	const html = '<h1>Redwick VR Headset One</h1><button class="opt-chip opt-chip-on">Standard</button><div class="offer-panel"><div><p class="offer-price">₹9,761</p><p>₹9,078</p><p>7% saving</p><p>SOLD OUT</p></div></div>';
	assert.deepEqual(parseProductHtml(html, { selectedOption: 'Standard' }), { name: 'Redwick VR Headset One', price: 9761, inStock: false, option: 'Standard' });
});
