import { createClient } from '@supabase/supabase-js';
import { env } from '../src/config/env.js';

if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
  throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env before running db:seed');
}

const supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function loadProducts(limit = 20) {
  const products = [];
  for (let page = 1; page <= 16 && products.length < limit; page += 1) {
    const response = await fetch(`${env.storeBaseUrl}/api/v2/listings?page=${page}&limit=60`);
    if (!response.ok) throw new Error(`Catalog request failed with HTTP ${response.status}`);
    const payload = await response.json();
    for (const listing of payload.results || []) {
      if (products.length >= limit) break;
      const detailsResponse = await fetch(`${env.storeBaseUrl}/api/v2/items/${listing.id}`);
      if (!detailsResponse.ok) continue;
      const details = await detailsResponse.json();
      const option = details.options?.[0];
      if (option) products.push({ id: String(details.id), name: details.name, optionId: option.id, option: option.label });
    }
  }
  return products;
}

const products = await loadProducts(20);
console.log(`Found ${products.length} products with selectable options.`);

for (const product of products) {
  const row = {
    name: product.name,
    url: `${env.storeBaseUrl}/item/${product.id}`,
    store: 'INE Store',
    store_product_id: product.id,
    selected_option: product.option,
    selected_option_id: product.optionId
  };
  const existing = await supabase.from('tracked_products').select('id').eq('store_product_id', product.id).eq('selected_option_id', product.optionId).maybeSingle();
  if (existing.error) throw new Error(`Lookup failed for ${product.name}: ${existing.error.message}`);
  if (existing.data) {
    console.log(`${product.name}: already seeded`);
    continue;
  }
  const inserted = await supabase.from('tracked_products').insert(row).select('id').single();
  if (inserted.error) throw new Error(`Insert failed for ${product.name}: ${inserted.error.message}`);
  console.log(`${product.name}: seeded (${inserted.data.id})`);
}