import { chromium } from '@playwright/test';
import { prepare } from './protocol.js';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve,extname } from 'node:path';
import assert from 'node:assert/strict';
const root=resolve(import.meta.dirname,'../site/qr-transfer');
const server=createServer(async(req,res)=>{try{const name=req.url==='/'?'index.html':req.url.slice(1);if(!['index.html','app.js','style.css'].includes(name))throw Error();res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css'})[extname(name)]);res.end(await readFile(resolve(root,name)));}catch{res.statusCode=404;res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true}),page=await browser.newPage({acceptDownloads:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{const Native=Worker;window.Worker=class extends Native{constructor(...a){super(...a);window.testWorker=this;}};Object.defineProperty(window,'showSaveFilePicker',{value:undefined});});
try{
 const payload=Buffer.alloc(Number(process.argv[2]||65*1024**2+19),0xa7);payload[0]=0;payload[payload.length-1]=255;const expected=createHash('sha256').update(payload).digest('hex');
 const transfer=await prepare([new File([payload],'large-binary.dat')]);await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.waitForFunction(()=>!!window.testWorker);
 for(let i=0;i<transfer.count;i++){
   const enc=await transfer.window(i);assert.equal(enc.count,1,'fixture compression');await page.evaluate(bytes=>window.testWorker.postMessage({bytes}),Array.from(enc.frame(0)));await page.waitForFunction(n=>Number(document.querySelector('#receiveCount').textContent)===n,i+1);
   if(i===512){const id=await page.locator('#sessions').inputValue();await page.reload();await page.waitForFunction(()=>!!window.testWorker);await page.locator('#sessions').selectOption(id);await page.waitForFunction(()=>document.querySelector('#receiveCount').textContent==='513');}
   if(i%256===0)console.log('Large transfer groups:',i+1,'/',transfer.count);
 }
 await page.waitForFunction(()=>document.querySelector('#verification').textContent.includes('All bytes verified'),{},{timeout:60000});const wait=page.waitForEvent('download',{timeout:60000});await page.getByRole('button',{name:/Save large-binary/}).click();const download=await wait,path=await download.path();const digest=createHash('sha256');let length=0;for await(const bytes of createReadStream(path)){length+=bytes.length;digest.update(bytes);}assert.equal(length,payload.length);assert.equal(digest.digest('hex'),expected);assert.deepEqual(errors,[]);
 console.log(`PASS: ${length} bytes, ${transfer.count} saved groups, mid-transfer reload/resume, full identity verification and OPFS-backed large download matched SHA-256.`);
}finally{await browser.close();server.close();}
