import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Read config exclusively from environment variables — no hardcoded fallbacks
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate env vars at startup so missing config fails loudly instead of silently
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "[EduLearn] Missing Supabase environment variables.\n" +
    "Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.\n" +
    "For Netlify: add them in Site Settings > Environment Variables."
  );
}

// Singleton Supabase client — single instance prevents duplicate auth listeners
let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        // DO NOT set a custom storageKey — the custom key 'edulearn-auth' becomes the
        // internal lock key 'lock:edulearn-auth', causing "Lock was released because
        // another request stole it" errors when multiple concurrent operations run.
        // Let Supabase use its built-in default storage key (no lock conflicts).
        autoRefreshToken: true,
        persistSession: true,       // Keep session across page refreshes (uses IndexedDB/localStorage internally)
        detectSessionInUrl: true,   // Handle OAuth redirects
        // Use default Supabase storage key to keep auth/session behavior standard across app.
      },
    });
  }
  return supabaseInstance;
}

// Export the singleton instance for use throughout the app
export const supabase = getSupabaseClient();
