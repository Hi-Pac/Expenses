import { createClient } from '@supabase/supabase-js';

let cachedClient = null;
let lastUrl = '';
let lastKey = '';

// Clean and sanitize the URL (removes any accidental /rest/v1 or trailing slashes)
export const sanitizeSupabaseUrl = (url) => {
  if (!url) return '';
  let clean = url.trim();
  // Strip any accidental /rest/v1 or /rest/v1/
  clean = clean.replace(/\/rest\/v1\/?$/i, '');
  // Strip trailing slashes
  clean = clean.replace(/\/+$/, '');
  return clean;
};

export const getSavedConfig = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  
  const localUrl = localStorage.getItem('supabase_url') || '';
  const localKey = localStorage.getItem('supabase_anon_key') || '';

  const rawUrl = localUrl || envUrl;
  const key = (localKey || envKey).trim();
  const url = sanitizeSupabaseUrl(rawUrl);

  return { url, key };
};

export const getSupabaseClient = () => {
  const { url, key } = getSavedConfig();
  
  if (!url || !key || !url.startsWith('http')) {
    return null;
  }

  // Return cached singleton instance if config hasn't changed
  if (cachedClient && lastUrl === url && lastKey === key) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    });
    lastUrl = url;
    lastKey = key;
    return cachedClient;
  } catch (e) {
    console.warn('Failed to initialize Supabase client:', e);
    return null;
  }
};

export const resetSupabaseClient = () => {
  cachedClient = null;
  lastUrl = '';
  lastKey = '';
};
