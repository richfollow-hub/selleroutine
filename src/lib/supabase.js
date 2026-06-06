import { createClient } from '@supabase/supabase-js'

const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verify if environment variables are populated and not default templates
export const isConfigured = 
  !!envUrl && 
  envUrl !== 'YOUR_SUPABASE_URL' && 
  envUrl.trim() !== '' && 
  !envUrl.startsWith('http://placeholder') &&
  !!envKey && 
  envKey !== 'YOUR_SUPABASE_ANON_KEY' && 
  envKey.trim() !== '';

// Fallback values to prevent supabase client from crashing on initialization
const fallbackUrl = isConfigured ? envUrl : 'https://eeotfhzrgmpoqwzmvcbx.supabase.co';
const fallbackKey = isConfigured ? envKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlb3RmaHpyZ21wb3F3em12Y2J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNDA1MTYsImV4cCI6MjA5NDYxNjUxNn0.WKmu1OF5ru7H_k4E2HElxj5njeMjcksQdHJIWnHfGao';

export const supabase = createClient(fallbackUrl, fallbackKey)
