import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Read config exclusively from environment variables — no hardcoded fallbacks
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate env vars at startup so missing config fails loudly instead of silently
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "[Study With Me] Missing Supabase environment variables.\n" +
    "Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.\n" +
    "For Cloudflare Pages: add them in Settings > Environment Variables."
  );
}

// Singleton Supabase client — single instance prevents duplicate auth listeners
let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        // CRITICAL FIX: Override the lock implementation to prevent Navigator Lock deadlocks.
        // The default navigator.locks API causes "Lock was not released within 5000ms" errors
        // which deadlock ALL subsequent Supabase client operations (including .from() queries).
        // This no-op lock implementation bypasses the issue entirely.
        lock: async (_name: string, _acquireTimeout: number, fn: (...args: any[]) => any) => {
          return await fn();
        },
        // Use localStorage explicitly — avoids the BroadcastChannel/lock contention
        flowType: 'implicit',
      },
    });
  }
  return supabaseInstance;
}

// Export the singleton instance for use throughout the app
export const supabase = getSupabaseClient();
