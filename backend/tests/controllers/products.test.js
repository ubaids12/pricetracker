import test from 'node:test';
import assert from 'node:assert/strict';
import { trackProduct } from '../../src/controllers/products.controller.js';

function responseDouble() {
  return { statusCode: 200, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; } };
}

test('track product persists the selected option', async () => {
  const response = responseDouble();
  let saved;
  await trackProduct({ body: { productId: '2024', selectedOption: 'Standard', selectedOptionId: 'o1' } }, response, () => {}, {
    getProduct: async () => ({ id: 2024, name: 'Redwick VR Headset One', url: 'https://demo.inelabteamdev.com/item/2024', options: [{ id: 'o1', name: 'Standard' }] }),
    createTrackedProduct: async (product) => { saved = product; return { id: 'tracked-1', ...product }; }
  });
  assert.equal(response.statusCode, 201);
  assert.equal(saved.selected_option, 'Standard');
  assert.equal(saved.selected_option_id, 'o1');
});

test('track product rejects an unavailable option', async () => {
  const response = responseDouble();
  await trackProduct({ body: { productId: '2024', selectedOption: 'XL' } }, response, () => {}, {
    getProduct: async () => ({ id: 2024, options: [{ id: 'o1', name: 'Standard' }] })
  });
  assert.equal(response.statusCode, 400);
  assert.match(response.body.error, /not available/);
});
