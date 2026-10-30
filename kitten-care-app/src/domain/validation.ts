import type { CareEventType, CareState, Medication } from './models';
import { calculateDose } from './medication';
import { givenMedicationSlots,medicationDosesPerDay,rescueDoseIssues } from './rescueMedications';
import { kittenEvents,localDateKey } from './care';
import { validateMedicationSafety } from './medicationSafety';

export interface CareDraft {
  type: CareEventType;
  kittenId: string;
  when: string;
  data: Record<string, string | number | boolean | null | undefined>;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const positive = (value: unknown) => Number.isFinite(Number(value)) && Number(value) > 0;

export function validateCareDraft(state: CareState, draft: CareDraft, now = new Date()): ValidationResult {
  const errors: string[] = [];
  const kitten = state.kittens.find((item) => item.id === draft.kittenId && item.inFosterCare !== false);
  if (!kitten) errors.push('Choose a kitten currently in your care.');
  const when = new Date(draft.when);
  if (!draft.when || Number.isNaN(when.getTime())) errors.push('Enter a valid date and time.');
  else if (when.getTime() > now.getTime() + 15 * 60_000) errors.push('Care cannot be logged more than 15 minutes in the future.');

  if (draft.type === 'feeding') {
    const outcome = String(draft.data.outcome || '');
    if (!['fed', 'refused', 'unable'].includes(outcome)) errors.push('Choose what happened during the feeding.');
    if (outcome === 'fed' && !positive(draft.data.amount)) errors.push('Enter the positive amount the kitten ate.');
    if (outcome === 'fed' && !['mL','g','oz'].includes(String(draft.data.unit))) errors.push('Choose a valid feeding unit.');
    if (outcome !== 'fed' && !String(draft.data.note || '').trim()) errors.push('Add a note explaining the refused or unsuccessful feeding.');
  }

  if (draft.type === 'weight' && !positive(draft.data.grams)) errors.push('Enter a weight greater than zero grams.');
  if (draft.type === 'weight' && Number(draft.data.grams)>12000) errors.push('Recheck the weight and enter a value at or below 12,000 grams.');

  if (draft.type === 'medication' && kitten) {
    const medication = kitten.medications.find((item) => item.id === draft.data.medId);
    if (!medication) errors.push('Choose a medication assigned to this kitten.');
    const status = String(draft.data.status || '');
    if (!['given', 'skipped', 'unable'].includes(status)) errors.push('Choose whether the dose was given, skipped, or unable to give.');
    if (status === 'given') {
      if(medication?.startDate&&medication.startDate>localDateKey(when))errors.push('This medication course has not started. Review its start date.');
      if(medication?.endDate&&medication.endDate<localDateKey(when))errors.push('This medication course has ended. Review the plan before logging another dose.');
      if(medication?.doseCalc.rateUnit==='mL/lb'&&localDateKey(when)!==localDateKey(now))errors.push('Do not use today’s weight calculation for a different treatment day.');
      if(medication&&state.version>=8)errors.push(...validateMedicationSafety(state,kitten,medication,draft.data,when,now));
      if (draft.data.confirmed !== true) errors.push('Confirm the kitten, medication, route, and dose before saving.');
      if (!positive(draft.data.adminAmount)) errors.push('Enter the actual positive amount given.');
      if (!String(draft.data.adminUnit || '').trim()) errors.push('Choose the unit actually given.');
      if(medication?.doseCalc.mode==='rescueChart'){
        errors.push(...rescueDoseIssues(state,kitten,medication,now));
        if(draft.data.adminUnit!=='mL')errors.push('Calculated doses must be recorded in mL.');
        if(Number.isFinite(when.getTime())&&localDateKey(when)!==localDateKey(now))errors.push('Do not use today’s chart calculation to record a dose for a different treatment day. Confirm historical instructions with the rescue.');
        const given=kittenEvents(state,kitten.id,'medication').filter(event=>event.data.medId===medication.id&&event.data.status==='given'&&localDateKey(new Date(event.ts))===localDateKey(when));
        if(given.length>=medicationDosesPerDay(medication))errors.push('All prescribed doses are already recorded for this treatment day. Review the care record before giving another.');
        if(medicationDosesPerDay(medication)===2){const slot=String(draft.data.doseSlot||'');if(!medication.schedule.times?.includes(slot))errors.push('Choose which scheduled dose you are recording.');else if(givenMedicationSlots(state,kitten.id,medication,when).has(slot))errors.push('That scheduled dose is already recorded. Do not give it again.');}
      }
      if (medication?.doseCalc.mode === 'weightBased') {
        const dose = calculateDose(state, kitten, medication, now);
        if (!dose) errors.push('Record a current valid weight before giving this weight-based medication.');
        else if (dose.stale && (medication.doseCalc.rateUnit==='mL/lb'||draft.data.staleWeightApproved !== true)) errors.push('The recorded weight is over 24 hours old. Record a current weight or confirm rescue approval to use it.');
      }
      if(medication&&!medication.rescueChart&&['daily','twiceDaily','threeDaily','specificDays'].includes(medication.schedule.type)){
        const given=kittenEvents(state,kitten.id,'medication').filter(e=>e.data.medId===medication.id&&e.data.status==='given'&&localDateKey(new Date(e.ts))===localDateKey(when));
        if(given.length>=medicationDosesPerDay(medication))errors.push('All prescribed doses are already recorded for this day.');
        if(medicationDosesPerDay(medication)>1){const slot=String(draft.data.doseSlot||'');if(!medication.schedule.times?.includes(slot))errors.push('Choose which scheduled dose you are recording.');else if(givenMedicationSlots(state,kitten.id,medication,when).has(slot))errors.push('That scheduled dose is already recorded.');}
      }
    } else if (!String(draft.data.note || '').trim()) errors.push('Add a reason for a skipped or unsuccessful dose.');
  }

  if (draft.type === 'note' && !String(draft.data.note || '').trim()) errors.push('Enter a care note.');
  if(draft.type==='health'){
    if(!['Normal','Monitor','Concern'].includes(String(draft.data.status)))errors.push('Choose an observed health status.');
    if(['Monitor','Concern'].includes(String(draft.data.status))&&!String(draft.data.note||'').trim())errors.push('Describe the health concern you observed.');
  }
  if(draft.type==='potty'&&draft.data.urine==='unknown'&&draft.data.stool==='Not observed'&&!String(draft.data.note||'').trim())errors.push('Record an observation or add a note before saving.');
  return { valid: errors.length === 0, errors };
}

export function medicationSummary(medication: Medication): string {
  const method = medication.doseCalc.mode==='manual'?'Fixed-dose medication':'Weight-based medication';
  return `${method} — ${medication.route || 'route not set'}`;
}
