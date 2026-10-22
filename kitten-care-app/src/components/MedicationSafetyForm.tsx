import { useRef,useState } from 'react';
import type { Medication } from '../domain/models';
import { readMedicationSafety,safetyPolicyErrors } from '../domain/medicationSafety';
import { Dialog } from './Dialog';
import { MedicationSafetyFields } from './MedicationSafetyFields';

export function MedicationSafetyForm({medication,onClose,onSave}:{medication:Medication;onClose:()=>void;onSave:(medication:Medication,expectedPlan?:string)=>Promise<boolean>}){
  const [error,setError]=useState(''),[saving,setSaving]=useState(false);
  const originalPlan=useRef(JSON.stringify(medication));
  return <Dialog title={`Safety settings · ${medication.name}`} onClose={onClose}><form onSubmit={async event=>{
    event.preventDefault();if(saving)return;if(JSON.stringify(medication)!==originalPlan.current){setError('This plan changed elsewhere. Copy your edits and reopen it before saving; the newer plan has not been overwritten.');return}const safety=readMedicationSafety(new FormData(event.currentTarget)),errors=safetyPolicyErrors(safety);
    if(errors.length){setError(errors.join(' '));return}setSaving(true);
    try{if(!await onSave({...medication,safety},originalPlan.current))setError('Not saved. Keep this form open and try again.')}finally{setSaving(false)}
  }}><MedicationSafetyFields value={medication.safety}/>{error&&<p role="alert">{error}</p>}<div className="actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button disabled={saving}>Save safety settings</button></div></form></Dialog>;
}
