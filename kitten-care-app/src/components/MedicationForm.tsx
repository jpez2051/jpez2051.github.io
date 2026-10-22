import { MedicationSafetyFields } from './MedicationSafetyFields';
import { readMedicationSafety,safetyPolicyErrors } from '../domain/medicationSafety';
import { useState,type ReactNode } from 'react';
import { Dialog } from './Dialog';
import { DateField } from './DateField';
import { localDateKey } from '../domain/care';
import { createId } from '../domain/ids';
import { scheduleErrors } from '../domain/schedule';
import type { CareState, Kitten, Medication, MedicationSchedule } from '../domain/models';
import { RescueMedicationForm } from './RescueMedicationForm';
import { RESCUE_MEDICATIONS,rescueTemplate } from '../domain/rescueMedications';

const scheduleOptions: [MedicationSchedule['type'],string][]=[['daily','Once daily'],['twiceDaily','Twice daily'],['threeDaily','Three times daily'],['intervalHours','Every set number of hours'],['intervalDays','Every set number of days'],['specificDays','Selected weekdays'],['oneTime','One-time dose'],['prn','As needed (PRN)']];

export function MedicationForm({state,kitten,onClose,onSave}:{state:CareState;kitten:Kitten;onClose:()=>void;onSave:(medication:Medication)=>Promise<boolean>}) {
  const [selected,setSelected]=useState('custom');
  const selector=<label>Choose a medication<select value={selected} onChange={(event)=>setSelected(event.target.value)}><option value="custom">Other medication — enter instructions</option>{RESCUE_MEDICATIONS.map((template)=><option key={template.id} value={template.id}>{template.name}</option>)}</select></label>;
  const template=rescueTemplate(selected);
  return template?<RescueMedicationForm key={selected} template={template} state={state} kitten={kitten} selector={selector} onClose={onClose} onSave={onSave}/>:<CustomMedicationForm kitten={kitten} selector={selector} onClose={onClose} onSave={onSave}/>;
}

function CustomMedicationForm({kitten,selector,onClose,onSave}:{kitten:Kitten;selector:ReactNode;onClose:()=>void;onSave:(medication:Medication)=>Promise<boolean>}) {
  const [mode,setMode]=useState<'manual'|'weightBased'>('manual'),[type,setType]=useState<MedicationSchedule['type']>('daily'),[error,setError]=useState(''),[saving,setSaving]=useState(false);
  const timed=['daily','twiceDaily','threeDaily','specificDays'].includes(type),timeCount=type==='twiceDaily'?2:type==='threeDaily'?3:1;
  return <Dialog title={`Add medication · ${kitten.name}`} onClose={onClose}><form onSubmit={async(event)=>{
    event.preventDefault();if(saving)return;
    const data=new FormData(event.currentTarget),manual=Number(data.get('manualDose')),rate=Number(data.get('rate')),concentration=Number(data.get('concentration')),start=String(data.get('startDate')),end=String(data.get('endDate'));
    const safety=readMedicationSafety(data);if(safetyPolicyErrors(safety).length){setError(safetyPolicyErrors(safety).join(' '));return}
    if(mode==='manual'&&(!Number.isFinite(manual)||manual<=0)){setError('Enter a positive fixed amount.');return}
    if(mode==='weightBased'&&(!Number.isFinite(rate)||rate<=0||!Number.isFinite(concentration)||concentration<=0)){setError('Enter a positive prescribed rate and concentration.');return}
    if(end&&end<start){setError('End date cannot be before the start date.');return}
    const schedule:MedicationSchedule={type};
    if(timed)schedule.times=Array.from({length:timeCount},(_,index)=>String(data.get(`time${index}`)));
    if(type==='specificDays')schedule.days=data.getAll('days').map(String);
    if(type==='oneTime')schedule.oneTimeAt=new Date(String(data.get('oneTimeAt'))).toISOString();
    if(type==='intervalHours'||type==='intervalDays'){
      if(type==='intervalHours')schedule.intervalHours=Number(data.get('interval'));else schedule.intervalDays=Number(data.get('interval'));
      schedule.firstDoseAt=new Date(String(data.get('firstDoseAt'))).toISOString();
    }
    const errors=scheduleErrors(schedule);
    const anchor=schedule.oneTimeAt||schedule.firstDoseAt;
    if(anchor&&(localDateKey(new Date(anchor))<start||(end&&localDateKey(new Date(anchor))>end)))errors.push('The first dose must fall within the prescription dates.');
    if(errors.length){setError(errors.join(' '));return}
    setSaving(true);setError('');
    try{const saved=await onSave({id:createId('med'),safety,name:String(data.get('name')).trim(),route:String(data.get('route')),source:String(data.get('source')),manualDose:mode==='manual'?String(manual):'',unit:String(data.get('unit')),doseCalc:{mode,rate:mode==='weightBased'?rate:undefined,rateUnit:String(data.get('rateUnit')) as 'mg/kg'|'mcg/kg',concentration:mode==='weightBased'?concentration:null},schedule,startDate:start,endDate:end,instructions:String(data.get('instructions'))});if(!saved)setError('The medication plan was not saved. Check browser storage and try again.')}finally{setSaving(false)}
  }}>
    {selector}
    <div className="warning"><b>Use current rescue or veterinary instructions.</b> Confirm the bottle concentration and prescribed schedule.</div>
    {error&&<div className="validation-summary" role="alert">{error}</div>}
    <label>Medication name *<input name="name" required/></label>
    <label>Prescribed by or source *<input name="source" required/></label>
    <label>Route *<select name="route" required><option value="">Choose route</option><option>Oral</option><option>Topical</option><option>Eye</option><option>Ear</option><option>Injection by authorized person</option></select></label>
    <label>Dose method<select name="mode" value={mode} onChange={(event)=>setMode(event.target.value as 'manual'|'weightBased')}><option value="manual">Fixed amount</option><option value="weightBased">Weight based</option></select></label>
    {mode==='manual'?<div className="two"><label>Fixed amount *<input name="manualDose" type="number" min="0" step="any" required/></label><label>Unit<select name="unit"><option>mL</option><option>mg</option><option>tablet</option><option>drop</option></select></label></div>:<><div className="two"><label>Prescribed rate *<input name="rate" type="number" min="0" step="any" required/></label><label>Rate unit<select name="rateUnit"><option>mg/kg</option><option>mcg/kg</option></select></label></div><label>Concentration in mg/mL *<input name="concentration" type="number" min="0" step="any" required/></label><label>Administration unit<select name="unit"><option>mL</option><option>mg</option></select></label></>}
    <div className="two"><label>Start date<DateField name="startDate" defaultValue={localDateKey()} required/></label><label>End date<DateField name="endDate"/></label></div>
    <label>Schedule<select value={type} onChange={(event)=>setType(event.target.value as MedicationSchedule['type'])}>{scheduleOptions.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
    {timed&&Array.from({length:timeCount},(_,index)=><label key={index}>Dose time {index+1}<input name={`time${index}`} type="time" defaultValue={['08:00',type==='threeDaily'?'14:00':'20:00','20:00'][index]} required/></label>)}
    {type==='specificDays'&&<fieldset><legend>Weekdays</legend><div className="weekday-choices">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((day)=><label className="check" key={day}><input type="checkbox" name="days" value={day}/>{day}</label>)}</div></fieldset>}
    {['intervalHours','intervalDays'].includes(type)&&<><label>Repeat every {type==='intervalHours'?'hours':'days'}<input name="interval" type="number" min={type==='intervalHours'?'0.5':'1'} step={type==='intervalHours'?'0.5':'1'} required/></label><label>First prescribed dose date and time<DateField name="firstDoseAt" type="datetime-local" required/></label><p className="info">After a given dose, the next dose follows this interval. A skipped or unsuccessful dose stays due for review.</p></>}
    {type==='oneTime'&&<label>One-time dose date and time<DateField name="oneTimeAt" type="datetime-local" required/></label>}
    {type==='prn'&&<p className="info">As-needed medication has no automatic due reminder. Follow the prescriber's criteria and limits.</p>}
    <label>Instructions<textarea name="instructions"/></label>
    <MedicationSafetyFields/><div className="actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button disabled={saving}>{saving?'Saving…':'Save medication plan'}</button></div>
  </form></Dialog>;
}
