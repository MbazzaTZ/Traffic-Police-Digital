import { createClient } from '@supabase/supabase-js';

const url  = import.meta.env.VITE_SUPABASE_URL;
const key  = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'tpdop-auth',
  },
});

// Debug helper — call this in console to check session
window.__tpdopCheckAuth = async () => {
  const { data } = await supabase.auth.getSession();
  console.log('Session:', data.session ? `✅ ${data.session.user.email} (${data.session.user.user_metadata?.role})` : '❌ No session');
  return data.session;
};
