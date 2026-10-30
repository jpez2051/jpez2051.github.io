import type { CareState, Kitten, Medication } from './models';
import { kittenEvents } from './care';
import { chartArithmetic,chartRateForDay,recentMedicationWeight,rescueDoseIssues,rescueTemplate,treatmentDay } from './rescueMedications';

export interface DoseResult {
  weightG: number;
  weightRecordedAt: string;
  stale: boolean;
  mg: number | null;
  ml: number | null;
  rateMlPerLb?:number;
  treatmentDay?:number;
}

export function calculateDose(state: CareState, kitten: Kitten, medication: Medication, now = new Date()): DoseResult | null {
  if(medication.doseCalc.mode==='rescueChart'){
    if(rescueDoseIssues(state,kitten,medication,now).length)return null;
    const template=rescueTemplate(medication.rescueChart!.templateId)!,weight=recentMedicationWeight(state,kitten.id,now)!,day=treatmentDay(medication.startDate,now)!;
    const rateMlPerLb=chartRateForDay(template,day)!;
    return {weightG:weight.grams,weightRecordedAt:weight.recordedAt,stale:false,mg:null,ml:chartArithmetic(weight.grams,rateMlPerLb),rateMlPerLb,treatmentDay:day};
  }
  if (medication.doseCalc.mode !== 'weightBased' || !Number.isFinite(medication.doseCalc.rate) || Number(medication.doseCalc.rate) <= 0) return null;
  const weight = kittenEvents(state, kitten.id, 'weight')[0];
  const weightG = Number(weight?.data.grams);
  if (!weight || !Number.isFinite(weightG) || weightG <= 0 || !Number.isFinite(Date.parse(weight.ts)) || Date.parse(weight.ts) > now.getTime()) return null;
  const kg = weightG / 1000;
  if(medication.doseCalc.rateUnit==='mL/lb')return {weightG,weightRecordedAt:weight.ts,stale:now.getTime()-Date.parse(weight.ts)>24*3_600_000,mg:null,ml:chartArithmetic(weightG,Number(medication.doseCalc.rate)),rateMlPerLb:Number(medication.doseCalc.rate)};
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
