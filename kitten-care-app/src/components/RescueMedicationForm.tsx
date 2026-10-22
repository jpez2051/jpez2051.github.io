import { useState,type ReactNode } from 'react';
import { Dialog } from './Dialog';
import { DateField } from './DateField';
import { localDateKey } from '../domain/care';
import { createId } from '../domain/ids';
import { addCourseDays,chartSetupIssues,recentMedicationWeight,type RescueMedicationTemplate } from '../domain/rescueMedications';
import type { CareState,Kitten,Medication } from '../domain/models';

export function RescueMedicationForm({template,state,kitten,selector,onClose,onSave}:{template:RescueMedicationTemplate;state:CareState;kitten:Kitten;selector:ReactNode;onClose:()=>void;onSave:(medication:Medication)=>Promise<boolean>}){
  const [start,setStart]=useState(localDateKey()),[days,setDays]=useState(template.minDays),[saving,setSaving]=useState(false),[error,setError]=useState('');
  const issues=chartSetupIssues(template),weight=recentMedicationWeight(state,kitten.id);
  const end=/^\d{4}-\d{2}-\d{2}$/.test(start)?addCourseDays(start,days):'';
  return <Dialog title={`${template.name} · ${kitten.name}`} onClose={onClose}><form onSubmit={async(event)=>{
    event.preventDefault();if(saving)return;
    const data=new FormData(event.currentTarget);
    if(!start||!end||days<template.minDays||days>template.maxDays){setError('Confirm the treatment dates and approved course length.');return}
    if(template.requiresVetTech&&!String(data.get('vetTechApproval')||'').trim()){setError('Enter the approving rescue vet tech before saving this plan.');return}
    const medication:Medication={id:createId('med'),name:template.name,route:'Oral',source:'Rescue chart supplied 2026-10-22',manualDose:'',unit:'mL',doseCalc:{mode:'rescueChart'},rescueChart:{templateId:template.id,revision:template.revision,productConfirmed:data.get('productConfirmed')==='on',vetTechApproval:String(data.get('vetTechApproval')||'').trim(),courseStartedElsewhere:data.get('courseStartedElsewhere')==='on'},schedule:{type:'daily',times:[String(data.get('time'))]},startDate:start,endDate:end,instructions:`${template.instructions}\n${template.notes}\n${String(data.get('notes')||'')}`};
    setSaving(true);setError('');try{if(!await onSave(medication))setError('The plan was not saved. Check browser storage and try again.')}finally{setSaving(false)}
  }}>
    {selector}
    <p className="info">Reference only. Select a medication because the rescue prescribed it for this kitten; the app does not choose a treatment.</p>
    <section className="chart-reference"><h3>Rescue chart instructions</h3><p><b>When the rescue uses it:</b> {template.indication}</p><p><b>Dosage from chart:</b> {template.instructions}</p><p><b>Notes:</b> {template.notes}</p></section>
    {template.requiresVetTech&&<div className="validation-summary"><b>Rescue vet-tech approval is required.</b><label>Approving vet tech and approval reference *<input name="vetTechApproval" required placeholder="Name and date or instruction reference"/></label></div>}
    <section className="weight-check"><h3>Recorded weight</h3>{weight?<><p><b>{weight.grams} g · {weight.pounds.toFixed(3)} lb</b></p><p>Recorded {new Date(weight.recordedAt).toLocaleString()}</p><p>{weight.fresh?'Within the 24-hour medication weight limit.':'Too old for a medication calculation. Record a new weight first.'}</p></>:<p>No valid current weight. Record a weight before using a medication calculation.</p>}</section>
    {issues.length>0&&<div className="validation-summary" role="status"><b>Chart details awaiting rescue confirmation</b><ul>{issues.map((issue)=><li key={issue}>{issue}</li>)}</ul><p>This entry can be saved as a draft reference. It cannot calculate an administration amount or be logged as given yet.</p></div>}
    <div className="two"><label>Actual first treatment date<DateField name="startDate" value={start} onChange={(event)=>setStart(event.target.value)} required/></label><label>Course length in days{template.minDays===template.maxDays?<input readOnly value={days}/>:<select value={days} onChange={(event)=>setDays(Number(event.target.value))}>{Array.from({length:template.maxDays-template.minDays+1},(_,index)=>index+template.minDays).map((day)=><option key={day} value={day}>{day} days</option>)}</select>}</label></div>
    <p>Course end: <b>{end}</b>. Extensions require updated rescue instructions.</p>
    <label>Planned dose time<input name="time" type="time" defaultValue="08:00" required/></label>
    <p className="info">Time is a planning placeholder until the rescue confirms dose frequency. No automatic dose reminders are created for this draft.</p>
    <label className="check"><input name="productConfirmed" type="checkbox" disabled={issues.length>0}/> The product supplied matches the rescue chart preparation</label>
    {template.firstDayMlPerLb!==template.laterMlPerLb&&<label className="check"><input name="courseStartedElsewhere" type="checkbox"/> The first treatment day was already completed outside this app</label>}
    <label>Additional rescue instructions<textarea name="notes"/></label>
    {error&&<div className="validation-summary" role="alert">{error}</div>}
    <div className="actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button disabled={saving}>{saving?'Saving…':issues.length?'Save chart draft':'Save medication plan'}</button></div>
  </form></Dialog>;
}
