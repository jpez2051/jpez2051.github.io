import {Disclosure} from './Disclosure';
import {MedicationInstructions} from './MedicationInstructions';
import {Icon} from './Icon';
import type { CareState,CareEventType,Medication } from '../domain/models';
import { latestWeight,kittenEvents } from '../domain/care';
import { medicationInstructions,rescueDoseIssues } from '../domain/rescueMedications';
import { nextMedicationDue } from '../domain/schedule';
import { Dialog } from './Dialog';
import {StayTimeline,CareHistory} from './FosteringJourney';
import type {CareStay} from '../domain/models';

function frequency(medication:Medication){
  const schedule=medication.schedule;
  if(schedule.type==='daily')return 'Once daily';
  if(schedule.type==='twiceDaily')return 'Twice daily';
  if(schedule.type==='threeDaily')return 'Three times daily';
  if(schedule.type==='intervalHours')return `Every ${schedule.intervalHours} hours`;
  if(schedule.type==='intervalDays')return `Every ${schedule.intervalDays} days`;
  if(schedule.type==='prn')return 'As needed';
  return schedule.type==='specificDays'?'Selected weekdays':'One-time dose';
}
export function KittenProfile({state,kittenId,onClose,onLog,onAddMedication,onReviewChart,onStay,onEditPhoto,onEditName,onUseLitterPlan}:{state:CareState;kittenId:string;onClose:()=>void;onLog:(type:CareEventType,medId?:string)=>void;onAddMedication:()=>void;onReviewChart:(medId:string)=>void;onStay:(stay?:CareStay,mode?:'departure'|'return')=>void;onEditPhoto:()=>void;onEditName:()=>void;onUseLitterPlan:(medId:string)=>Promise<void>}){
  const kitten=state.kittens.find(k=>k.id===kittenId);if(!kitten)return null;
  return <Dialog title={kitten.name} onClose={onClose}>
    <div className="profile-identity"><span>Kitten profile</span><button className="edit-photo-button" onClick={onEditName}>Edit name</button></div><div className="profile-summary"><span className="profile-photo">{kitten.photo?<img src={kitten.photo} alt={`${kitten.name} photo`}/>:<Icon name="cat"/>}</span><div><b>{latestWeight(state,kitten.id)??'No weight recorded'}{latestWeight(state,kitten.id)?' g':''}</b><p>Feed every {kitten.feedingIntervalHours} hours</p><button className="edit-photo-button" onClick={onEditPhoto}>{kitten.photo?'Edit photo':'Add photo'}</button></div></div>
    {kitten.inFosterCare?<div className="quick-grid profile-actions">{(['feeding','weight','potty','health','note'] as CareEventType[]).map(type=><button key={type} onClick={()=>onLog(type)}>{type}</button>)}</div>:<p className="info">Past care · Records are preserved. Record a return before logging new daily care.</p>}
    <section className="subsection"><header><h3>Care stays</h3><button onClick={()=>onStay(kitten.inFosterCare?kitten.careStays?.find(s=>!s.closed):undefined,kitten.inFosterCare?'departure':'return')}>{kitten.inFosterCare?'Record departure':'Record return'}</button></header><StayTimeline kitten={kitten} onEdit={stay=>onStay(stay)}/></section>
    <section className="subsection"><header><h3>Medication plans</h3>{kitten.inFosterCare&&<button onClick={onAddMedication}>Add medication</button>}</header>
      {kitten.medications.length?kitten.medications.map(med=>{
        const last=kittenEvents(state,kitten.id,'medication').find(e=>e.data.medId===med.id&&e.data.status==='given'),due=nextMedicationDue(state,kitten,med),issues=med.rescueChart?rescueDoseIssues(state,kitten,med):[];
        return <div className="medication-row" key={med.id}><div><b>{med.name}</b>{med.litterPlanId&&<small>{med.litterPlanOverride?'Individual override':'Litter plan · synced'}</small>}<small>{frequency(med)} · {med.route}{issues.length?' · Review needed':''}</small><small>{due&&due<=new Date()?'Overdue: ':'Next: '}{due?due.toLocaleString():'No next dose scheduled'}</small><small>Last given: {last?new Date(last.ts).toLocaleString():'Not recorded'}</small><Disclosure label="View medication instructions"><MedicationInstructions medication={med}/></Disclosure></div>
          <div className="medication-actions">{med.litterPlanId&&med.litterPlanOverride&&<button className="secondary" onClick={()=>void onUseLitterPlan(med.id)}>Use litter plan</button>}<button className="secondary" onClick={()=>onReviewChart(med.id)}>{'Review medication plan'}</button>{kitten.inFosterCare&&<button onClick={()=>onLog('medication',med.id)}>Log dose</button>}</div></div>;
      }):<p>No medications assigned.</p>}
    </section>
    <CareHistory state={state} kittenId={kitten.id}/>
  </Dialog>;
}
