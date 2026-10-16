import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { root } from '../src/paths.mjs';
const port = Number(process.env.PORT || 5180);
const page = process.argv.includes('--falling') ? '/falling/index.html' : process.argv.includes('--preview') ? '/?view=bouquet' : '/';
const url = `http://127.0.0.1:${port}${page}`;
function openPage() {
  if (process.platform === 'win32') {
    spawn('rundll32.exe', ['url.dll,FileProtocolHandler', url], {windowsHide:true, stdio:'ignore'}).unref();
  } else console.log('Open ' + url);
}
// Both launchers can reuse this project's running server.
try {
  const response = await fetch(`http://127.0.0.1:${port}/health`, {signal: AbortSignal.timeout(800)});
  if (response.ok && (await response.text()) === 'flower-garden-3d') {
    openPage(); process.exit(0);
  }
} catch {}
// Open the browser only after the local server has announced that it is ready.
const child=spawn(process.execPath,[resolve(root,'server.mjs')],{cwd:root,stdio:['inherit','pipe','inherit']});
let opened=false;
child.stdout.on('data',data=>{
  process.stdout.write(data);
  if(!opened&&data.toString().includes('Local:')){
    opened=true;
    openPage();
  }
});
process.on('SIGINT',()=>child.kill());
child.on('exit',code=>{process.exitCode=code||0;});
