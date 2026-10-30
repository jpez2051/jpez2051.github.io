import type { CareState, Kitten, Litter, Medication, CareStay } from '../domain/models';
import {stayErrors} from '../domain/journey';

export const APP_SCHEMA_VERSION = 10;

export function emptyState(): CareState {
  return { version: APP_SCHEMA_VERSION, kittens: [], litters: [], events: [], settings: {} };
}

export function restoreBackup(value: unknown): CareState {
  if (!value || typeof value !== 'object') throw new Error('Invalid backup');
  const raw=value as Partial<CareState>;
  if(raw.settings?.walkthroughStatus!==undefined&&!['completed','skipped'].includes(raw.settings.walkthroughStatus))throw new Error('Invalid walkthrough preference');
  if(typeof raw.version==='number'&&raw.version>APP_SCHEMA_VERSION) throw new Error('This backup requires a newer application version');
  if (!Array.isArray(raw.kittens)||!Array.isArray(raw.events)||!Array.isArray(raw.litters)) throw new Error('Invalid backup');
  for (const list of [raw.kittens,raw.events,raw.litters]) {
    if(list.some((item)=>!item||typeof item!=='object'||typeof item.id!=='string'||!item.id)) throw new Error('Invalid record');
    if(new Set(list.map((item)=>item.id)).size!==list.length) throw new Error('Duplicate records');
  }
  if(raw.events.some((event)=>!event.data||typeof event.data!=='object'||Array.isArray(event.data)||!Number.isFinite(Date.parse(event.ts))||!raw.kittens!.some((kitten)=>kitten.id===event.kittenId))) throw new Error('Invalid care history');
  for(const litter of raw.litters){if(litter.medicationPlans!==undefined){if(!Array.isArray(litter.medicationPlans)||new Set(litter.medicationPlans.map(p=>p?.id)).size!==litter.medicationPlans.length)throw new Error('Invalid litter medication plans');for(const plan of litter.medicationPlans){if(!plan||typeof plan.id!=='string'||!plan.id||!Array.isArray(plan.kittenIds)||plan.kittenIds.some(id=>typeof id!=='string'||!raw.kittens!.some(k=>k.id===id))||new Set(plan.kittenIds).size!==plan.kittenIds.length)throw new Error('Invalid litter medication membership');}}}
  for(const kitten of raw.kittens){
    if(kitten.careStays!==undefined){
      if(!Array.isArray(kitten.careStays))throw new Error('Invalid care stays');
      const stays=kitten.careStays;
      if(new Set(stays.map(s=>s?.id)).size!==stays.length)throw new Error('Duplicate care stays');
      for(const stay of stays){if(!stay||typeof stay.id!=='string'||!stay.id||typeof stay.closed!=='boolean'||typeof stay.approximate!=='boolean'||['arrival','departure','from','destination','notes','createdAt'].some(key=>typeof stay[key as keyof CareStay]!=='string')||!Number.isFinite(Date.parse(stay.createdAt))||stayErrors(stay,stays).length)throw new Error('Invalid care stay');
      if(stay.revisions!==undefined&&(!Array.isArray(stay.revisions)||stay.revisions.some(r=>!r||typeof r.reason!=='string'||typeof r.previous!=='string'||!Number.isFinite(Date.parse(r.at)))))throw new Error('Invalid stay corrections');}
      if(stays.length&&stays.some(s=>!s.closed)!==kitten.inFosterCare)throw new Error('Care stay status does not match kitten');
    }
    if(Array.isArray(kitten.medications)&&kitten.medications.some(m=>(m.litterPlanId!==undefined&&typeof m.litterPlanId!=='string')||(m.litterPlanOverride!==undefined&&typeof m.litterPlanOverride!=='boolean')))throw new Error('Invalid litter plan link');
    if(kitten.medications!==undefined&&!Array.isArray(kitten.medications))throw new Error('Invalid medication plans');
    const medications=kitten.medications||[];
    if(medications.some(medication=>!medication||typeof medication!=='object'||typeof medication.id!=='string'||!medication.id)||new Set(medications.map(medication=>medication.id)).size!==medications.length)throw new Error('Invalid medication identity');
    for(const medication of medications){
    if(medication.safety!==undefined){
      const policy=medication.safety;
      if(!policy||typeof policy!=='object'||Array.isArray(policy))throw new Error('Invalid medication safety policy');
      for(const key of ['productLabel','preparation','approvedBy','deviceName'] as const)if(policy[key]!==undefined&&typeof policy[key]!=='string')throw new Error('Invalid medication identity');
      for(const key of ['minimumMeasurableMl','incrementMl','minimumSpacingHours','minimumWeightG','maximumWeightG','maximumWeightChangePercent'] as const)if(policy[key]!==undefined&&(typeof policy[key]!=='number'||!Number.isFinite(policy[key])||Number(policy[key])<=0))throw new Error('Invalid medication safety limit');
      if(policy.minimumWeightG&&policy.maximumWeightG&&policy.minimumWeightG>=policy.maximumWeightG)throw new Error('Invalid medication weight range');
    }
    if(medication.rescueChart?.additionalInstructions!==undefined&&typeof medication.rescueChart.additionalInstructions!=='string')throw new Error('Invalid medication notes');
    }
  }
  return migrateState(raw);
}

export function migrateState(value: unknown): CareState {
  if (!value || typeof value !== 'object') return emptyState();
  const raw = value as Partial<CareState>;
  if (!Array.isArray(raw.kittens) || !Array.isArray(raw.events)) return emptyState();

  const litters: Litter[] = Array.isArray(raw.litters) ? raw.litters.map((litter) => ({
    ...litter,
    id: String(litter.id),
    name: String(litter.name || 'Unnamed litter'),
    dob: String(litter.dob || ''),
    notes: String(litter.notes || ''),
    medicationPlans:litter.medicationPlans?.map(plan=>({...plan,kittenIds:Array.isArray(plan.kittenIds)?plan.kittenIds:[],doseCalc:plan.doseCalc||{mode:'manual'},schedule:plan.schedule||{type:'daily',times:['08:00']}})),
  })) : [];

  const kittens: Kitten[] = raw.kittens.map((kitten) => ({
    ...kitten,
    id: String(kitten.id),
    name: String(kitten.name || 'Unnamed kitten'),
    litterId: kitten.litterId ? String(kitten.litterId) : null,
    inFosterCare: typeof kitten.inFosterCare==='boolean'?kitten.inFosterCare:!['Adopted','Transferred','Returned to A4A','Deceased'].includes(String((kitten as Kitten & {status?:string}).status)),
    dob: String(kitten.dob || ''),
    sex: String(kitten.sex || ''),
    markings: String(kitten.markings || ''),
    specialNeeds: String(kitten.specialNeeds || ''),
    feedingIntervalHours: Number(kitten.feedingIntervalHours) || 4,
    medications: Array.isArray(kitten.medications) ? kitten.medications.map((medication)=>({ ...medication, doseCalc:medication.doseCalc||{mode:'manual'}, schedule:medication.schedule||{type:'daily',times:['08:00']} } as Medication)) : [],
    photo: kitten.photo || null,
    carePlan: {
      feedingEnabled: kitten.carePlan?.feedingEnabled ?? true,
      dailyWeight: kitten.carePlan?.dailyWeight ?? true,
      bottleBaby: kitten.carePlan?.bottleBaby ?? false,
    },
  }));

  for(const kitten of kittens)if(!kitten.careStays?.length)kitten.careStays=[{id:`legacy-stay-${kitten.id}`,arrival:'',departure:'',closed:!kitten.inFosterCare,approximate:false,from:'',destination:'',outcome:'unknown',notes:'Imported existing record. Care dates and outcome have not been confirmed.',createdAt:new Date().toISOString()}];
  return {
    version: APP_SCHEMA_VERSION,
    kittens,
    litters,
    events: raw.events.map((event) => event.type === 'feeding' && !event.data?.outcome
      ? { ...event, data: { ...event.data, outcome: Number(event.data?.amount) > 0 ? 'fed' : 'unable' } }
      : event),
    settings: {
      textSize: raw.settings?.largeText ? 'large' : 'standard',
      onboardingComplete: Boolean(raw.settings?.dismissedFirstRun || raw.kittens.length),
      ...(raw.settings || {}),
    },
  };
}
