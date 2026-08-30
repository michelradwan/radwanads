const https = require('https');

const supabaseUrl = process.env.SUPABASE_URL || 'https://jlgjbycncurgmsbqughp.supabase.co';
const anonKey = process.env.SUPABASE_ANON_KEY || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

console.log('--- SUPABASE AUDIT ---');
console.log('URL:', supabaseUrl);
console.log('ANON KEY present:', !!anonKey, anonKey ? `len:${anonKey.length}` : '');
console.log('SERVICE ROLE KEY present:', !!serviceKey, serviceKey ? `len:${serviceKey.length}` : '');
