import {build} from 'esbuild';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const here=import.meta.dirname,out=new URL('../site/qr-transfer/',import.meta.url);
await mkdir(out,{recursive:true});
const worker=await build({entryPoints:[here+'/scan-worker.js'],bundle:true,platform:'browser',format:'iife',target:'es2022',minify:true,write:false});
const app=await build({entryPoints:[here+'/app.js'],bundle:true,platform:'browser',format:'iife',target:'es2022',minify:true,write:false,define:{__WORKER_SOURCE__:JSON.stringify(worker.outputFiles[0].text)}});
const css=await readFile(here+'/style.css','utf8'),template=await readFile(here+'/template.html','utf8'),js=app.outputFiles[0].text;
let licenses='QR File Transfer browser dependencies\n\n';
for(const pkg of ['qrcode','jsqr','fflate'])licenses+=pkg+'\n'+await readFile(here+'/node_modules/'+pkg+'/LICENSE','utf8')+'\n';
await writeFile(new URL('app.js',out),js);await writeFile(new URL('style.css',out),css);await writeFile(new URL('licenses.txt',out),licenses);
const resources='<section id="guide"><h2>Browser file transfer</h2><p>Start with a small sample, prepare it on the sender and scan it on the receiver. Camera access needs HTTPS or another supported secure context. The stream is not encrypted.</p><a id="offlineSender" href="sender.html" download>Download sender</a> · <a id="offlineReceiver" href="receiver.html" download>Download receiver</a></section>';
for(const [name,mode,offline] of [['index.html','receive',false],['sender.html','send',true],['receiver.html','receive',true]]){
 const style=offline?'<style>'+css+'</style>':'<link rel="stylesheet" href="style.css">';
 const script=offline?'<script>'+js.replaceAll('</script','<\\/script')+'</script><!--'+licenses.replaceAll('-->','-- >')+'-->':'<script src="app.js" defer></script>';
 const html=template.replace('__STYLE__',()=>style).replace('__SCRIPT__',()=>script).replace('__MODE__',mode).replace('__RESOURCES__',()=>resources);
 await writeFile(new URL(name,out),html);
}
console.log('Built standalone browser sender and receiver. No NAS or native packages.');
