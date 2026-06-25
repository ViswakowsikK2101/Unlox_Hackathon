import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || "";
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || "";

class MockSupabaseAuth {
  async signInWithPassword({ email, password }: any) {
    console.log("[Mock Supabase Auth] signInWithPassword", email);
    if (!email || !password) {
      return { data: { user: null, session: null }, error: new Error("Email and password are required") };
    }
    if (password.length < 8) {
      return { data: { user: null, session: null }, error: new Error("Password must be at least 8 characters") };
    }
    return {
      data: {
        user: {
          id: `usr-${Date.now()}`,
          email,
          user_metadata: {
            name: "Aarav Sharma",
            branch: "Computer Science",
            year: "3rd Year",
            phone: "+919876543210"
          }
        },
        session: { access_token: "mock-token-12345" }
      },
      error: null
    };
  }

  async signUp({ email, password, options }: any) {
    console.log("[Mock Supabase Auth] signUp", email, options);
    if (!email || !password) {
      return { data: { user: null, session: null }, error: new Error("Email and password are required") };
    }
    if (password.length < 8) {
      return { data: { user: null, session: null }, error: new Error("Password must be at least 8 characters") };
    }
    const { name, branch, year, phone } = options?.data || {};
    return {
      data: {
        user: {
          id: `usr-${Date.now()}`,
          email,
          user_metadata: {
            name: name || "New User",
            branch: branch || "Computer Science",
            year: year || "1st Year",
            phone: phone || "+919876543210"
          }
        },
        session: { access_token: "mock-token-12345" }
      },
      error: null
    };
  }

  async signOut() {
    return { error: null };
  }
}

class MockSupabaseClient {
  auth = new MockSupabaseAuth();
}

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : new MockSupabaseClient() as any;
