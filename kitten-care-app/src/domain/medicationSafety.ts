import type { CareState,Kitten,Medication,MedicationSafety } from './models';
import { kittenEvents,localDateKey } from './care';
import { calculateDose } from './medication';

export interface SafetyWarning { id:string;text:string }
export const weightNeedsRecheck=(warnings:SafetyWarning[])=>warnings.some(warning=>warning.id==='age'||warning.id.startsWith('weight-'));
export function replaceMedicationPlan(state:CareState,kittenId:string,updated:Medication,expectedPlan?:string):CareState {
  const current=state.kittens.find(kitten=>kitten.id===kittenId)?.medications.find(medication=>medication.id===updated.id);
  if(!current||expectedPlan&&JSON.stringify(current)!==expectedPlan)throw new Error('The medication plan changed elsewhere. Your changes were not saved. Reopen the current plan before editing.');
  const replacement=current.litterPlanId?{...updated,litterPlanId:current.litterPlanId,litterPlanOverride:true}:updated;
  return {...state,kittens:state.kittens.map(kitten=>kitten.id===kittenId?{...kitten,medications:kitten.medications.map(medication=>medication.id===updated.id?replacement:medication)}:kitten)};
}
export const safetyNumberFields = ['minimumMeasurableMl','incrementMl','minimumSpacingHours','minimumWeightG','maximumWeightG','maximumWeightChangePercent'] as const;
export function readMedicationSafety(data:FormData):MedicationSafety {
  const result:MedicationSafety={};
  for(const key of ['productLabel','preparation','approvedBy','deviceName'] as const)if(data.has(key))result[key]=String(data.get(key)||'').trim();
  for(const key of safetyNumberFields){const raw=String(data.get(key)||'').trim();if(raw)result[key]=Number(raw)}
  return result;
}
export function safetyPolicyErrors(policy:MedicationSafety):string[]{
  const errors:string[]=[];
  for(const key of safetyNumberFields)if(policy[key]!==undefined&&(!Number.isFinite(policy[key])||Number(policy[key])<=0))errors.push('Safety limits must be positive numbers.');
  if(policy.minimumWeightG&&policy.maximumWeightG&&policy.minimumWeightG>=policy.maximumWeightG)errors.push('The minimum weight must be below the maximum weight.');
  return [...new Set(errors)];
}
export function ageInDays(kitten:Kitten,now=new Date()):number|null {
  const dob=new Date(`${kitten.dob}T12:00:00`);
  if(!kitten.dob||!Number.isFinite(dob.getTime())||localDateKey(dob)!==kitten.dob||kitten.dob>localDateKey(now))return null;
  return Math.floor((Date.UTC(now.getFullYear(),now.getMonth(),now.getDate())-Date.UTC(dob.getFullYear(),dob.getMonth(),dob.getDate()))/86400000);
}
export function medicationSafetyWarnings(state:CareState,kitten:Kitten,medication:Medication,amount:unknown,unit:string,when:Date,now=new Date(),slot=''):SafetyWarning[]{
  const warnings:SafetyWarning[]=[],policy=medication.safety||{};
  const add=(id:string,text:string)=>warnings.push({id,text});
  if(safetyPolicyErrors(policy).length)add('invalid-policy','The saved safety limits are invalid. Review the medication plan.');
  const dose=calculateDose(state,kitten,medication,now),weightBased=medication.doseCalc.mode!=='manual';
  const weights=kittenEvents(state,kitten.id,'weight'),grams=Number(weights[0]?.data.grams),previous=Number(weights[1]?.data.grams);
  if(weightBased){
    if(policy.minimumWeightG&&grams<policy.minimumWeightG)add('weight-low',`The recorded ${grams} g is below the plan’s ${policy.minimumWeightG} g minimum. Reweigh and contact the rescue.`);
    if(policy.maximumWeightG&&grams>policy.maximumWeightG)add('weight-high',`The recorded ${grams} g exceeds the plan’s ${policy.maximumWeightG} g maximum. Reweigh and contact the rescue.`);
    if(previous>0&&Number.isFinite(grams)){
      const percent=Math.abs(grams-previous)/previous*100;
      if(grams<previous)add('weight-drop',`Weight decreased from ${previous} g to ${grams} g. Confirm the reading and follow rescue instructions.`);
      if(policy.maximumWeightChangePercent&&percent>policy.maximumWeightChangePercent)add('weight-change',`The ${percent.toFixed(1)}% weight change exceeds the plan’s ${policy.maximumWeightChangePercent}% recheck limit.`);
    }
  }
  const expected=medication.unit==='mg'?dose?.mg:medication.unit==='mL'?dose?.ml:Number(medication.manualDose);
  const prescribed=weightBased?expected:Number(medication.manualDose);
  if(medication.unit==='mL'){
    const volume=weightBased?dose?.ml:Number(medication.manualDose);
    if(volume!==null&&volume!==undefined&&Number.isFinite(volume)){
      if(policy.minimumMeasurableMl&&volume<policy.minimumMeasurableMl)add('too-small',`The calculated ${volume.toPrecision(5)} mL is below the device’s ${policy.minimumMeasurableMl} mL reliable minimum. Obtain instructions; do not round it yourself.`);
      if(policy.incrementMl&&Math.abs(volume/policy.incrementMl-Math.round(volume/policy.incrementMl))>0.000001)add('graduation',`The calculated amount is between the device’s ${policy.incrementMl} mL marks. Confirm the instructed measurable amount; the app has not rounded it to a syringe mark.`);
    }
  }
  const actual=Number(amount),tolerance=prescribed&&Math.abs(prescribed)<0.001?Math.abs(prescribed)*0.0005:0.000500001;
  if(amount!==''&&amount!==null&&amount!==undefined&&Number.isFinite(actual)&&prescribed!==null&&prescribed!==undefined&&Number.isFinite(prescribed)&&unit===medication.unit&&Math.abs(actual-prescribed)>tolerance)add('amount-difference',`You entered ${actual} ${unit}; the calculated/prescribed amount is ${prescribed.toPrecision(5)} ${unit}. Explain and confirm the difference.`);
  const last=kittenEvents(state,kitten.id,'medication').find(e=>e.data.medId===medication.id&&e.data.status==='given'&&Date.parse(e.ts)<=when.getTime());
  if(last){
    const elapsed=(when.getTime()-Date.parse(last.ts))/3600000;
    if(policy.minimumSpacingHours&&elapsed<policy.minimumSpacingHours)add('too-soon',`Only ${elapsed.toFixed(2)} hours since the last given dose; this plan requires at least ${policy.minimumSpacingHours} hours. Confirm instructions before proceeding.`);
  }
  const following=kittenEvents(state,kitten.id,'medication').filter(e=>e.data.medId===medication.id&&e.data.status==='given'&&Date.parse(e.ts)>when.getTime()).at(-1);
  if(following&&policy.minimumSpacingHours&&(Date.parse(following.ts)-when.getTime())/3600000<policy.minimumSpacingHours)add('following-too-close','This historical entry is too close to the following recorded dose for the plan’s minimum spacing. Review both times.');
  if(slot&&medication.schedule.times?.includes(slot)&&/^\d{2}:\d{2}$/.test(slot)&&Number.isFinite(when.getTime())){
    const planned=new Date(`${localDateKey(when)}T${slot}:00`);
    if(when<planned)add('early-slot',`The actual time is earlier than the selected ${slot} scheduled dose. Confirm why it is being recorded early.`);
  }
  return warnings;
}

export function validateMedicationSafety(state:CareState,kitten:Kitten,medication:Medication,data:Record<string,unknown>,when:Date,now=new Date()):string[]{
  const errors:string[]=[];
  if(typeof data.planSnapshot==='string'&&data.planSnapshot!==JSON.stringify(medication))errors.push('The medication plan changed before saving. Review the updated instructions and confirm again.');
  if(data.adminUnit!==medication.unit)errors.push('Use the prescribed unit or correct the medication plan before recording a given dose.');
  const warnings=medicationSafetyWarnings(state,kitten,medication,data.adminAmount,String(data.adminUnit||''),when,now,String(data.doseSlot||''));
  if(medication.doseCalc.mode!=='manual'){
    const weight=kittenEvents(state,kitten.id,'weight')[0];
    if((weightNeedsRecheck(warnings)||String(data.recheckedWeightG||'').trim())&&(!weight||Number(data.recheckedWeightG)!==Number(weight.data.grams)||!String(data.recheckedWeightG||'').trim()))errors.push('Reweigh and enter the current recorded weight in grams to confirm the calculation.');
    if(weight&&typeof data.weightRecordedAt==='string'&&data.weightRecordedAt!==weight.ts)errors.push('The recorded weight changed before saving. Review it and confirm again.');
  }
  if(typeof data.safetyWarnings==='string'&&data.safetyWarnings!==JSON.stringify(warnings))errors.push('The safety review changed before saving. Review the current warnings and confirm again.');
  if(warnings.length&&(data.safetyAcknowledged!==true||!String(data.safetyReason||'').trim()||!String(data.safetyApproval||'').trim()))errors.push('Review the safety warnings, record the reason and approving contact (or “testing only”), and acknowledge the testing exception.');
  return errors;
}
