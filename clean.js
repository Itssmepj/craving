const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// remove Next.js script tags
html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, (match) => {
    if (match.includes('_next/static') || match.includes('.download') || match.includes('03~yq9q893hmn.js')) {
        return '';
    }
    return match;
});

// remove plasmo and adblock
html = html.replace(/<plasmo-csui[\s\S]*?<\/plasmo-csui>/g, '');
html = html.replace(/<style[^>]*abn_style[^>]*>[\s\S]*?<\/style>/g, '');

// update asset paths
html = html.replace(/CRAV _ Enjoy_files/g, 'assets');

// ensure we have our own script injected
if (!html.includes('js/script.js')) {
    html = html.replace('</body>', '<script src="js/script.js"></script></body>');
}

fs.writeFileSync('index.html', html);
