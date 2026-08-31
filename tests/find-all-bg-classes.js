const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const bgMatches = html.match(/bg-\[[^\]]+\]/g) || [];
const uniqueBgs = Array.from(new Set(bgMatches));
console.log('All inline bg classes in index.html:', uniqueBgs);
