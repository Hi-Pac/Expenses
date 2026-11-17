import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from './supabaseConfig';

let cachedClient = null;
let lastUrl = '';
let lastKey = '';

// Clean and sanitize URL
export const sanitizeSupabaseUrl = (url) => {
  if (!url) return '';
  let clean = url.trim();
  clean = clean.replace(/\/rest\/v1\/?$/i, '');
  clean = clean.replace(/\/+$/, '');
  return clean;
};

export const getSavedConfig = () => {
  // 1. Primary source: the dedicated configuration file (src/supabaseConfig.js)
  const configUrl = SUPABASE_CONFIG?.url || '';
  const configKey = SUPABASE_CONFIG?.anonKey || '';

  // 2. Secondary source: localStorage (if user customized it from UI)
  const localUrl = localStorage.getItem('supabase_url') || '';
  const localKey = localStorage.getItem('supabase_anon_key') || '';

  // 3. Fallback: environment variables
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const rawUrl = configUrl || localUrl || envUrl || '';
  const key = (configKey || localKey || envKey || '').trim();
  const url = sanitizeSupabaseUrl(rawUrl);

  return { url, key, isBuiltIn: Boolean(configKey && configKey.length > 50) };
};

export const getSupabaseClient = () => {
  const { url, key } = getSavedConfig();
  
  if (!url || !key || !url.startsWith('http') || key.length < 50) {
    return null;
  }

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
