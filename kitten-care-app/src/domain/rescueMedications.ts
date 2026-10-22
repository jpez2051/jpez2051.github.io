import type { CareState,Kitten,Medication } from './models';
import { kittenEvents,localDateKey } from './care';

export const GRAMS_PER_POUND=453.59237;
export const MAX_MEDICATION_WEIGHT_AGE_HOURS=24;
export interface RescueMedicationTemplate {
  id:string;name:string;revision:string;indication:string;instructions:string;
  notes:string;firstDayMlPerLb:number;laterMlPerLb:number;minDays:number;maxDays:number;
  preparationReference:string|null;frequencyConfirmed:boolean;nameConfirmed:boolean;requiresVetTech:boolean;
}

// Source: chart text supplied by the rescue owner on 2026-10-22.
// No product strength, dosing frequency, or spelling correction is inferred.
export const RESCUE_MEDICATIONS:RescueMedicationTemplate[]=[
  {id:'albon',name:'Albon',revision:'2026-10-22.2',indication:'“icky poo, possibly coccidia.”',instructions:'Once daily: 0.5 mL/lb on treatment day 1, then 0.25 mL/lb on days 2–14 (13 more days).',notes:'No storage or expiration information supplied.',firstDayMlPerLb:0.5,laterMlPerLb:0.25,minDays:14,maxDays:14,preparationReference:'Rescue-supplied Albon liquid covered by this mL/lb chart; confirm the bottle matches rescue instructions.',frequencyConfirmed:true,nameConfirmed:true,requiresVetTech:false},
  {id:'azithromycin',name:'Azithromycin',revision:'2026-10-22.1',indication:'antibiotic for upper respiratory infections when others have not worked.',instructions:'0.1 mL/lb for 10 days. Any extension requires new rescue/veterinary instructions.',notes:'Supplied instructions say to dissolve a pill in 5 mL water. Pill strength and final preparation must be confirmed before this is used as a mixing instruction.',firstDayMlPerLb:0.1,laterMlPerLb:0.1,minDays:10,maxDays:10,preparationReference:null,frequencyConfirmed:false,nameConfirmed:true,requiresVetTech:false},
  {id:'baytril',name:'Baytril (enrofloxacin)',revision:'2026-10-22.1',indication:'powerful oral medication for bacterial infections.',instructions:'0.022 mL/lb for a rescue-approved course of 5–10 days. Use only for the approved duration.',notes:'Must be approved by the rescue vet tech. The rescue liquid formulation needs confirmation.',firstDayMlPerLb:0.022,laterMlPerLb:0.022,minDays:5,maxDays:10,preparationReference:null,frequencyConfirmed:false,nameConfirmed:true,requiresVetTech:true},
];

export function rescueTemplate(id:string){return RESCUE_MEDICATIONS.find((template)=>template.id===id)}
export const FIRST_DAY_COMPLETED = 'Day 1 was already completed today. Do not give another dose today. The day-2 amount starts tomorrow. If day 1 was completed earlier, correct the actual first treatment date.';
export function chartSetupIssues(template:RescueMedicationTemplate):string[]{
  const issues:string[]=[];
  if(!template.nameConfirmed)issues.push('Confirm the medication name with the rescue.');
  if(!template.preparationReference)issues.push('The rescue must confirm the exact liquid strength/preparation for these instructions.');
  if(!template.frequencyConfirmed)issues.push('The rescue must confirm how often each dose is given.');
  return issues;
}
export function treatmentDay(startDate:string,now=new Date()):number|null {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(startDate))return null;
  const start=new Date(`${startDate}T00:00:00`);
  if(!Number.isFinite(start.getTime())||localDateKey(start)!==startDate)return null;
  // UTC is used only to subtract local calendar components, avoiding DST-hour drift.
  return Math.floor((Date.UTC(now.getFullYear(),now.getMonth(),now.getDate())-Date.UTC(start.getFullYear(),start.getMonth(),start.getDate()))/86400000)+1;
}
export function addCourseDays(startDate:string,totalDays:number):string {
  const date=new Date(`${startDate}T12:00:00`);
  if(!Number.isFinite(date.getTime())||localDateKey(date)!==startDate||!Number.isInteger(totalDays)||totalDays<1)return '';
  date.setDate(date.getDate()+totalDays-1);return localDateKey(date);
}
export function chartRateForDay(template:RescueMedicationTemplate,day:number):number|null {
  return Number.isInteger(day)&&day>=1&&day<=template.maxDays?(day===1?template.firstDayMlPerLb:template.laterMlPerLb):null;
}
export function recentMedicationWeight(state:CareState,kittenId:string,now=new Date()){
  const weight=kittenEvents(state,kittenId,'weight')[0];
  const grams=Number(weight?.data.grams),time=Date.parse(weight?.ts||'');
  if(!weight||!Number.isFinite(grams)||grams<=0||!Number.isFinite(time)||time>now.getTime())return null;
  const ageHours=(now.getTime()-time)/3600000;
  return {grams,pounds:grams/GRAMS_PER_POUND,recordedAt:weight.ts,ageHours,fresh:ageHours<=MAX_MEDICATION_WEIGHT_AGE_HOURS};
}
export function rescueDoseIssues(state:CareState,kitten:Kitten,medication:Medication,now=new Date()):string[]{
  const reference=medication.rescueChart,template=reference&&rescueTemplate(reference.templateId);
  if(!template)return ['Choose a valid medication.'];
  const issues=chartSetupIssues(template);
  if(reference!.revision!==template.revision)issues.push('The medication instructions changed. Review this plan before use.');
  if(!reference!.productConfirmed)issues.push('Confirm the supplied product matches the rescue preparation.');
  if(template.requiresVetTech&&!reference!.vetTechApproval?.trim())issues.push('Record rescue vet-tech approval before use.');
  const weight=recentMedicationWeight(state,kitten.id,now);
  if(!weight)issues.push('Record a valid current weight before calculating this medication.');
  else if(!weight.fresh)issues.push('Record a weight from the last 24 hours before calculating this medication.');
  const day=treatmentDay(medication.startDate,now);
  if(day===1&&reference!.courseStartedElsewhere)issues.push(FIRST_DAY_COMPLETED);
  if(day===null||day<1)issues.push('Confirm the actual first treatment date.');
  else if(day>template.maxDays||(medication.endDate&&localDateKey(now)>medication.endDate))issues.push('This course has ended. Obtain new instructions before extending it.');
  if(template.firstDayMlPerLb!==template.laterMlPerLb&&day!==null&&day>1&&!reference!.courseStartedElsewhere){
    const firstDayGiven=kittenEvents(state,kitten.id,'medication').some((event)=>event.data.medId===medication.id&&event.data.status==='given'&&localDateKey(new Date(event.ts))===medication.startDate);
    if(!firstDayGiven)issues.push('The first treatment day is not recorded. Confirm the course history before using a later-day dose.');
  }
  return issues;
}
export function chartArithmetic(grams:number,rateMlPerLb:number):number|null {
  return Number.isFinite(grams)&&grams>0&&Number.isFinite(rateMlPerLb)&&rateMlPerLb>0?grams/GRAMS_PER_POUND*rateMlPerLb:null;
}
