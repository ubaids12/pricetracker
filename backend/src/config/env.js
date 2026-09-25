import 'dotenv/config';

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  storeBaseUrl: process.env.STORE_BASE_URL || 'https://demo.inelabteamdev.com',
  browserExecutablePath: process.env.BROWSER_EXECUTABLE_PATH || '',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  cronSecret: process.env.CRON_SECRET || ''
};
