import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

const databaseKey = env.supabaseServiceRoleKey || env.supabaseAnonKey;

export const supabase = env.supabaseUrl && databaseKey
  ? createClient(env.supabaseUrl, databaseKey, { auth: { autoRefreshToken: false, persistSession: false } })
  : null;
