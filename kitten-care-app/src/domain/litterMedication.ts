import type {CareState,CareEvent,Medication} from './models';
import {createId} from './ids';
import {validateCareDraft} from './validation';
import {calculateDose} from './medication';
import {ageInDays,medicationSafetyWarnings} from './medicationSafety';
export type SharedMedication=Medication&{kittenIds:string[]};
export function saveLitterMedication(state:CareState,litterId:string,plan:Medication,kittenIds:string[],expected?:string):CareState{
 const litter=state.litters.find(l=>l.id===litterId);if(!litter)throw new Error('Litter no longer exists.');
 const previous=litter.medicationPlans?.find(p=>p.id===plan.id);
 if(expected!==undefined&&JSON.stringify(previous)!==expected)throw new Error('The litter plan changed elsewhere. Reopen it before saving.');
 if(!kittenIds.length||new Set(kittenIds).size!==kittenIds.length||kittenIds.some(id=>!state.kittens.some(k=>k.id===id&&k.litterId===litterId&&k.inFosterCare)))throw new Error('Select kittens currently in this litter.');
 const shared:SharedMedication={...plan,kittenIds:[...kittenIds],litterPlanId:undefined,litterPlanOverride:undefined};
 return {...state,litters:state.litters.map(l=>l.id===litterId?{...l,medicationPlans:previous?(l.medicationPlans||[]).map(p=>p.id===plan.id?shared:p):[...(l.medicationPlans||[]),shared]}:l),kittens:state.kittens.map(k=>{
  const linked=k.medications.find(m=>m.litterPlanId===plan.id);
  if(linked&&(!k.inFosterCare||k.litterId!==litterId))return {...k,medications:k.medications.map(m=>m.id===linked.id?{...m,litterPlanId:undefined,litterPlanOverride:undefined}:m)};
  if(!kittenIds.includes(k.id)){if(!linked)return k;return {...k,medications:k.medications.flatMap(m=>m.litterPlanId!==plan.id?[m]:m.litterPlanOverride?[{...m,litterPlanId:undefined,litterPlanOverride:undefined}]:[])};}
  if(linked?.litterPlanOverride)return k;
  if(!linked){
   const matching=k.medications.filter(m=>m.name.trim().toLowerCase()===plan.name.trim().toLowerCase()&&m.route===plan.route&&(!m.endDate||m.endDate>=plan.startDate)&&(!plan.endDate||m.startDate<=plan.endDate));
   if(matching.length>1||matching.some(m=>m.litterPlanId&&m.litterPlanId!==plan.id))throw new Error(`${k.name} already has overlapping plans for ${plan.name}. Review those plans before adding another.`);
   if(matching.length===1)return {...k,medications:k.medications.map(m=>m.id===matching[0].id?{...m,litterPlanId:plan.id,litterPlanOverride:true}:m)};
  }
  const stableId=`${plan.id}:${k.id}`,standalone=!linked&&k.medications.find(m=>m.id===stableId);
  if(standalone)return {...k,medications:k.medications.map(m=>m.id===stableId?{...m,litterPlanId:plan.id,litterPlanOverride:true}:m)};
  const copy:Medication={...plan,id:linked?.id||stableId,litterPlanId:plan.id,litterPlanOverride:false};
  return {...k,medications:linked?k.medications.map(m=>m.id===linked.id?copy:m):[...k.medications,copy]};
 })};
}
export function resetToLitterPlan(state:CareState,kittenId:string,medId:string):CareState{
 const kitten=state.kittens.find(k=>k.id===kittenId),med=kitten?.medications.find(m=>m.id===medId),parent=state.litters.find(l=>l.id===kitten?.litterId)?.medicationPlans?.find(p=>p.id===med?.litterPlanId);
 if(!kitten||!med||!parent||!parent.kittenIds.includes(kitten.id))throw new Error('The shared plan is no longer available.');
 const {kittenIds:_,...plan}=parent;
 return {...state,kittens:state.kittens.map(k=>k.id===kittenId?{...k,medications:k.medications.map(m=>m.id===medId?{...plan,id:medId,litterPlanId:parent.id,litterPlanOverride:false}:m)}:k)};
}
export function doseEvent(state:CareState,kittenId:string,medId:string,when:string,data:CareEvent['data'],now=new Date()):CareEvent{
 if(!Number.isFinite(Date.parse(when)))throw new Error('Enter a valid dose date and time.');
 const kitten=state.kittens.find(k=>k.id===kittenId),med=kitten?.medications.find(m=>m.id===medId);if(!kitten||!med)throw new Error('Medication plan no longer available.');
 const dose=calculateDose(state,kitten,med,now);
 const values:CareEvent['data']={...data,medId,medName:med.name,route:med.route,prescriptionSource:med.source,prescribedUnit:med.unit,prescribedAmount:dose?(med.unit==='mg'?dose.mg:dose.ml):med.manualDose,planSnapshot:JSON.stringify(med),safetySnapshot:JSON.stringify(med.safety||{}),instructionRevision:med.rescueChart?.revision||'custom',dobAtAdministration:kitten.dob,ageDays:ageInDays(kitten,new Date(when)),safetyWarnings:JSON.stringify(medicationSafetyWarnings(state,kitten,med,data.adminAmount,String(data.adminUnit||''),new Date(when),now,String(data.doseSlot||'')))};
 if(dose)Object.assign(values,{weightG:dose.weightG,weightRecordedAt:dose.weightRecordedAt,treatmentDay:dose.treatmentDay,rateMlPerLb:dose.rateMlPerLb});
 return {id:createId('evt'),kittenId,type:'medication',ts:new Date(when).toISOString(),createdAt:now.toISOString(),updatedAt:now.toISOString(),data:values};
}
export function saveDoseBatch(state:CareState,litterId:string,planId:string,events:CareEvent[],now=new Date()):CareState{
 const plan=state.litters.find(l=>l.id===litterId)?.medicationPlans?.find(p=>p.id===planId);if(!plan)throw new Error('Shared plan no longer available.');
 if(!events.length||new Set(events.map(e=>e.kittenId)).size!==events.length)throw new Error('Choose each kitten only once.');
 for(const event of events){const kitten=state.kittens.find(k=>k.id===event.kittenId),med=kitten?.medications.find(m=>m.id===event.data.medId);
  if(!kitten||!kitten.inFosterCare||kitten.litterId!==litterId||!plan.kittenIds.includes(kitten.id)||med?.litterPlanId!==planId||event.type!=='medication')throw new Error('Litter membership or medication changed. Review the selected kittens.');
  const checked=validateCareDraft(state,{type:'medication',kittenId:event.kittenId,when:event.ts,data:event.data},now);if(!checked.valid)throw new Error(`${kitten.name}: ${checked.errors.join(' ')}`);
 }
 return {...state,events:[...state.events,...events]};
}
