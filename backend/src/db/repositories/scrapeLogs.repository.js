import { supabase } from '../../config/supabase.js';
import { validateScrapeLog } from '../../utils/validators.js';

export async function recordScrapeLog(log) {
  if (!supabase) throw new Error('Supabase is not configured');
  const { data, error } = await supabase.from('scrape_logs').insert(validateScrapeLog(log)).select().single();
  if (error) throw error;
  return data;
}

export async function listScrapeLogs(productId) {
  if (!supabase) return [];
  const { data, error } = await supabase.from('scrape_logs').select('*').eq('product_id', productId).order('started_at', { ascending: false });
  if (error) throw error;
  return data;
}
