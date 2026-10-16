import http from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, sep, extname } from 'node:path';
import { root } from './src/paths.mjs';
import { renderPage } from './src/page.mjs';
import { editable } from './src/editable.mjs';
import { albumRoot, albumPhotos } from './src/album.mjs';

const port = Number(process.env.PORT || 5180);
const assetsRoot = resolve(root,'public');
const mime = {'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.json':'application/json','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2','.ttf':'font/ttf','.otf':'font/otf','.m4a':'audio/mp4'};
const server = http.createServer((req,res) => {
  try {
    const url = new URL(req.url,'http://localhost');
    const pathname = decodeURIComponent(url.pathname);
    if (pathname === '/' || pathname === '/index.html') {
      res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});
      res.end(renderPage()); return;
    }
    if (pathname === '/health') {res.writeHead(200,{'Content-Type':'text/plain'});res.end('flower-garden-3d');return;}
    if (pathname === '/favicon.ico') {res.writeHead(204);res.end();return;}
    if (pathname === '/falling/album.json') {
      res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
      res.end(JSON.stringify(albumPhotos()));return;
    }
    const source = Object.hasOwn(editable,pathname) ? editable[pathname] : null;
    const fileRoot = pathname.startsWith('/album/') ? albumRoot : assetsRoot;
    let path = source ? resolve(root,source) : pathname === '/custom.css' ? resolve(root,'custom.css') : fileRoot === albumRoot ? resolve(albumRoot, '.' + pathname.slice('/album'.length)) : resolve(assetsRoot,'.'+pathname);
    if (!source && pathname !== '/custom.css' && !path.startsWith(fileRoot + sep)) {res.writeHead(403);res.end();return;}
    if (existsSync(path) && statSync(path).isFile()) {
      // Read a bounded buffer: stream file offsets can fail on mounted Windows folders.
      const content = readFileSync(path);
      const headers = {'Content-Type':mime[extname(path)]||'application/octet-stream','Cache-Control':'no-store','Accept-Ranges':'bytes'};
      if (req.headers.range) {
        const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
        let start = range?.[1] ? Number(range[1]) : 0;
        let end = range?.[2] ? Number(range[2]) : content.length - 1;
        if (range && !range[1] && range[2]) {
          start = Math.max(0, content.length - Number(range[2]));
          end = content.length - 1;
        }
        end = Math.min(end, content.length - 1);
        if (!range || (!range[1] && !range[2]) || !Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= content.length) {
          res.writeHead(416,{...headers,'Content-Range':`bytes */${content.length}`});res.end();return;
        }
        res.writeHead(206,{...headers,'Content-Range':`bytes ${start}-${end}/${content.length}`,'Content-Length':end-start+1});
        res.end(req.method === 'HEAD' ? undefined : content.subarray(start,end+1));return;
      }
      res.writeHead(200,{...headers,'Content-Length':content.length});
      res.end(req.method === 'HEAD' ? undefined : content);return;
    }
    console.error('Missing local file:',pathname);
    res.writeHead(404);res.end('File not found: '+pathname);
  } catch(error) {res.writeHead(500,{'Content-Type':'text/plain; charset=utf-8'});res.end(error.message);}
});
server.on('error',error=>{console.error(error.message);process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}/?isPreview=true&autoplay=0&muted=1`));
