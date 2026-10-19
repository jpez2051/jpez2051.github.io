import type { CareEventType, CareState, Kitten, Medication } from './models';
import { calculateDose } from './medication';

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
    if (outcome !== 'fed' && !String(draft.data.note || '').trim()) errors.push('Add a note explaining the refused or unsuccessful feeding.');
  }

  if (draft.type === 'weight' && !positive(draft.data.grams)) errors.push('Enter a weight greater than zero grams.');

  if (draft.type === 'medication' && kitten) {
    const medication = kitten.medications.find((item) => item.id === draft.data.medId);
    if (!medication) errors.push('Choose a medication assigned to this kitten.');
    const status = String(draft.data.status || '');
    if (!['given', 'skipped', 'unable'].includes(status)) errors.push('Choose whether the dose was given, skipped, or unable to give.');
    if (status === 'given') {
      if (!String(draft.data.confirmed || '')) errors.push('Confirm the kitten, medication, route, and dose before saving.');
      if (!positive(draft.data.adminAmount)) errors.push('Enter the actual positive amount given.');
      if (!String(draft.data.adminUnit || '').trim()) errors.push('Choose the unit actually given.');
      if (medication?.doseCalc.mode === 'weightBased') {
        const dose = calculateDose(state, kitten, medication, now);
        if (!dose) errors.push('Record a current valid weight before giving this weight-based medication.');
        else if (dose.stale && !draft.data.staleWeightApproved) errors.push('The recorded weight is over 24 hours old. Record a current weight or confirm rescue approval to use it.');
      }
    } else if (!String(draft.data.note || '').trim()) errors.push('Add a reason for a skipped or unsuccessful dose.');
  }

  if (draft.type === 'note' && !String(draft.data.note || '').trim()) errors.push('Enter a care note.');
  return { valid: errors.length === 0, errors };
}

export function medicationSummary(kitten: Kitten, medication: Medication): string {
  const manual = `${medication.manualDose || 'amount not set'} ${medication.unit || ''}`.trim();
  return `${kitten.name} — ${medication.name} — ${manual} — ${medication.route || 'route not set'}`;
}
