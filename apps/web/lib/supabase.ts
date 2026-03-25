import { createClient } from '@supabase/supabase-js';

// Fallbacks prevent build-time throw when env vars are not yet set (e.g. CI/Vercel build phase)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
