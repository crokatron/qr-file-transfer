import { chromium } from '@playwright/test';
import QRCode from 'qrcode';
import { prepare } from './protocol.js';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve,extname,sep } from 'node:path';
import assert from 'node:assert/strict';
const root=resolve(import.meta.dirname,'../site');
const server=createServer(async(req,res)=>{try{const path=new URL(req.url,'http://localhost').pathname,p=resolve(root,'.'+path+(path.endsWith('/')?'index.html':''));if(!p.startsWith(root+sep))throw Error();res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css'})[extname(p)]||'application/octet-stream');res.end(await readFile(p));}catch{res.statusCode=404;res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const payload=Buffer.from('A harmless recording fixture\n'.repeat(80)),transfer=await prepare([new File([payload],'recording-trial.txt')]),images=[];
for(let g=0;g<transfer.count;g++){const enc=await transfer.window(g);for(let i=0;i<enc.count;i++)images.push(await QRCode.toDataURL([{data:enc.frame(i),mode:'byte'}],{errorCorrectionLevel:'M',scale:8,margin:4}));}
const browser=await chromium.launch({headless:true}),page=await browser.newPage({acceptDownloads:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>Object.defineProperty(window,'showSaveFilePicker',{value:undefined}));
try{
 await page.goto(`http://127.0.0.1:${server.address().port}/qr-transfer/`);
 // Record a synthetic canvas, never the user's desktop/tablet or microphone.
 const video=await page.evaluate(async sources=>{const canvas=document.createElement('canvas');canvas.width=900;canvas.height=900;const ctx=canvas.getContext('2d'),images=await Promise.all(sources.map(src=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src=src;})));const stream=canvas.captureStream(10),recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp8',videoBitsPerSecond:6000000}),chunks=[];const done=new Promise(r=>{recorder.ondataavailable=e=>chunks.push(e.data);recorder.onstop=()=>r();});ctx.fillStyle='white';ctx.fillRect(0,0,900,900);recorder.start();for(const image of [...images,...images]){ctx.drawImage(image,0,0,900,900);await new Promise(r=>setTimeout(r,900));}recorder.stop();await done;stream.getTracks().forEach(t=>t.stop());return Array.from(new Uint8Array(await new Blob(chunks,{type:'video/webm'}).arrayBuffer()));},images);
 await page.locator('#qrVideo').setInputFiles({name:'synthetic-trial.webm',mimeType:'video/webm',buffer:Buffer.from(video)});await page.waitForFunction(()=>document.querySelector('#verification').textContent.includes('All bytes verified'),{},{timeout:45000});assert.match(await page.locator('#readerEstimate').textContent(),/not a measured live camera rate/);const pending=page.waitForEvent('download');await page.getByRole('button',{name:/Save recording-trial/}).click();const d=await pending;assert.deepEqual(await readFile(await d.path()),payload);assert.deepEqual(errors,[]);
 console.log('PASS: synthetic WebM file through Read a recording, actual video/canvas/worker decode, checksum verification and exact output. No tablet/SuperDisplay capture was performed.');
}finally{await browser.close();server.close();}
