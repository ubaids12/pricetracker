import { supabase } from '../../config/supabase.js';

export async function listTrackedProducts() {
  if (!supabase) return [];
  const { data, error } = await supabase.from('tracked_products').select('*').eq('active', true).order('created_at');
  if (error) throw error;
  return data;
}

export async function createTrackedProduct(product) {
  if (!supabase) throw new Error('Supabase is not configured');
  const { data, error } = await supabase.from('tracked_products').insert(product).select().single();
  if (error) throw error;
  return data;
}
