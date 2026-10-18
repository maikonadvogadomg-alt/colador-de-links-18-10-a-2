// Programa do Windows feito pelo Mini SK: abre o index.html deste projeto numa janela.
const { app, BrowserWindow, shell, session, dialog } = require('electron');
const path = require('path'), fs = require('fs'), http = require('http');
if (!app.requestSingleInstanceLock()) { app.quit(); return; }
const RAIZ = path.join(__dirname, '..');
const PORTA = Number(require('../package.json').portaDoPrograma || 7700); // fixa: os dados ficam guardados "por endereço"
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webp': 'image/webp', '.webmanifest': 'application/manifest+json', '.wasm': 'application/wasm', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.woff2': 'font/woff2', '.pdf': 'application/pdf', '.txt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8' };
function servir() {
  return new Promise((ok) => {
    const s = http.createServer((req, res) => {
      let u = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (u.endsWith('/')) u += 'index.html';
      const f = path.join(RAIZ, path.normalize(u).replace(/^([\\/])+/, ''));
      if (!f.startsWith(RAIZ) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('não existe'); }
      res.writeHead(200, { 'Content-Type': TIPOS[path.extname(f).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' }); fs.createReadStream(f).pipe(res);
    });
    s.once('error', () => { dialog.showErrorBox('Programa', 'A porta ' + PORTA + ' está ocupada. Feche o outro programa e abra de novo.'); app.exit(1); });
    s.listen(PORTA, '127.0.0.1', () => ok('http://127.0.0.1:' + PORTA));
  });
}
let janela = null;
app.whenReady().then(async () => {
  const base = await servir();
  if (process.env.TESTE_SAIR === '1') { http.get(base + '/', (r) => app.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => app.exit(1)); return; }
  session.defaultSession.setPermissionRequestHandler((_w, p, cb) => cb(['media', 'clipboard-read', 'clipboard-sanitized-write', 'fullscreen', 'notifications'].includes(p)));
  janela = new BrowserWindow({ width: 1280, height: 860, autoHideMenuBar: true });
  janela.webContents.setWindowOpenHandler(({ url }) => { if (url.startsWith(base) || url.startsWith('blob:') || url === 'about:blank') return { action: 'allow' }; shell.openExternal(url); return { action: 'deny' }; });
  janela.loadURL(base + '/');
});
app.on('second-instance', () => { if (janela) { if (janela.isMinimized()) janela.restore(); janela.focus(); } });
app.on('window-all-closed', () => app.quit());
