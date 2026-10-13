import { chromium } from '@playwright/test';
import { unzipSync, strFromU8 } from 'fflate';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import assert from 'node:assert/strict';
const root=resolve(import.meta.dirname,'../site'),out=resolve(import.meta.dirname,'../outputs/qr-guides');await mkdir(out,{recursive:true});
const server=createServer(async(req,res)=>{try{const path=new URL(req.url,'http://localhost').pathname,p=resolve(root,'.'+path+(path.endsWith('/')?'index.html':''));if(!p.startsWith(root+sep))throw Error();res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css'})[extname(p)]||'application/octet-stream');res.end(await readFile(p));}catch{res.statusCode=404;res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url=`http://127.0.0.1:${server.address().port}/qr-transfer/`,browser=await chromium.launch({headless:true}),page=await browser.newPage({acceptDownloads:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto(url);await page.locator('.resource-nav a[href="#guide"]').click();assert.equal(new URL(page.url()).hash,'#guide');assert(await page.locator('#guideHeading').isVisible());
 await page.locator('.resource-nav a[href="#senderDownloads"]').click();assert(await page.locator('#downloadHeading').isVisible());assert.equal(await page.locator('#senderDownloads a[href="sender.html"]').count(),1);assert.equal(await page.locator('.native-options').getAttribute('open'),null);
 await page.locator('.native-options>summary').click();
 for(const [kind,name] of [['python','File-Sender-Python.zip'],['powershell','File-Sender-Windows.zip']]){
  await page.locator(`#${kind}Readme>summary`).click();
  const bytes=await readFile(resolve(root,`qr-transfer/sender-${kind}.zip`)),expected=strFromU8(unzipSync(bytes)['README-QR-Transfer.txt']);assert.equal(await page.locator(`#${kind}Readme pre`).textContent(),expected);
  const pending=page.waitForEvent('download');await page.locator(`a[href="sender-${kind}.zip"][download]`).click();const d=await pending;assert.equal(d.suggestedFilename(),name);assert.deepEqual(await readFile(await d.path()),bytes);
 }
 await page.locator('.receiver-option>summary').click();
 for(const [route,name] of [['sender.html','File-Sender.html'],['receiver.html','File-Receiver.html']]){const pending=page.waitForEvent('download');await page.locator(`#senderDownloads a[href="${route}"]`).click();const d=await pending;assert.equal(d.suggestedFilename(),name);assert.deepEqual(await readFile(await d.path()),await readFile(resolve(root,'qr-transfer',route)));}
 for(const width of [1440,390,320]){await page.setViewportSize({width,height:900});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Expanded guides overflow at '+width);await page.screenshot({path:resolve(out,`guides-${width}.png`),fullPage:true});}
 assert.deepEqual(errors,[]);console.log('PASS: visible quick-start anchors, one browser sender, optional receiver, exact ZIP README display, all four download names/content and expanded guide layouts at 1440/390/320px.');
}finally{await browser.close();server.close();}
