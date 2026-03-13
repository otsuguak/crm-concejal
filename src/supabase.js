import { createClient } from '@supabase/supabase-js';

// Reemplaza los textos entre comillas con tus llaves de Supabase
const supabaseUrl = 'https://zqjzuehcqkrzkticjfuh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpxanp1ZWhjcWtyemt0aWNqZnVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNDQ2MjIsImV4cCI6MjA4ODkyMDYyMn0.cj6tbF2mR9whaaJ8EFYYb-rsq3Ka0RLQjt4qAay80rQ';

export const supabase = createClient(supabaseUrl, supabaseKey);