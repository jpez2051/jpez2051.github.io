import {DoseAmount,DoseMath} from './DoseCalculation';
import {formatDose} from '../domain/doseDisplay';
export {formatDose} from '../domain/doseDisplay';
import {Disclosure} from './Disclosure';
import {MedicationInstructions} from './MedicationInstructions';
import { useEffect,useRef,useState } from 'react';
import type { CareState,Kitten,Medication } from '../domain/models';
import { kittenEvents } from '../domain/care';
import { calculateDose } from '../domain/medication';
import { medicationSummary } from '../domain/validation';
import { medicationInstructions,medicationDosesPerDay,rescueDoseIssues } from '../domain/rescueMedications';
import { weightNeedsRecheck,ageInDays,medicationSafetyWarnings } from '../domain/medicationSafety';
import { nextMedicationDue } from '../domain/schedule';



export function MedicationDosePanel({state,kitten,medication,medications,onMedication,onStatus,when}:{state:CareState;kitten:Kitten;medication:Medication;medications:Medication[];onMedication:(id:string)=>void;onStatus:(status:string)=>void;when:string}){
  const [status,setStatus]=useState('given'),[amount,setAmount]=useState(''),[unit,setUnit]=useState(medication.unit),[slot,setSlot]=useState('');
  const dose=calculateDose(state,kitten,medication),issues=medication.rescueChart?rescueDoseIssues(state,kitten,medication):[];
  const last=kittenEvents(state,kitten.id,'medication').find(e=>e.data.medId===medication.id&&e.data.status==='given');
  const weight=kittenEvents(state,kitten.id,'weight')[0],previous=kittenEvents(state,kitten.id,'weight')[1];
  const due=nextMedicationDue(state,kitten,medication),age=ageInDays(kitten);
  const warnings=medicationSafetyWarnings(state,kitten,medication,amount,unit,new Date(when),new Date(),slot);
  const signature=JSON.stringify([kitten.dob,medication,kittenEvents(state,kitten.id,'weight').map(event=>[event.id,event.ts,event.data.grams]),weight?.id,weight?.ts,weight?.data,last?.id,state.events.filter(e=>e.kittenId===kitten.id&&e.type==='medication').map(e=>e.id)]);
  const confirmationKey=signature+amount+unit+slot+when+JSON.stringify(warnings)+JSON.stringify(dose);
  const previousSignature=useRef(signature),[changed,setChanged]=useState(false);
  useEffect(()=>{if(previousSignature.current!==signature){setChanged(true);previousSignature.current=signature}},[signature]);
  return <div className="medication-dose-panel">{changed&&<p className="info" role="status">Care details changed while this form was open. Recheck the weight, dose and confirmations before saving.</p>}
    <label>Medication<select name="medId" value={medication.id} onChange={event=>onMedication(event.target.value)}>{medications.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
    <section className="dose-confirm"><h3>How to give</h3><b>{medicationSummary(medication)}</b>
      <DoseAmount medication={medication} dose={dose}/>
      <p><b>{due&&due<=new Date()?'Dose due/overdue since:':'Next scheduled dose:'}</b> {due?due.toLocaleString():'No next dose scheduled'}</p>
      <p><b>Last given:</b> {last?new Date(last.ts).toLocaleString():'Not recorded in this app'}</p>
      <Disclosure label="Full instructions and calculation">
        <MedicationInstructions medication={medication}/>
        <DoseMath medication={medication} dose={dose}/>
        {medication.safety?.productLabel&&<p>Product: {medication.safety.productLabel}<br/>Preparation: {medication.safety.preparation}<br/>Approved by: {medication.safety.approvedBy}</p>}
      </Disclosure>
    </section>
    {issues.length>0&&<div className="validation-summary" role="status"><b>Not ready to administer</b><ul>{issues.map(issue=><li key={issue}>{issue}</li>)}</ul></div>}
    {medicationDosesPerDay(medication)>1&&<label>Scheduled dose<select name="doseSlot" value={slot} onChange={event=>setSlot(event.target.value)}><option value="">Choose the dose you are recording</option>{[...(medication.schedule.times||[])].sort().map(time=><option key={time} value={time}>{time} dose</option>)}</select></label>}
    <label>Status<select name="status" value={status} onChange={event=>{setStatus(event.target.value);onStatus(event.target.value)}}><option value="given">Given</option><option value="skipped">Skipped</option><option value="unable">Unable to give</option></select></label>
    {status==='given'&&<>
      <div className="two"><label>Actual amount given *<input name="adminAmount" inputMode="decimal" value={amount} onChange={event=>setAmount(event.target.value)}/></label><label>Unit *<select name="adminUnit" value={unit} onChange={event=>setUnit(event.target.value)}>{[...new Set([medication.unit,'mL','mg','tablet','drop'])].map(value=><option key={value}>{value}</option>)}</select></label></div>
      {medication.doseCalc.mode!=='manual'&&<section key={signature} className="weight-recheck"><p><b>Recorded weight:</b> {weight?`${weight.data.grams} g · ${new Date(weight.ts).toLocaleString()}`:'None'}. {age===null?'Age unknown':`${age} days old`}.</p>{previous&&<p>Previous weight: {previous.data.grams} g.</p>}{weightNeedsRecheck(warnings)&&<><label>Rechecked weight in grams *<input name="recheckedWeightG" inputMode="decimal" placeholder="Reweigh, then confirm the recorded grams"/></label><small>If the scale differs, cancel and record the corrected weight first.</small></>}</section>}
      {dose?.stale&&medication.doseCalc.rateUnit!=='mL/lb'&&<label className="check warning-check"><input type="checkbox" name="staleWeightApproved"/> Rescue or veterinarian approved using this older weight</label>}
      {warnings.length>0&&<section className="safety-review warning" key={confirmationKey} aria-live="polite"><h3>Review before recording a dose</h3><ul>{warnings.map(warning=><li key={warning.id}>{warning.text}</li>)}</ul><p>This testing exception is recorded; it is not veterinary approval.</p><label>Reason / instructions for this testing exception<textarea name="safetyReason"/></label><label>Approving contact or “testing only”<input name="safetyApproval"/></label><label className="check"><input name="safetyAcknowledged" type="checkbox"/> I reviewed these warnings and am recording this exception explicitly</label></section>}
      <label key={confirmationKey+'confirm'} className="check confirmation"><input type="checkbox" name="confirmed"/> I confirmed the kitten, medication, route, and dose above</label>
    </>}
  </div>;
}
