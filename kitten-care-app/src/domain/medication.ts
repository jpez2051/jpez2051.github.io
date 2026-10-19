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
  if (medication.doseCalc.mode !== 'weightBased' || !Number.isFinite(medication.doseCalc.rate) || Number(medication.doseCalc.rate) <= 0) return null;
  const weight = kittenEvents(state, kitten.id, 'weight')[0];
  const weightG = Number(weight?.data.grams);
  if (!weight || !Number.isFinite(weightG) || weightG <= 0 || !Number.isFinite(Date.parse(weight.ts)) || Date.parse(weight.ts) > now.getTime()) return null;
  const kg = weightG / 1000;
  const mg = medication.doseCalc.rateUnit === 'mcg/kg' ? Number(medication.doseCalc.rate) * kg / 1000 : Number(medication.doseCalc.rate) * kg;
  const concentration = Number(medication.doseCalc.concentration);
  return {
    weightG,
    weightRecordedAt: weight.ts,
    stale: now.getTime() - Date.parse(weight.ts) > 24 * 3_600_000,
    mg,
    ml: Number.isFinite(concentration) && concentration > 0 ? mg / concentration : null,
  };
}
