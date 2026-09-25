import test from 'node:test';
import assert from 'node:assert/strict';
import { validateObservation, validateScrapeLog, validateTrackedProduct } from '../../src/utils/validators.js';

test('validators reject malformed tracked products', () => {
  assert.throws(() => validateTrackedProduct({ name: 'x', url: 'not-a-url', store_product_id: '1', selected_option: 'Standard' }), /valid URL/);
});

test('validators reject invalid observations', () => {
  assert.throws(() => validateObservation({ product_id: 'p1', selected_option: 'Standard', price: -1, in_stock: true }), /non-negative/);
  assert.throws(() => validateObservation({ product_id: 'p1', selected_option: 'Standard', price: 1, in_stock: 'yes' }), /boolean/);
});

test('validators reject invalid scrape outcomes', () => {
  assert.throws(() => validateScrapeLog({ product_id: 'p1', selected_option: 'Standard', attempt_number: 0, strategy: 'browser', outcome: 'failed' }), /positive integer/);
  assert.throws(() => validateScrapeLog({ product_id: 'p1', selected_option: 'Standard', attempt_number: 1, strategy: 'browser', outcome: 'unknown' }), /outcome is invalid/);
});
