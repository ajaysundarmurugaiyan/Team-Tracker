import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://example.supabase.co', 'key');
console.log('Auth methods:', Object.keys(supabase.auth));
