import { chromium } from '@playwright/test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true}),errors=[];
try{
 for(const fallback of [false,true]){
  const context=await browser.newContext({offline:true,viewport:{width:1280,height:900}});
  await context.addInitScript(fallback=>{const native=window.open;window.open=function(...args){const w=native.apply(this,args);window.testPopup=w;return w;};if(fallback)Object.defineProperty(window,'documentPictureInPicture',{value:undefined});},fallback);
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(pathToFileURL(process.argv[2]||resolve(import.meta.dirname,'../site/qr-transfer/sender.html')).href);
  await page.locator('#files').setInputFiles({name:'stand-test.bin',mimeType:'application/octet-stream',buffer:Buffer.alloc(20000,17)});await page.locator('#prepare').click();await page.waitForFunction(()=>!document.querySelector('#floating').disabled);await page.locator('#floating').click();
  await page.waitForFunction(()=>{const w=window.documentPictureInPicture?.window||window.testPopup;return !!w?.document.querySelector('#qr');});
  const state=await page.evaluate(()=>{const w=window.documentPictureInPicture?.window||window.testPopup,c=w.document.querySelector('#qr').getBoundingClientRect();return {width:w.innerWidth,height:w.innerHeight,qrWidth:c.width,qrHeight:c.height,left:c.left,top:c.top,pip:!!window.documentPictureInPicture?.window};});
  assert(state.qrWidth>180&&state.qrWidth<=state.width&&state.qrHeight===state.qrWidth,JSON.stringify(state));
  await page.evaluate(()=>{const w=window.documentPictureInPicture?.window||window.testPopup;w.document.querySelector('#play').click();});
  const background=await context.newPage();await background.goto('about:blank');await background.bringToFront();
  await page.waitForFunction(()=>{const w=window.documentPictureInPicture?.window||window.testPopup;return /frame [3-9]/.test(w.document.querySelector('#sendPosition').textContent);},{},{polling:100,timeout:15000});
  if(fallback){const popup=context.pages().find(p=>p!==page&&p!==background);assert(popup);await popup.screenshot({path:resolve(import.meta.dirname,'../../outputs/qr-transfer/floating-offline.png')});}
  await page.evaluate(()=>{const w=window.documentPictureInPicture?.window||window.testPopup;w.document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));});await page.waitForFunction(()=>{const w=window.documentPictureInPicture?.window||window.testPopup;return w.document.querySelector('#qr').style.display==='none'&&w.document.querySelector('#play').textContent==='Start sending';});await page.evaluate(()=>{const w=window.documentPictureInPicture?.window||window.testPopup;w.close();});
  await page.bringToFront();await page.waitForFunction(()=>document.querySelector('#transmitter')&&document.querySelector('#play').textContent==='Start sending');
  console.log('PASS:',fallback?'normal popup fallback':'native floating window','offline; QR fits',state.width+'×'+state.height,'and continues with the sender tab in the background. PiP:',state.pip);
  await context.close();
 }
 assert.deepEqual(errors,[]);
}finally{await browser.close();}
