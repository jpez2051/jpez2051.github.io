import { describe, expect, it } from 'vitest';
import { activeKittens, latestWeight, localDateKey, nextFeedingAt, todayCount } from './care';
import { calculateDose } from './medication';
import type { CareState, Kitten, Medication } from './models';

const kitten: Kitten = { id:'k1',name:'Mochi',litterId:'l1',inFosterCare:true,dob:'',sex:'',markings:'',specialNeeds:'',feedingIntervalHours:4,medications:[],photo:null,carePlan:{feedingEnabled:true,dailyWeight:true,bottleBaby:false} };
const state: CareState = { version:6,kittens:[kitten,{...kitten,id:'k2',inFosterCare:false}],litters:[],settings:{},events:[{id:'w1',kittenId:'k1',type:'weight',ts:'2026-08-28T08:00:00Z',createdAt:'2026-08-28T08:00:00Z',data:{grams:400}},{id:'f1',kittenId:'k1',type:'feeding',ts:'2026-08-28T09:00:00Z',createdAt:'2026-08-28T09:00:00Z',data:{amount:'10',outcome:'fed'}}] };

describe('care domain',()=>{
  it('filters active kittens',()=>expect(activeKittens(state).map(k=>k.id)).toEqual(['k1']));
  it('returns the latest weight',()=>expect(latestWeight(state,'k1')).toBe(400));
  it('calculates the next feeding',()=>expect(nextFeedingAt(state,kitten)?.toISOString()).toBe('2026-08-28T13:00:00.000Z'));
  it('counts only successful feeds on the requested local day',()=>{const day=new Date('2026-08-28T09:00:00Z');expect(todayCount(state,'feeding',day)).toBe(1);expect(todayCount(state,'feeding',new Date('2026-08-30T09:00:00Z'))).toBe(0);const attempted={...state,events:[...state.events,{...state.events[1],id:'attempt',data:{outcome:'refused',note:'refused'}}]};expect(todayCount(attempted,'feeding',day)).toBe(1)});
  it('counts given doses without counting skipped or unsuccessful doses',()=>{const doses={...state,events:['given','skipped','unable'].map((status)=>({id:status,kittenId:'k1',type:'medication' as const,ts:'2026-08-28T09:00:00Z',createdAt:'2026-08-28T09:00:00Z',data:{status}}))};expect(todayCount(doses,'medication',new Date('2026-08-28T09:00:00Z'))).toBe(1)});
  it('does not reset feeding due time for refused attempts',()=>{const refused={...state,events:[...state.events,{id:'f2',kittenId:'k1',type:'feeding' as const,ts:'2026-08-28T12:00:00Z',createdAt:'2026-08-28T12:00:00Z',data:{outcome:'refused',note:'would not latch'}}]};expect(nextFeedingAt(refused,kitten)?.toISOString()).toBe('2026-08-28T13:00:00.000Z')});
  it('formats calendar dates from local fields rather than UTC',()=>expect(localDateKey(new Date(2026,7,28,23,30))).toBe('2026-08-28'));
});

describe('weight-based medication arithmetic',()=>{
  const medication: Medication={id:'m1',name:'Test',route:'Oral',source:'Vet',manualDose:'',unit:'mL',doseCalc:{mode:'weightBased',rate:50,rateUnit:'mg/kg',concentration:50},schedule:{type:'daily'},startDate:'',endDate:'',instructions:''};
  it('calculates mg and mL from the recorded weight',()=>{const result=calculateDose(state,kitten,medication,new Date('2026-08-28T09:00:00Z'));expect(result?.mg).toBe(20);expect(result?.ml).toBe(.4);expect(result?.stale).toBe(false)});
  it('flags a weight older than 24 hours',()=>expect(calculateDose(state,kitten,medication,new Date('2026-08-30T09:00:00Z'))?.stale).toBe(true));
});
