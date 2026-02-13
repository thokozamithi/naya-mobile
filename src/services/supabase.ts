import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

const notConfiguredError = new Error('Supabase environment variables not configured');
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables not configured');
}

const stubQuery = {
  select: async () => ({ data: null, error: notConfiguredError }),
  insert: async () => ({ data: null, error: notConfiguredError }),
  update: async () => ({ data: null, error: notConfiguredError }),
  delete: async () => ({ data: null, error: notConfiguredError }),
  eq: () => stubQuery,
  maybeSingle: async () => ({ data: null, error: notConfiguredError }),
  single: async () => ({ data: null, error: notConfiguredError }),
  order: () => stubQuery,
  limit: () => stubQuery,
};

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        storage: AsyncStorage,
      },
    })
  : ({
      auth: {
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        getSession: async () => ({ data: { session: null }, error: null }),
        signInWithPassword: async () => ({ data: null, error: notConfiguredError }),
        signUp: async () => ({ data: null, error: notConfiguredError }),
        signOut: async () => ({ error: null }),
        resetPasswordForEmail: async () => ({ data: null, error: notConfiguredError }),
      },
      from: () => stubQuery,
    } as any);
