import type {Medication} from '../domain/models';
import type {DoseResult} from '../domain/medication';
import {formatDose,suggestedDoseAmount} from '../domain/doseDisplay';
export function DoseAmount({medication,dose}:{medication:Medication;dose:DoseResult|null}){
 const amount=suggestedDoseAmount(medication,dose);
 if(!amount)return <p className="calculated-amount">No calculated amount is available. Review the weight and plan.</p>;
 return <><p className="calculated-amount">{medication.doseCalc.mode==='manual'?'Prescribed amount per dose:':'Calculated amount for this dose:'}<strong>{amount} {medication.unit}</strong></p>{dose?.treatmentDay&&<p className="treatment-day">Treatment day {dose.treatmentDay} · {dose.rateMlPerLb} mL/lb</p>}</>;
}
export function DoseMath({medication,dose}:{medication:Medication;dose:DoseResult|null}){
 if(!dose)return medication.doseCalc.mode==='manual'?null:<p>No current calculation is available. Record a recent weight and check the plan dates.</p>;
 return <div className="dose-math"><p>Based on {dose.weightG} g recorded {new Date(dose.weightRecordedAt).toLocaleString()}.</p>{dose.rateMlPerLb!==undefined?<p className="dose-equation">{dose.weightG} g ÷ 453.59237 g per lb × {dose.rateMlPerLb} mL/lb = {dose.ml!==null?formatDose(dose.ml):'unavailable'} mL per dose.</p>:<p className="dose-equation">{dose.weightG} g ÷ 1,000 = {dose.weightG/1000} kg; apply {medication.doseCalc.rate} {medication.doseCalc.rateUnit||'mg/kg'}{medication.doseCalc.concentration?`${medication.doseCalc.rateUnit==='mcg/kg'?', convert micrograms to milligrams (÷ 1,000)':''}, then divide by ${medication.doseCalc.concentration} mg/mL`:''}.</p>}<p>Unrounded calculation: {medication.unit==='mg'?dose.mg:dose.ml} {medication.unit}. Display precision is not a syringe instruction.</p>{dose.stale&&<p className="warning">This weight is more than 24 hours old. Update the weight before using a current calculation.</p>}</div>;
}
