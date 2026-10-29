import {useRef,useState} from 'react';
import type {Kitten} from '../domain/models';
import {Dialog} from './Dialog';
import {PhotoField} from './PhotoField';
export function KittenPhotoEditor({kitten,onClose,onSave}:{kitten:Kitten;onClose:()=>void;onSave:(photo:string|null,expectedPhoto:string|null)=>Promise<boolean>}){
 const original=useRef(kitten.photo),[saving,setSaving]=useState(false),[error,setError]=useState('');
 return <Dialog title={`Update photo · ${kitten.name}`} onClose={onClose}><form onSubmit={async event=>{event.preventDefault();if(saving)return;const data=new FormData(event.currentTarget);setSaving(true);setError('');try{if(!await onSave(String(data.get('photo')||'')||null,original.current))setError('Photo not saved. Your selection is still here. Check the message above and try again.')}catch(err){setError(err instanceof Error?err.message:'Photo could not be saved. Try again.')}finally{setSaving(false)}}}><p>Choose a new picture, take a photo on a supported phone, or remove the current photo. Care Now shows the full photo without cropping.</p><PhotoField initialPhoto={original.current||''}/>{error&&<p role="alert" className="validation-summary">{error}</p>}<div className="actions"><button className="secondary" type="button" onClick={onClose}>Cancel</button><button disabled={saving}>{saving?'Saving…':'Save photo'}</button></div></form></Dialog>;
}
