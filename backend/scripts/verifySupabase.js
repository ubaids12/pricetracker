import { createClient } from '@supabase/supabase-js';
import { env } from '../src/config/env.js';

if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
  throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env before running db:verify');
}

const supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function assertTable(table) {
  const { error } = await supabase.from(table).select('*').limit(1);
  if (error) throw new Error(`${table} check failed: ${error.message}`);
  console.log(`${table}: available`);
}

const marker = `verification-${Date.now()}`;
let productId;
try {
  await assertTable('tracked_products');
  await assertTable('price_history');
  await assertTable('scrape_logs');

  const product = await supabase.from('tracked_products').insert({
    name: 'Verification product',
    url: 'https://demo.inelabteamdev.com/item/2024',
    store: 'INE Store',
    store_product_id: marker,
    selected_option: 'Standard',
    selected_option_id: 'o1'
  }).select('id').single();
  if (product.error) throw new Error(`tracked_products insert failed: ${product.error.message}`);
  productId = product.data.id;
  console.log('tracked_products: insert passed');

  const history = await supabase.from('price_history').insert({ product_id: productId, selected_option: 'Standard', price: 1, in_stock: true }).select('id').single();
  if (history.error) throw new Error(`price_history insert failed: ${history.error.message}`);
  console.log('price_history: insert passed');

  const log = await supabase.from('scrape_logs').insert({ product_id: productId, selected_option: 'Standard', attempt_number: 1, strategy: 'verification', status: 'completed', outcome: 'success' }).select('id').single();
  if (log.error) throw new Error(`scrape_logs insert failed: ${log.error.message}`);
  console.log('scrape_logs: insert passed');
} finally {
  if (productId) {
    const { error } = await supabase.from('tracked_products').delete().eq('id', productId);
    if (error) console.warn(`Cleanup failed for verification product: ${error.message}`);
    else console.log('verification rows: cleaned up');
  }
}
