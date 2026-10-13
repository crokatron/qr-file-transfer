import { WINDOW, MAX_BYTES } from './protocol.js';
export function estimateTransfer({bytes,block=512,fps=4,readerFps=fps,retryPercent=25,packedPercent=100,lengths=null}){
 if(!Number.isFinite(bytes)||bytes<0||bytes>MAX_BYTES)throw Error('Choose a size between 0 and 8 GiB.');
 if(![256,512,768,1024].includes(block)||![fps,readerFps].every(n=>Number.isFinite(n)&&n>0)||!Number.isFinite(retryPercent)||retryPercent<0||retryPercent>1000||!Number.isFinite(packedPercent)||packedPercent<=0||packedPercent>100)throw Error('Check the payload, frame rates, compression and repeat allowance.');
 let groups,frames,packed;
 if(lengths){groups=lengths.length;frames=lengths.reduce((n,l)=>n+2*Math.ceil(l/block)+8,0);packed=lengths.reduce((a,b)=>a+b,0);}
 else{
  const full=Math.floor(bytes/WINDOW),tail=bytes%WINDOW,ratio=packedPercent/100,groupFrames=raw=>2*Math.ceil(Math.max(1,Math.ceil(raw*ratio))/block)+8;
  // Include an estimated 1 KiB manifest. Prepared transfers use its exact packed size.
  groups=full+(tail?1:0)+1;frames=full*groupFrames(WINDOW)+(tail?groupFrames(tail):0)+groupFrames(1024);packed=Math.ceil(bytes*ratio)+Math.ceil(1024*ratio);
 }
 const effectiveFps=Math.min(fps,readerFps),passSeconds=frames/fps,planningSeconds=frames/effectiveFps*(1+retryPercent/100);
 return {groups,frames,packed,qrBytes:frames*(block+80),passSeconds,planningSeconds,effectiveFps,exact:!!lengths};
}
export function storagePlan({total,saved=0,largest=total,quota=null,usage=0,streamToFile=false,opfs=false}){
 const remaining=Math.max(0,total-saved),overhead=Math.max(64*1024**2,Math.ceil(total*.02)),required=remaining+overhead;
 const available=Number.isFinite(quota)&&quota>0?Math.max(0,quota-usage):null;
 const exportExtra=streamToFile?0:opfs&&largest>64*1024**2?largest:0;
 return {remaining,required,available,exportExtra,receiveFits:available===null?null:available>=required,exportFits:available===null?null:available>=required+exportExtra,largeDownload:largest<=256*1024**2||streamToFile||opfs};
}
