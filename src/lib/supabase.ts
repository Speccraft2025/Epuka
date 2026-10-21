import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Public values: the URL and publishable key are safe to ship to the browser.
// Row Level Security in supabase/migrations is what protects the data.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = !!SUPABASE_URL && !!SUPABASE_KEY;

let client: SupabaseClient<Database> | null = null;

/**
 * Lazily-created browser client. Lazy so that Next's build-time prerender
 * (which runs without a browser) never instantiates it.
 */
export function getSupabase(): SupabaseClient<Database> {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.'
    );
  }
  if (!client) {
    client = createBrowserClient<Database>(SUPABASE_URL!, SUPABASE_KEY!);
  }
  return client;
}
