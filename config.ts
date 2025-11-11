// This file centralizes the access to environment variables.
// It checks for common naming conventions (e.g., standard vs. Vite-prefixed).

interface AppConfig {
  supabaseUrl: string | null;
  supabaseAnonKey: string | null;
  geminiApiKey: string | null;
  isConfigured: boolean;
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || null;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || null;
const geminiApiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || null;

export const config: AppConfig = {
  supabaseUrl,
  supabaseAnonKey,
  geminiApiKey,
  isConfigured: !!(supabaseUrl && supabaseAnonKey),
};

if (!config.isConfigured) {
    console.warn("Supabase credentials not found. The application may need to run in Demo Mode. Please provide SUPABASE_URL and SUPABASE_ANON_KEY secrets.");
}

if (!config.geminiApiKey) {
    console.warn("Gemini API key not found. AI features will be disabled. Please provide an API_KEY (or GEMINI_API_KEY) secret.");
}
