import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { prepare, parse, Decoder, hex, crc32, readManifest, WINDOW } from './protocol.js';
const files=[new File([randomBytes(2*1024**2+73)],'random.bin'),new File(['hello,world\n'.repeat(20000)],'table.csv'),new File([],'empty.txt')];
const transfer=await prepare(files),again=await prepare([...files].reverse());assert.equal(hex(transfer.id),hex(again.id),'stable resume identity');
const recovered=[],counts=[];
for(let group=transfer.count-1;group>=0;group--){
  const enc=await transfer.window(group,[256,512,768,1024][group%4]),decoder=new Decoder(parse(enc.frame(0)));
  let received=0;
  // Lose all systematic frames; accept only random fountain equations, reversed batches and duplicates.
  for(let cycle=0;decoder.rank<enc.count&&cycle<8;cycle++){
    const frames=Array.from({length:enc.count},(_,i)=>enc.frame(cycle*enc.count*2+enc.count+i)).reverse();
    for(let i=0;i<frames.length&&decoder.rank<enc.count;i++){if((i+cycle)%5===0)continue;const p=parse(frames[i]);decoder.add(p);decoder.add(p);received++;}
  }
  assert.equal(decoder.rank,enc.count,`fountain recovery group ${group}`);recovered[group]=await decoder.finish();counts.push(received);
}
const meta=readManifest(recovered[0],transfer.count),all=Buffer.concat(recovered.slice(1));let at=0;
for(const f of [...files].sort((a,b)=>a.name<b.name?-1:1)){assert.deepEqual(all.subarray(at,at+f.size),Buffer.from(await f.arrayBuffer()));at+=f.size;}
assert.equal(meta.total,all.length);
const enc=await transfer.window(0),broken=enc.frame(0);broken[90]^=1;assert.throws(()=>parse(broken),/Damaged/);
const invalid=enc.frame(0),view=new DataView(invalid.buffer);view.setUint32(28,WINDOW+1,true);view.setUint32(invalid.length-4,crc32(invalid.subarray(0,-4)),true);assert.throws(()=>parse(invalid));
const other=await prepare([new File(['different'],'other.txt')]),otherFrame=(await other.window(0)).frame(0);const d=new Decoder(parse(enc.frame(0)));assert.throws(()=>d.add(parse(otherFrame)));
assert.throws(()=>readManifest(new TextEncoder().encode(JSON.stringify({...meta,files:[{name:'../unsafe',size:meta.total,type:'text/plain'}]})),transfer.count));
await assert.rejects(prepare([new File(['a'],'same'),new File(['b'],'same')]),/unique/);
console.log(`PASS: ${files.length} files, ${all.length} exact bytes, ${transfer.count} independent windows; fountain-only recovery with 20% loss, reversed frames and duplicates; stable resume ID, corruption, bounds and path checks.`);
