


import { createClient } from '@supabase/supabase-js';
import { AppDatabase } from './supabase-types';


// NOTE: In a production environment, these keys should be stored securely as environment variables.
// They are hardcoded here to resolve the configuration error based on the user's request.
const supabaseUrl = 'https://ddinchnrtmuvanpmroxm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkaW5jaG5ydG11dmFucG1yb3htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MzQ2MzgsImV4cCI6MjA2NzIxMDYzOH0.xCa9xXTeS2LwJnpQA1ZQ8ZSqBV7lc_IILHb_BNXFFec';

export const supabase = createClient<AppDatabase>(supabaseUrl, supabaseAnonKey);