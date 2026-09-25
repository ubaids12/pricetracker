import { env } from '../config/env.js';

const pageSize = 100;

async function fetchCatalogPage(page) {
  const response = await fetch(`${env.storeBaseUrl}/api/v2/listings?page=${page}&limit=${pageSize}`);
  if (!response.ok) throw new Error(`Store catalog returned HTTP ${response.status}`);
  return response.json();
}

function listingItems(payload) {
  return payload.results || payload.items || payload.listings || payload.data || [];
}

export async function searchCatalog(query, { fetchPage = fetchCatalogPage, fetchProduct = getProduct } = {}) {
  const normalizedQuery = String(query || '').trim().toLowerCase();
  if (!normalizedQuery) return [];
  const matches = [];
  for (let page = 1; page <= 16 && matches.length < 20; page += 1) {
    const items = listingItems(await fetchPage(page));
    if (!items.length) break;
    matches.push(...items.filter((product) => `${product.name} ${product.brand} ${product.sku}`.toLowerCase().includes(normalizedQuery)).map((product) => ({
      id: String(product.id),
      name: product.name,
      store: 'INE Store',
      sku: product.sku,
      url: `${env.storeBaseUrl}/item/${product.id}`,
      options: product.options || []
    })));
    if (items.length < pageSize && page >= 16) break;
  }
  const uniqueMatches = [...new Map(matches.map((product) => [product.id, product])).values()].slice(0, 20);
  return Promise.all(uniqueMatches.map(async (match) => {
    try {
      const details = await fetchProduct(match.id);
      return {
        ...match,
        name: details.name || match.name,
        sku: details.sku || match.sku,
        options: details.options || []
      };
    } catch {
      return match;
    }
  }));
}

export async function getProduct(productId) {
  const response = await fetch(`${env.storeBaseUrl}/api/v2/items/${encodeURIComponent(productId)}`);
  if (!response.ok) throw new Error(`Store product returned HTTP ${response.status}`);
  const product = await response.json();
  return {
    ...product,
    id: String(product.id),
    url: `${env.storeBaseUrl}/item/${product.id}`,
    options: (product.options || []).map((option) => ({ id: option.id, name: option.label }))
  };
}
