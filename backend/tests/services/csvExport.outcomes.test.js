import test from 'node:test';
import assert from 'node:assert/strict';
import { historyRows, toCsv } from '../../src/services/csvExport.service.js';

test('csv export includes success, retry, and failure attempts', () => {
  const product = [{ id: 'p1', store_product_id: '2024', name: 'Redwick VR Headset One', selected_option: 'Standard' }];
  const history = [{ product_id: 'p1', observed_at: '2026-01-01T00:00:03.000Z', price: 42, in_stock: true }];
  const logs = [
    { product_id: 'p1', selected_option: 'Standard', started_at: '2026-01-01T00:00:00.000Z', finished_at: '2026-01-01T00:00:01.000Z', outcome: 'retried' },
    { product_id: 'p1', selected_option: 'Standard', started_at: '2026-01-01T00:00:02.000Z', finished_at: '2026-01-01T00:00:03.000Z', outcome: 'success' },
    { product_id: 'p1', selected_option: 'Standard', started_at: '2026-01-01T00:00:04.000Z', finished_at: '2026-01-01T00:00:05.000Z', outcome: 'failed' }
  ];
  const csv = toCsv(historyRows(product, history, logs));
  assert.match(csv, /retried/);
  assert.match(csv, /success/);
  assert.match(csv, /failed/);
  assert.match(csv, /,"","","failed"$/);
});
