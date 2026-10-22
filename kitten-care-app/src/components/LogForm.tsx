import { useEffect,useRef,useState,type FormEvent } from 'react';
import type { CareState,CareEventType,CareEvent } from '../domain/models';
import { activeKittens,localDateTimeValue } from '../domain/care';
import { calculateDose } from '../domain/medication';
import { ageInDays,medicationSafetyWarnings } from '../domain/medicationSafety';
import { validateCareDraft } from '../domain/validation';
import { createId } from '../domain/ids';
import { rescueDoseIssues } from '../domain/rescueMedications';
import { Dialog } from './Dialog';
import { DateField } from './DateField';
import { MedicationDosePanel } from './MedicationDosePanel';

export function LogForm({state,type,initialKittenId,initialMedId,onClose,onSave}:{state:CareState;type:CareEventType;initialKittenId?:string;initialMedId?:string;onClose:()=>void;onSave:(event:CareEvent)=>Promise<boolean>}){
  const kittens=activeKittens(state),[errors,setErrors]=useState<string[]>([]),[kittenId,setKittenId]=useState(initialKittenId||kittens[0]?.id||''),[medId,setMedId]=useState(initialMedId||''),[when,setWhen]=useState(localDateTimeValue()),[saving,setSaving]=useState(false),[medicationStatus,setMedicationStatus]=useState('given');
  const submitting=useRef(false),kitten=kittens.find(k=>k.id===kittenId),medications=kitten?.medications||[],medication=medications.find(m=>m.id===medId)||medications[0];
  const errorPanel=useRef<HTMLDivElement>(null);
  useEffect(()=>{if(errors.length){errorPanel.current?.focus();errorPanel.current?.scrollIntoView({block:'nearest'})}},[errors]);
  const submit=async(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();if(submitting.current)return;
    const form=new FormData(event.currentTarget),data:CareEvent['data']={};
    for(const key of ['note','outcome','amount','unit','food','grams','medId','status','adminAmount','adminUnit','doseSlot','urine','stool','recheckedWeightG','safetyReason','safetyApproval'])if(form.has(key))data[key]=String(form.get(key)||'');
    for(const key of ['confirmed','staleWeightApproved','safetyAcknowledged'])data[key]=form.get(key)==='on';
    if(type==='medication'&&medication&&kitten){
      const dose=calculateDose(state,kitten,medication);
      Object.assign(data,{dobAtAdministration:kitten.dob,ageDays:ageInDays(kitten,new Date(when)),medName:medication.name,route:medication.route,prescriptionSource:medication.source,prescribedUnit:medication.unit,prescribedAmount:dose?(medication.unit==='mg'?dose.mg:dose.ml):medication.manualDose,planSnapshot:JSON.stringify(medication),safetySnapshot:JSON.stringify(medication.safety||{}),instructionRevision:medication.rescueChart?.revision||'custom',safetyWarnings:JSON.stringify(medicationSafetyWarnings(state,kitten,medication,data.adminAmount,String(data.adminUnit||''),new Date(when),new Date(),String(data.doseSlot||'')))});
      if(dose)Object.assign(data,{weightG:dose.weightG,weightRecordedAt:dose.weightRecordedAt,treatmentDay:dose.treatmentDay,rateMlPerLb:dose.rateMlPerLb});
    }
    const result=validateCareDraft(state,{type,kittenId,when,data});
    if(!result.valid){setErrors(result.errors);return}
    submitting.current=true;setSaving(true);setErrors([]);
    try{const now=new Date().toISOString();if(await onSave({id:createId('evt'),kittenId,type,ts:new Date(when).toISOString(),createdAt:now,updatedAt:now,data}))onClose();else setErrors(['Your entry was not saved. Another tab or storage may have changed. Review the current details; your form is still open.'])}finally{submitting.current=false;setSaving(false)}
  };
  const chartBlocked=medication?.rescueChart&&kitten&&rescueDoseIssues(state,kitten,medication).length>0;
  if(!kittens.length)return <Dialog title={`Log ${type}`} onClose={onClose}><p>Add a kitten before logging care.</p></Dialog>;
  return <Dialog title={`Log ${type}`} onClose={onClose}><form noValidate onSubmit={submit}>
    {errors.length>0&&<div className="validation-summary" role="alert" ref={errorPanel} tabIndex={-1}><b>Please review:</b><ul>{errors.map(error=><li key={error}>{error}</li>)}</ul></div>}
    <label>Kitten<select name="kittenId" value={kittenId} onChange={event=>{setKittenId(event.target.value);setMedId('');setMedicationStatus('given')}}>{kittens.map(k=><option key={k.id} value={k.id}>{k.name}</option>)}</select></label>
    {type==='feeding'&&<><label>What happened?<select name="outcome"><option value="fed">Fed successfully</option><option value="refused">Refused food</option><option value="unable">Unable to feed</option></select></label><div className="two"><label>Amount eaten<input name="amount" inputMode="decimal" placeholder="Required when fed"/></label><label>Unit<select name="unit"><option>mL</option><option>g</option><option>oz</option></select></label></div><label>Food<input name="food"/></label></>}
    {type==='weight'&&<label>Weight in grams *<input name="grams" type="number" min="1" max="12000" required/></label>}
    {type==='health'&&<><label>Observed status<select name="status" defaultValue=""><option value="">Choose an observation</option><option>Normal</option><option>Monitor</option><option>Concern</option></select></label><p className="info">Describe what you observed. For urgent concerns, follow rescue instructions and use Need help now.</p></>}
    {type==='potty'&&<div className="two"><label>Urine<select name="urine"><option value="unknown">Not observed</option><option value="yes">Yes</option><option value="no">No</option></select></label><label>Stool<select name="stool"><option>Not observed</option><option>Normal</option><option>Soft</option><option>Diarrhea</option><option>Hard</option><option>Abnormal color</option></select></label></div>}
    {type==='medication'&&(medication&&kitten?<MedicationDosePanel key={kitten.id+medication.id} state={state} kitten={kitten} medication={medication} medications={medications} onStatus={setMedicationStatus} onMedication={id=>{setMedId(id);setMedicationStatus('given')}} when={when}/>:<p>Add a medication plan to this kitten before logging a dose.</p>)}
    <label>Notes<textarea name="note" placeholder={type==='feeding'?'Required if refused or unable':''}/></label><label>Date and time<DateField name="when" type="datetime-local" step="1" value={when} onChange={event=>setWhen(event.target.value)}/></label>
    <div className="actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button disabled={saving||type==='medication'&&(!medication||medicationStatus==='given'&&Boolean(chartBlocked))}>{saving?'Saving…':'Review and save'}</button></div>
  </form></Dialog>;
}
