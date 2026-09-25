import { createClient } from '@supabase/supabase-js';
import { env } from '../src/config/env.js';

if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
  throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env before running db:seed');
}

const supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const products = [
  { id: '2024', name: 'Redwick VR Headset One', optionId: 'o1', option: 'Standard' },
  { id: '2108', name: 'Redwick Resistance Bands Go', optionId: 'o1', option: 'Starter' },
  { id: '2850', name: 'Redwick LED Strip Zen', optionId: 'o1', option: 'Warm white' }
];

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