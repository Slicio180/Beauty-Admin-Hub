// Serve only public assets on loopback. Never expose Apps Script or audit files.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = fs.realpathSync(path.join(__dirname, '../public'));
const csp = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'";
function createPreviewServer() {
  return http.createServer((req, res) => {
    res.setHeader('Content-Security-Policy', csp);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      const file = fs.realpathSync(path.join(root, pathname === '/' ? 'preview.html' : pathname));
      if (!file.startsWith(root + path.sep) || !fs.statSync(file).isFile()) throw new Error('Outside public');
      const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
      res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
      res.writeHead(200);
      if (req.method === 'HEAD') res.end(); else fs.createReadStream(file).pipe(res);
    } catch { res.writeHead(404); res.end('Not found'); }
  });
}
if (require.main === module) {
  const server = createPreviewServer();
  server.on('error', error => { console.error('Preview could not start:', error.message); process.exitCode = 1; });
  server.listen(4173, '127.0.0.1', () => console.log('Beauty local demo: http://127.0.0.1:4173/preview.html'));
}
module.exports = { createPreviewServer };
