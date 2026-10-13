import { WINDOW, hex, hash, concat, readManifest, equal } from './protocol.js';
const done=tx=>new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('Storage interrupted'));});
const result=req=>new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
export class Store {
  async open(){const req=indexedDB.open('mungoon-qr-transfer-v1',1);req.onupgradeneeded=()=>{req.result.createObjectStore('sessions',{keyPath:'id'});req.result.createObjectStore('groups',{keyPath:['id','index']});};this.db=await result(req);return this;}
  async sessions(){return result(this.db.transaction('sessions').objectStore('sessions').getAll());}
  async session(id){return result(this.db.transaction('sessions').objectStore('sessions').get(id));}
  async group(id,index){return result(this.db.transaction('groups').objectStore('groups').get([id,index]));}
  writeTransaction(stores){try{return this.db.transaction(stores,'readwrite',{durability:'strict'});}catch(e){if(e instanceof TypeError||e.name==='NotSupportedError')return this.db.transaction(stores,'readwrite');throw e;}}
  async accept(p,raw){
    if(raw.length!==p.rawLength||!equal(await hash(raw),p.digest))throw Error('Cannot save an unverified group');
    const manifest=p.index===0?readManifest(raw,p.total):null;
    const tx=this.writeTransaction(['sessions','groups']),promise=done(tx),sessions=tx.objectStore('sessions'),groups=tx.objectStore('groups');
    const s=await result(sessions.get(p.key))||{id:p.key,total:p.total,received:[],created:Date.now(),bytes:0};
    if(s.total!==p.total){tx.abort();await promise;throw Error('Session size changed');}
    if(!s.received.includes(p.index)){groups.put({id:p.key,index:p.index,raw,digest:p.digest});s.received.push(p.index);s.bytes+=raw.length;}
    if(manifest){s.manifest=manifest;s.manifestBytes=raw.length;}s.updated=Date.now();sessions.put(s);await promise;return s;
  }
  async verify(s,progress=()=>{}){
    if(s.received.length!==s.total||!s.manifest)throw Error('Some groups are still missing');
    const digests=[];for(let i=0;i<s.total;i++){const g=await this.group(s.id,i);if(!g)throw Error('A saved group is missing');const expected=i===0?g.raw.length:Math.min(WINDOW,s.manifest.total-(i-1)*WINDOW);if(g.raw.length!==expected)throw Error('Saved group length is incorrect');const d=await hash(g.raw);if(!equal(d,g.digest))throw Error('Saved data failed its checksum');digests.push(d);progress(i+1,s.total);}
    if(hex((await hash(concat(digests))).slice(0,16))!==s.id)throw Error('Transfer identity failed. Do not use these files.');return true;
  }
  async *fileParts(s,index){let start=s.manifest.files.slice(0,index).reduce((n,f)=>n+f.size,0),remaining=s.manifest.files[index].size;while(remaining){const group=Math.floor(start/WINDOW)+1,offset=start%WINDOW,g=await this.group(s.id,group);if(!g)throw Error('File is incomplete');const size=Math.min(remaining,g.raw.length-offset);if(size<=0)throw Error('Invalid stored file');yield g.raw.subarray(offset,offset+size);start+=size;remaining-=size;}}
  async remove(id){const tx=this.writeTransaction(['sessions','groups']),promise=done(tx);tx.objectStore('sessions').delete(id);tx.objectStore('groups').delete(IDBKeyRange.bound([id,0],[id,Number.MAX_SAFE_INTEGER]));await promise;}
}
