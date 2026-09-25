import test from 'node:test';
import assert from 'node:assert/strict';
import { searchCatalog } from '../../src/services/productSearch.service.js';

const listings = [
  { id: 2024, name: 'Redwick VR Headset One', brand: 'Redwick', sku: 'SK-2024-RE' },
  { id: 2025, name: 'Redwick Gaming Chair', brand: 'Redwick', sku: 'SK-2025-RE' }
];

const fetchPage = async () => ({ results: listings });
const fetchProduct = async (id) => ({
  id,
  name: listings.find((item) => item.id === Number(id)).name,
  sku: listings.find((item) => item.id === Number(id)).sku,
  options: id === '2024' ? [
    { id: 'o1', name: 'Standard' },
    { id: 'o2', name: 'Special Edition' },
    { id: 'o3', name: 'Pro Bundle' }
  ] : [{ id: 'o1', name: 'Standard' }]
});

test('search returns options for a full product name', async () => {
  const results = await searchCatalog('Redwick VR Headset One', { fetchPage, fetchProduct });
  assert.equal(results.length, 1);
  assert.deepEqual(results[0], {
    id: '2024',
    name: 'Redwick VR Headset One',
    store: 'INE Store',
    sku: 'SK-2024-RE',
    url: 'https://demo.inelabteamdev.com/item/2024',
    options: [
      { id: 'o1', name: 'Standard' },
      { id: 'o2', name: 'Special Edition' },
      { id: 'o3', name: 'Pro Bundle' }
    ]
  });
});

test('search returns all matching products for a partial name', async () => {
  const results = await searchCatalog('redwick', { fetchPage, fetchProduct });
  assert.equal(results.length, 2);
  assert.deepEqual(results.map((product) => product.name), ['Redwick VR Headset One', 'Redwick Gaming Chair']);
  assert.deepEqual(results[1].options, [{ id: 'o1', name: 'Standard' }]);
});