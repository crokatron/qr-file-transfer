import { gzipSync, gunzipSync } from 'fflate';

// MQF1: independent 64 KiB windows, systematic binary fountain frames.
// All integers are little endian. Header 76 bytes, followed by payload and CRC32.
export const WINDOW = 65536, MAX_BYTES = 8 * 1024 ** 3, MAX_WINDOWS = MAX_BYTES / WINDOW + 1;
export const hex = bytes => Array.from(bytes, x => x.toString(16).padStart(2, '0')).join('');
export const hash = async bytes => new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
export const equal = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
const utf8 = new TextEncoder();
export function concat(parts) { const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0)); let at = 0; for (const p of parts) { out.set(p, at); at += p.length; } return out; }
const crcTable = Uint32Array.from({length:256}, (_, i) => { for(let j=0;j<8;j++) i=(i>>>1)^((i&1)?0xedb88320:0);return i>>>0; });
export function crc32(data) { let c=0xffffffff;for(const x of data)c=crcTable[(c^x)&255]^(c>>>8);return (c^0xffffffff)>>>0; }
function xor(a,b) { for(let i=0;i<a.length;i++)a[i]^=b[i]; }
function bits(count, seq) {
  const words=new Uint32Array(Math.ceil(count/32)), phase=seq%(count*2);
  if(phase<count){words[phase>>>5]|=1<<(phase&31);return words;}
  // Nonlinear Mulberry32 mixing: a linear xorshift seed would cap equation rank.
  let state=(seq^Math.imul(count,0x9e3779b1)^0xa5366b4d)>>>0;
  for(let i=0;i<words.length;i++){state=(state+0x6d2b79f5)>>>0;let t=Math.imul(state^(state>>>15),state|1);t^=t+Math.imul(t^(t>>>7),t|61);words[i]=(t^(t>>>14))>>>0;}
  if(count%32)words[words.length-1]&=0xffffffff>>>(32-count%32);
  if(!words.some(Boolean))words[0]=1;
  return words;
}
const bit = (words,i) => (words[i>>>5]>>>(i&31))&1;
export async function prepare(files, progress=()=>{}) {
  if(!files.length || files.length>200)throw Error('Choose between 1 and 200 files. ZIP a folder first.');
  files=[...files].sort((a,b)=>a.name<b.name?-1:a.name>b.name?1:0);
  if(new Set(files.map(f=>f.name)).size!==files.length)throw Error('File names must be unique. Rename duplicates or ZIP them together.');
  const total=files.reduce((n,f)=>n+f.size,0);
  if(total>MAX_BYTES)throw Error('This version supports up to 8 GiB per transfer. Use smaller batches.');
  const manifest={format:'MQF1',window:WINDOW,total,files:files.map(f=>({name:f.name,size:f.size,type:f.type||'application/octet-stream'}))};
  const meta=utf8.encode(JSON.stringify(manifest));
  if(meta.length>WINDOW)throw Error('Too many long file names. ZIP these files first.');
  const blob=new Blob(files), count=Math.ceil(total/WINDOW)+1, digests=[], lengths=[];
  for(let i=0;i<count;i++){
    const raw=i===0?meta:new Uint8Array(await blob.slice((i-1)*WINDOW,i*WINDOW).arrayBuffer());
    digests.push(await hash(raw));const compressed=gzipSync(raw,{level:6,mtime:0});lengths.push(Math.min(raw.length,compressed.length));
    progress(i+1,count);await new Promise(r=>setTimeout(r,0));
  }
  // Deterministic content identity makes sender restarts resumable. No timestamps.
  const id=(await hash(concat(digests))).slice(0,16);
  return {id,manifest,count,digests,lengths,async window(index,block=512){
    if(!Number.isInteger(index)||index<0||index>=count)throw Error('Choose a valid group.');
    const raw=index===0?meta:new Uint8Array(await blob.slice((index-1)*WINDOW,index*WINDOW).arrayBuffer());
    return new Encoder(id,index,count,raw,block,digests[index]);
  }};
}
export class Encoder {
  constructor(id,index,total,raw,block,digest){
    if(![256,512,768,1024].includes(block))throw Error('Invalid QR payload size');
    const zipped=gzipSync(raw,{level:6,mtime:0});this.packed=zipped.length<raw.length?zipped:raw;this.compressed=this.packed===zipped;
    this.id=id;this.index=index;this.total=total;this.rawLength=raw.length;this.block=block;this.digest=digest;this.count=Math.ceil(this.packed.length/block);
  }
  frame(seq){
    if(!Number.isInteger(seq)||seq<0||seq>0xffffffff)throw Error('Invalid sequence');
    const out=new Uint8Array(this.block+80), v=new DataView(out.buffer);out.set([77,81,70,49]);out.set(this.id,4);
    v.setUint32(20,this.index,true);v.setUint32(24,this.total,true);v.setUint32(28,this.rawLength,true);v.setUint32(32,this.packed.length,true);v.setUint32(36,seq,true);v.setUint16(40,this.block,true);v.setUint16(42,this.compressed?1:0,true);out.set(this.digest,44);
    const selected=bits(this.count,seq),payload=out.subarray(76,76+this.block);
    for(let i=0;i<this.count;i++)if(bit(selected,i)){const chunk=this.packed.subarray(i*this.block,(i+1)*this.block);for(let j=0;j<chunk.length;j++)payload[j]^=chunk[j];}
    v.setUint32(out.length-4,crc32(out.subarray(0,-4)),true);return out;
  }
}
export function parse(bytes){
  if(bytes.length<80||bytes[0]!==77||bytes[1]!==81||bytes[2]!==70||bytes[3]!==49)return null;
  const b=Uint8Array.from(bytes),v=new DataView(b.buffer),block=v.getUint16(40,true), flags=v.getUint16(42,true);
  const p={id:b.slice(4,20),index:v.getUint32(20,true),total:v.getUint32(24,true),rawLength:v.getUint32(28,true),length:v.getUint32(32,true),seq:v.getUint32(36,true),block,compressed:flags===1,digest:b.slice(44,76),data:b.slice(76,-4)};
  if(![256,512,768,1024].includes(block)||b.length!==block+80||flags>1||p.total<1||p.total>MAX_WINDOWS||p.index>=p.total||p.rawLength<1||p.rawLength>WINDOW||p.length<1||p.length>WINDOW||(!p.compressed&&p.length!==p.rawLength)||crc32(b.subarray(0,-4))!==v.getUint32(b.length-4,true))throw Error('Damaged QR frame ignored');
  p.key=hex(p.id);p.count=Math.ceil(p.length/block);return p;
}
export class Decoder {
  constructor(p){this.first=p;this.rows=new Array(p.count);this.rank=0;}
  add(p){
    const f=this.first;
    if(p.key!==f.key||p.index!==f.index||p.total!==f.total||p.length!==f.length||p.rawLength!==f.rawLength||p.block!==f.block||p.compressed!==f.compressed||!equal(p.digest,f.digest))throw Error('Inconsistent QR group');
    const mask=bits(p.count,p.seq),data=p.data.slice();
    for(let i=0;i<p.count;i++)if(bit(mask,i)){
      const row=this.rows[i];if(row){xor(mask,row.mask);xor(data,row.data);}else{this.rows[i]={mask,data};this.rank++;return true;}
    }
    if(data.some(Boolean))throw Error('Inconsistent QR equation');return false;
  }
  async finish(){
    const f=this.first;if(this.rank!==f.count)throw Error('Group is incomplete');
    const result=new Uint8Array(f.count*f.block);
    for(let i=f.count-1;i>=0;i--){const {mask,data}=this.rows[i];const out=data.slice();for(let j=i+1;j<f.count;j++)if(bit(mask,j))xor(out,result.subarray(j*f.block,(j+1)*f.block));result.set(out,i*f.block);}
    const packed=result.subarray(0,f.length);let raw=packed;
    if(f.compressed){
      if(packed.length<18||new DataView(packed.buffer,packed.byteOffset,packed.byteLength).getUint32(packed.length-4,true)!==f.rawLength)throw Error('Invalid compressed length');
      // Fixed output buffer prevents a damaged/untrusted compressed frame expanding without bounds.
      raw=gunzipSync(packed,{out:new Uint8Array(f.rawLength)});
    }
    if(raw.length!==f.rawLength||!equal(await hash(raw),f.digest))throw Error('Group checksum failed. Scan this group again.');
    return raw;
  }
}
export function readManifest(raw,totalGroups){
  const m=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(raw));
  if(m.format!=='MQF1'||m.window!==WINDOW||!Number.isSafeInteger(m.total)||m.total<0||m.total>MAX_BYTES||!Array.isArray(m.files)||!m.files.length||m.files.length>200||Math.ceil(m.total/WINDOW)+1!==totalGroups)throw Error('Invalid file manifest');
  let size=0;const names=new Set();for(const f of m.files){if(typeof f.name!=='string'||!f.name||f.name.length>255||/[\\/\x00-\x1f]/.test(f.name)||names.has(f.name)||!Number.isSafeInteger(f.size)||f.size<0||typeof f.type!=='string'||f.type.length>200)throw Error('Invalid file details');names.add(f.name);size+=f.size;}
  if(size!==m.total)throw Error('File sizes do not match');return m;
}
