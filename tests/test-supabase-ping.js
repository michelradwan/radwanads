const https = require('https');

const supabaseUrl = process.env.SUPABASE_URL || 'https://jlgjbycncurgmsbqughp.supabase.co';

console.log('Testando conectividade Supabase:', supabaseUrl);
https.get(`${supabaseUrl}/rest/v1/`, (res) => {
    console.log('Supabase HTTP Status:', res.statusCode);
}).on('error', (e) => {
    console.log('Supabase Connection Error:', e.message);
});
