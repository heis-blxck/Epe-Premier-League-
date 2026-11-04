import { createClient, SupabaseClient } from '@supabase/supabase-js';

const getEnvVar = (key: string): string => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
    return String((import.meta as any).env[key]).trim();
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return String(process.env[key]).trim();
  }
  return '';
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || getEnvVar('SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || getEnvVar('SUPABASE_ANON_KEY');

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export type AuthRedirectInfo = {
  /** 'signup' | 'recovery' | 'magiclink' | 'invite' | 'email_change' ... */
  type: string | null;
  error: string | null;
};

/**
 * Supabase email links (confirm sign-up, reset password) land back on the app
 * with details in the URL hash. The Supabase client consumes and clears that
 * hash on startup, so capture it first.
 */
function readAuthRedirect(): AuthRedirectInfo | null {
  if (typeof window === 'undefined' || !window.location) return null;
  const raw = `${window.location.hash || ''}`.replace(/^#/, '');
  const query = new URLSearchParams(window.location.search || '');
  const params = new URLSearchParams(raw);
  const type = params.get('type') || query.get('type');
  const error = params.get('error_description') || query.get('error_description') || params.get('error') || query.get('error');
  if (!type && !error && !params.get('access_token')) return null;
  return { type, error: error ? error.replace(/\+/g, ' ') : null };
}

export const initialAuthRedirect: AuthRedirectInfo | null = readAuthRedirect();

if (!isSupabaseConfigured) {
  console.warn('Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are not set.');
}

export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);

export default supabase;
