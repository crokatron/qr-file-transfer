import jsQR from 'jsqr';
import { parse, Decoder } from './protocol.js';
const groups=new Map();let active=null,completed=new Set();
self.onmessage=async({data:m})=>{
  if(m.type==='session'){active=m.id;completed=new Set(m.received);groups.clear();return;}
  try {
    let bytes=m.bytes;
    if(m.image){const qr=jsQR(new Uint8ClampedArray(m.image),m.width,m.height,{inversionAttempts:'dontInvert'});bytes=qr?.binaryData;}
    const p=bytes&&parse(bytes);if(!p){postMessage({type:'idle'});return;}
    if(active&&p.key!==active){postMessage({type:'other',id:p.key});return;}
    if(!active)active=p.key;
    if(completed.has(p.index)){postMessage({type:'seen',id:p.key,index:p.index});return;}
    let decoder=groups.get(p.index);
    if(decoder&&decoder.first.block!==p.block){groups.delete(p.index);decoder=null;}
    if(!decoder){decoder=new Decoder(p);groups.set(p.index,decoder);if(groups.size>4)groups.delete(groups.keys().next().value);}
    decoder.add(p);
    if(decoder.rank===p.count){groups.delete(p.index);const raw=await decoder.finish();completed.add(p.index);postMessage({type:'group',packet:p,raw},[raw.buffer]);}
    else postMessage({type:'progress',id:p.key,index:p.index,rank:decoder.rank,count:p.count,total:p.total});
  }catch(error){postMessage({type:'error',message:error.message});}
};
