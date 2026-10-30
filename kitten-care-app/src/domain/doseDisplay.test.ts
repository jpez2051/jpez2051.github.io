import {describe,it,expect} from 'vitest';
import {migrateState} from '../data/migrate';
import type {Medication} from './models';
import {calculateDose} from './medication';
import {doseCalculationKey,formatDose,suggestedDoseAmount} from './doseDisplay';
const now=new Date('2026-10-30T12:00:00');
const med:Medication={id:'m1',name:'Test',route:'Oral',source:'Test instructions',manualDose:'',unit:'mL',doseCalc:{mode:'weightBased',rate:.15,rateUnit:'mL/lb'},startDate:'2026-10-30',endDate:'',schedule:{type:'daily',times:['08:00']},instructions:''};
describe('shared individual and litter dose presentation',()=>{
 const state=migrateState({kittens:[{id:'k1',name:'Test'}],events:[{id:'w1',kittenId:'k1',type:'weight',ts:now.toISOString(),createdAt:now.toISOString(),data:{grams:453.59237}}],litters:[]});
 it('formats each kitten calculation and updates the calculation key after a new weight',()=>{const first=calculateDose(state,state.kittens[0],med,now);expect(suggestedDoseAmount(med,first)).toBe('0.150');const next=calculateDose({...state,events:[{...state.events[0],data:{grams:907.18474}}]},state.kittens[0],med,now);expect(suggestedDoseAmount(med,next)).toBe('0.300');expect(doseCalculationKey(med,next)).not.toBe(doseCalculationKey(med,first))});
 it('keeps fixed prescriptions separate from calculated amounts and does not invent missing amounts',()=>{expect(suggestedDoseAmount({...med,doseCalc:{mode:'manual'},manualDose:'.4'},null)).toBe('.4');expect(suggestedDoseAmount(med,null)).toBe('');expect(suggestedDoseAmount({...med,unit:'mg'},calculateDose(state,state.kittens[0],med,now))).toBe('')});
 it('shows mg/kg conversions in the prescribed unit and retains precision for very small amounts',()=>{const prescription={...med,doseCalc:{mode:'weightBased' as const,rate:50,rateUnit:'mg/kg' as const,concentration:50}},dose=calculateDose(state,state.kittens[0],prescription,now);expect(suggestedDoseAmount(prescription,dose)).toBe('0.454');expect(suggestedDoseAmount({...prescription,unit:'mg'},dose)).toBe('22.680');expect(formatDose(.0001234)).toBe('0.000123')});
});
