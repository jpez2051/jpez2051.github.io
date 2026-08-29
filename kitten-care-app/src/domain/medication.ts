import type { CareState, Kitten, Medication } from './models';
import { kittenEvents } from './care';

export interface DoseResult {
  weightG: number;
  weightRecordedAt: string;
  stale: boolean;
  mg: number;
  ml: number | null;
}

export function calculateDose(state: CareState, kitten: Kitten, medication: Medication, now = new Date()): DoseResult | null {
  if (medication.doseCalc.mode !== 'weightBased' || !medication.doseCalc.rate) return null;
  const weight = kittenEvents(state, kitten.id, 'weight')[0];
  const weightG = Number(weight?.data.grams);
  if (!weight || !Number.isFinite(weightG) || weightG <= 0) return null;
  const kg = weightG / 1000;
  const mg = medication.doseCalc.rateUnit === 'mcg/kg' ? medication.doseCalc.rate * kg / 1000 : medication.doseCalc.rate * kg;
  const concentration = Number(medication.doseCalc.concentration);
  return {
    weightG,
    weightRecordedAt: weight.ts,
    stale: now.getTime() - Date.parse(weight.ts) > 24 * 3_600_000,
    mg,
    ml: Number.isFinite(concentration) && concentration > 0 ? mg / concentration : null,
  };
}
