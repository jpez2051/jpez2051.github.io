import {useRef,useState,type ChangeEvent} from 'react';

function PhotoIcon({camera=false}:{camera?:boolean}){
 return <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{camera?<><path d="M8 5l1-2h6l1 2h4a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V7a2 2 0 012-2z"/><circle cx="12" cy="12" r="4"/></>:<><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.5"/><path d="M3 17l5-5 4 4 4-6 5 7"/></>}</svg>;
}
async function readPhoto(file:File){
 let source:CanvasImageSource,width:number,height:number,cleanup=()=>{};
 try{const bitmap=await createImageBitmap(file);source=bitmap;width=bitmap.width;height=bitmap.height;cleanup=()=>bitmap.close()}
 catch{const url=URL.createObjectURL(file),image=new Image();try{await new Promise<void>((resolve,reject)=>{image.onload=()=>resolve();image.onerror=reject;image.src=url});source=image;width=image.naturalWidth;height=image.naturalHeight;cleanup=()=>URL.revokeObjectURL(url)}catch(error){URL.revokeObjectURL(url);throw error}}
 try{const scale=Math.min(1,640/Math.max(width,height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(width*scale));canvas.height=Math.max(1,Math.round(height*scale));const context=canvas.getContext('2d');if(!context)throw new Error('Photo unavailable');context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(source,0,0,canvas.width,canvas.height);return canvas.toDataURL('image/jpeg',0.8)}finally{cleanup()}
}
export function PhotoField({initialPhoto=''}:{initialPhoto?:string}){
 const [photo,setPhoto]=useState(initialPhoto),[error,setError]=useState(''),[loading,setLoading]=useState(false);
 const selection=useRef(0),library=useRef<HTMLInputElement>(null),camera=useRef<HTMLInputElement>(null);
 function validity(message:string){library.current?.setCustomValidity(message);camera.current?.setCustomValidity(message)}
 async function select(event:ChangeEvent<HTMLInputElement>){
  const input=event.currentTarget,file=input.files?.[0];if(!file)return;
  const request=++selection.current;validity('');setError('');setLoading(false);
  if((file.type&&!file.type.startsWith('image/'))||file.size>20*1024*1024){setError('Choose an image smaller than 20 MB. Your existing photo is kept.');input.value='';return}
  setLoading(true);validity('Wait for the photo to finish preparing.');
  try{const result=await readPhoto(file);if(request===selection.current)setPhoto(result)}
  catch{if(request===selection.current)setError('That photo could not be opened. Try a JPG, PNG or WebP image. Your existing photo is kept.')}
  finally{input.value='';if(request===selection.current){setLoading(false);validity('')}}
 }
 return <div className="photo-field"><b>Kitten photo (optional)</b><div className="photo-choices"><label className="photo-choice"><PhotoIcon/>Choose photo<input ref={library} type="file" aria-label="Choose photo from device" accept="image/*" onChange={select}/></label><label className="photo-choice"><PhotoIcon camera/>Take photo<input ref={camera} type="file" aria-label="Take a photo" accept="image/*" capture="environment" onChange={select}/></label></div><p className="photo-help">Choose a picture from your device, or use the camera on a supported phone.</p>{loading&&<p role="status">Preparing photo… Wait before saving.</p>}{error&&<p role="alert">{error}</p>}{photo&&<div className="selected-photo"><img className="photo-preview" src={photo} alt="Selected kitten photo"/><button type="button" className="photo-remove" onClick={()=>{selection.current++;setPhoto('');setError('');setLoading(false);validity('')}}>Remove photo</button></div>}<input name="photo" type="hidden" value={photo}/></div>;
}
