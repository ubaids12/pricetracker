import { supabase } from '../../config/supabase.js';
import { validateObservation } from '../../utils/validators.js';

export async function recordObservation(observation) {
  if (!supabase) throw new Error('Supabase is not configured');
  const { data, error } = await supabase.from('price_history').insert(validateObservation(observation)).select().single();
  if (error) throw error;
  return data;
}

export async function listHistory(productId) {
  if (!supabase) return [];
  const { data, error } = await supabase.from('price_history').select('*').eq('product_id', productId).order('observed_at');
  if (error) throw error;
  return data;
}
