import type { CareState, Kitten, Medication, MedicationSchedule } from './models';
import { kittenEvents, localDateKey } from './care';
import { chartSetupIssues,givenMedicationSlots,rescueTemplate } from './rescueMedications';

const weekdays=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const validTime=(time:string)=>/^([01]\d|2[0-3]):[0-5]\d$/.test(time);
export function parseLocalDate(value:string):Date|null {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;
  const date=new Date(`${value}T00:00:00`);
  return Number.isFinite(date.getTime())&&localDateKey(date)===value?date:null;
}

export function scheduleErrors(schedule:MedicationSchedule):string[] {
  if(schedule.type==='prn')return [];
  if(schedule.type==='oneTime')return schedule.oneTimeAt&&Number.isFinite(Date.parse(schedule.oneTimeAt))?[]:['Choose the date and time for the one-time dose.'];
  if(schedule.type==='intervalHours'||schedule.type==='intervalDays'){
    const interval=schedule.type==='intervalHours'?schedule.intervalHours:schedule.intervalDays;
    return Number.isFinite(interval)&&Number(interval)>0&&(schedule.type!=='intervalDays'||Number.isInteger(interval))?[]:['Enter a positive interval; day intervals must be whole days.'];
  }
  if(!['daily','twiceDaily','threeDaily','specificDays'].includes(schedule.type))return ['Choose a supported medication schedule.'];
  const times=schedule.times||[],expected=schedule.type==='twiceDaily'?2:schedule.type==='threeDaily'?3:1;
  const errors:string[]=[];
  if(times.length!==expected||times.some((time)=>!validTime(time))||new Set(times).size!==times.length)errors.push(`Choose ${expected} distinct valid dose time${expected===1?'':'s'}.`);
  if(schedule.type==='specificDays'&&(!schedule.days?.length||schedule.days.some((day)=>!weekdays.includes(day))))errors.push('Choose at least one valid weekday.');
  return errors;
}

export function medicationScheduleIssue(state:CareState,kitten:Kitten,medication:Medication,now=new Date()):string|null {
  if(medication.doseCalc.mode==='rescueChart'){
    const template=medication.rescueChart&&rescueTemplate(medication.rescueChart.templateId);
    if(!template)return 'Medication entry unavailable. Review the plan.';
    if(medication.rescueChart?.revision!==template.revision)return 'The medication instructions changed. Review this plan before use.';
    const issues=chartSetupIssues(template);
    if(issues.length)return issues.join(' ');
    if(!medication.rescueChart?.productConfirmed)return 'Confirm the product matches the prescribed preparation.';
    if(template.requiresVetTech&&!medication.rescueChart?.vetTechApproval?.trim())return 'Rescue vet-tech approval required.';
  }
  const errors=scheduleErrors(medication.schedule);
  if(errors.length)return errors.join(' ');
  if(!parseLocalDate(medication.startDate))return 'Confirm the prescription start date.';
  if(medication.endDate&&(!parseLocalDate(medication.endDate)||medication.endDate<medication.startDate))return 'Confirm the prescription end date.';
  if(['intervalHours','intervalDays'].includes(medication.schedule.type)){
    const given=kittenEvents(state,kitten.id,'medication').some((event)=>event.data.medId===medication.id&&event.data.status==='given'&&Number.isFinite(Date.parse(event.ts))&&Date.parse(event.ts)<=now.getTime());
    if(!given&&(!medication.schedule.firstDoseAt||!Number.isFinite(Date.parse(medication.schedule.firstDoseAt))))return 'Confirm the first dose date and time for this interval schedule.';
  }
  return null;
}

// Fixed times use the caregiver's local calendar. Hour intervals use elapsed time.
// Skipped/unable entries do not silently count as administration or move a due dose.
export function nextMedicationDue(state:CareState,kitten:Kitten,medication:Medication,now=new Date()):Date|null {
  if(!kitten.inFosterCare||scheduleErrors(medication.schedule).length||medication.schedule.type==='prn')return null;
  const start=parseLocalDate(medication.startDate);
  if(!start)return null;
  const end=medication.endDate?parseLocalDate(medication.endDate):null;
  if(medication.endDate&&!end)return null;
  if(end&&localDateKey(now)>medication.endDate)return null;
  const given=kittenEvents(state,kitten.id,'medication').find((event)=>event.data.medId===medication.id&&event.data.status==='given'&&Number.isFinite(Date.parse(event.ts))&&Date.parse(event.ts)<=now.getTime());
  let last=given?new Date(given.ts):null;
  const schedule=medication.schedule;
  if(medication.doseCalc.mode==='rescueChart'&&medication.rescueChart?.courseStartedElsewhere&&start<=now){const completed=new Date(start);completed.setHours(23,59,59,999);if(!last||last<completed)last=completed;}
  const allowed=(date:Date)=>Number.isFinite(date.getTime())&&date>=start&&(!end||localDateKey(date)<=medication.endDate);
  if(schedule.type==='oneTime'){
    if(last||!schedule.oneTimeAt)return null;
    const date=new Date(schedule.oneTimeAt);return allowed(date)?date:null;
  }
  if(schedule.type==='intervalHours'||schedule.type==='intervalDays'){
    const first=schedule.firstDoseAt?new Date(schedule.firstDoseAt):null;
    if(!last&&!first)return null;
    const date=new Date((last||first)!.getTime());
    if(last){if(schedule.type==='intervalHours')date.setTime(date.getTime()+Number(schedule.intervalHours)*3600000);else date.setDate(date.getDate()+Number(schedule.intervalDays));}
    return allowed(date)?date:null;
  }
  const firstDay=last&&last>start?new Date(last.getFullYear(),last.getMonth(),last.getDate()):new Date(start);
  const times=[...(schedule.times||[])].sort();
  for(let day=0;day<8;day++){
    const date=new Date(firstDay);date.setDate(firstDay.getDate()+day);
    if(schedule.type==='specificDays'&&!schedule.days?.includes(weekdays[date.getDay()]))continue;
    for(const time of times){const [hours,minutes]=time.split(':').map(Number);const candidate=new Date(date);candidate.setHours(hours,minutes,0,0);const chart=medication.doseCalc.mode==='rescueChart',alreadyGiven=chart&&givenMedicationSlots(state,kitten.id,medication,candidate).has(time);if(allowed(candidate)&&(!last||chart||candidate>last)&&!alreadyGiven&&!(chart&&medication.rescueChart?.courseStartedElsewhere&&localDateKey(candidate)===medication.startDate))return candidate;}
  }
  return null;
}
