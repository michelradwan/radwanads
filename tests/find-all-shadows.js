const fs = require('fs');
const css = fs.readFileSync('assets/admin-ads.css', 'utf8');
const lines = css.split('\n');
const shadows = [];
lines.forEach((line, idx) => {
    if (line.includes('box-shadow:') || line.includes('drop-shadow(')) {
        shadows.push({ line: idx + 1, content: line.trim() });
    }
});
console.log(JSON.stringify(shadows, null, 2));
