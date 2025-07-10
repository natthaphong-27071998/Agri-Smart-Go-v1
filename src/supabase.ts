
import { createClient } from '@supabase/supabase-js';
import { AppDatabase } from './supabase-types';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key must be provided in environment variables.");
}

export const supabase = createClient<AppDatabase>(supabaseUrl, supabaseAnonKey);
