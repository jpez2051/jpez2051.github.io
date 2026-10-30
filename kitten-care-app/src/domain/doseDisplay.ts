import type {Medication} from './models';
import type {DoseResult} from './medication';
export const formatDose=(amount:number)=>amount!==0&&Math.abs(amount)<0.001?amount.toPrecision(3):amount.toFixed(3);
export function suggestedDoseAmount(medication:Medication,dose:DoseResult|null):string{
 if(medication.doseCalc.mode==='manual')return medication.manualDose;
 const amount=medication.unit==='mg'?dose?.mg:dose?.ml;
 return amount===null||amount===undefined||!Number.isFinite(amount)?'':formatDose(amount);
}
export function doseCalculationKey(medication:Medication,dose:DoseResult|null):string{
 return JSON.stringify([medication,dose?.weightG,dose?.weightRecordedAt,dose?.treatmentDay,dose?.stale,dose?.mg,dose?.ml]);
}
