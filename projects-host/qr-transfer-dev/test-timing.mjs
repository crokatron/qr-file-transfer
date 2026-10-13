import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { prepare, WINDOW } from './protocol.js';
import { estimateTransfer,storagePlan } from './timing.js';
const transfer=await prepare([new File([randomBytes(WINDOW*2+37)],'random.bin'),new File(['same'.repeat(WINDOW)],'compressible.txt')]);
for(const block of [256,512,768,1024]){
 let frames=0;for(let i=0;i<transfer.count;i++){const enc=await transfer.window(i,block);frames+=2*enc.count+8;assert.equal(enc.frame(0).length,block+80);}
 const r=estimateTransfer({bytes:transfer.manifest.total,block,fps:4,lengths:transfer.lengths,retryPercent:50,readerFps:2});assert.equal(r.frames,frames);assert.equal(r.passSeconds,frames/4);assert.equal(r.planningSeconds,frames/2*1.5);assert.equal(r.qrBytes,frames*(block+80));assert(r.exact);
}
const decimal=estimateTransfer({bytes:4e9,retryPercent:0}),binary=estimateTransfer({bytes:4*1024**3,retryPercent:0});assert(Math.abs(decimal.passSeconds/86400-46.624)<.01);assert(Math.abs(binary.passSeconds/86400-50.062)<.01);assert.equal(binary.groups,65537);
assert(estimateTransfer({bytes:4e9,packedPercent:10}).passSeconds<decimal.passSeconds);assert(estimateTransfer({bytes:4e9,readerFps:1}).planningSeconds>decimal.passSeconds);assert.throws(()=>estimateTransfer({bytes:9*1024**3}));assert.throws(()=>estimateTransfer({bytes:1,readerFps:0}));
assert.equal(storagePlan({total:4e9,quota:2e9}).receiveFits,false);assert.equal(storagePlan({total:4e9,saved:3e9,quota:5e9,usage:3e9,opfs:true}).receiveFits,true);assert.equal(storagePlan({total:4e9,saved:3e9,quota:5e9,usage:3e9,opfs:true}).exportFits,false);assert.equal(storagePlan({total:4e9,quota:5e9,streamToFile:true}).exportExtra,0);assert.equal(storagePlan({total:4e9}).largeDownload,false);assert.equal(storagePlan({total:4e9}).receiveFits,null);
console.log('PASS: estimates match actual protocol frames/header bytes at all payloads; 4 GB/GiB math, compression assumptions, slower reader/repeats, bounds, resume quota and streaming/OPFS scratch budgets. No 4 GB payload or hardware speed claim.');
