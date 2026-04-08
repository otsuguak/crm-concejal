import { createClient } from '@supabase/supabase-js';

// Ahora el código le pedirá las llaves de forma segura a Vercel
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);