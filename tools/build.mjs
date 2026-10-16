import { mkdirSync, cpSync, writeFileSync, copyFileSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { root } from '../src/paths.mjs';
import { renderPage } from '../src/page.mjs';
import { editable } from '../src/editable.mjs';
import { albumRoot, albumPhotos } from '../src/album.mjs';
const dist=resolve(root,'dist');
rmSync(dist,{recursive:true,force:true});
mkdirSync(dist,{recursive:true});
cpSync(resolve(root,'public'),dist,{recursive:true});
const photos = albumPhotos();
if (photos.length) cpSync(albumRoot,resolve(dist,'album'),{recursive:true});
writeFileSync(resolve(dist,'falling/album.json'),JSON.stringify(photos,null,2),'utf8');
for(const [url,source] of Object.entries(editable)) copyFileSync(resolve(root,source),resolve(dist,'.'+url));
copyFileSync(resolve(root,'custom.css'),resolve(dist,'custom.css'));
writeFileSync(resolve(dist,'index.html'),renderPage(),'utf8');
// GitHub project sites live under /repository/, while the local server uses /.
const basePath = process.env.SITE_BASE_PATH || '/';
if (!/^\/(?:[A-Za-z0-9_-]+\/)*$/.test(basePath)) throw Error('SITE_BASE_PATH must start and end with /');
if (basePath !== '/') {
  const names = readdirSync(dist).map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const assetPath = new RegExp('(["\'`(])/((?:' + names + ')(?=[/"\'`)?#]|$))', 'g');
  function rewrite(directory) {
    for (const entry of readdirSync(directory,{withFileTypes:true})) {
      const path = resolve(directory,entry.name);
      if (entry.isDirectory()) rewrite(path);
      else if (/\.(html|css|js|json|svg)$/.test(entry.name)) {
        const content = readFileSync(path,'utf8').replace(assetPath,(_,prefix,name)=>prefix+basePath+name)
          .replace(/href=(["'])\/\1/g,(_,quote)=>`href=${quote}${basePath}${quote}`);
        writeFileSync(path,content,'utf8');
      }
    }
  }
  rewrite(dist);
}
writeFileSync(resolve(dist,'.nojekyll'),'');
console.log('Built dist/ with local JavaScript, photos, fonts and audio.');
