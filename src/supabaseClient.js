import { createClient } from '@supabase/supabase-js';

// Default Supabase configuration from environment or localStorage
const getSavedConfig = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  const localUrl = localStorage.getItem('supabase_url');
  const localKey = localStorage.getItem('supabase_anon_key');

  const url = localUrl || envUrl || '';
  const key = localKey || envKey || '';

  return { url, key };
};

export const getSupabaseClient = () => {
  const { url, key } = getSavedConfig();
  if (url && key && url.startsWith('http')) {
    try {
      return createClient(url, key);
    } catch (e) {
      console.warn('Failed to initialize Supabase client:', e);
      return null;
    }
  }
  return null;
};
