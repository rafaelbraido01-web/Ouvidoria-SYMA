const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const types = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml'
};

http.createServer((request, response) => {
  const pathname = decodeURIComponent(request.url.split('?')[0]);
  const requested = pathname === '/'
    ? '/index.html'
    : (pathname === '/admin' || pathname === '/admin/' ? '/admin.html' : pathname);
  const filePath = path.resolve(root, `.${requested}`);

  if (!filePath.startsWith(root) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Página não encontrada');
    return;
  }

  response.writeHead(200, {
    'Content-Type': types[path.extname(filePath)] || 'application/octet-stream',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  fs.createReadStream(filePath).pipe(response);
}).listen(process.env.PORT || 4173, () => {
  console.log(`Ouvidoria SYMA disponível em http://localhost:${process.env.PORT || 4173}`);
});