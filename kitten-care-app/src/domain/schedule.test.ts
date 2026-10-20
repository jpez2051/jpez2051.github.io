import { describe,expect,it } from 'vitest';
import { localDateKey } from './care';
import { nextMedicationDue,scheduleErrors,medicationScheduleIssue } from './schedule';
import { careQueue } from './queue';
import type { CareState,Kitten,Medication,MedicationSchedule } from './models';

const kitten:Kitten={id:'k1',name:'Mochi',litterId:null,inFosterCare:true,dob:'',sex:'',markings:'',specialNeeds:'',feedingIntervalHours:4,medications:[],photo:null,carePlan:{feedingEnabled:true,dailyWeight:true,bottleBaby:true}};
const base:Medication={id:'m1',name:'Prescription',route:'Oral',source:'Rescue',manualDose:'0.4',unit:'mL',doseCalc:{mode:'manual'},schedule:{type:'daily',times:['08:00']},startDate:'2026-10-19',endDate:'2026-10-25',instructions:''};
const state:CareState={version:6,kittens:[kitten],litters:[],events:[],settings:{}};
const date=(value:string)=>new Date(value);
const now=date('2026-10-19T12:00:00');
const logged=(status:string,when='2026-10-19T08:00:00'):CareState=>({...state,events:[{id:'e1',kittenId:'k1',type:'medication',ts:date(when).toISOString(),createdAt:now.toISOString(),data:{medId:'m1',status}}]});
describe('prescription schedules',()=>{
 it('retains the first unrecorded daily dose as overdue',()=>expect(nextMedicationDue(state,kitten,base,now)?.getHours()).toBe(8));
 it.each(['skipped','unable'])('does not move a dose after %s',status=>expect(nextMedicationDue(logged(status),kitten,base,now)?.getHours()).toBe(8));
 it('moves daily fixed times only after a given dose',()=>expect(localDateKey(nextMedicationDue(logged('given'),kitten,base,now)!)).toBe('2026-10-20'));
 it.each([['twiceDaily',['08:00','20:00'],20],['threeDaily',['08:00','14:00','20:00'],14]] as const)('selects the next fixed time for %s',(type,times,hour)=>expect(nextMedicationDue(logged('given'),kitten,{...base,schedule:{type,times:[...times]}},now)?.getHours()).toBe(hour));
 it('uses elapsed hours after an administered dose',()=>expect(nextMedicationDue(logged('given'),kitten,{...base,schedule:{type:'intervalHours',intervalHours:6}},now)?.getHours()).toBe(14));
 it('uses an explicit first dose before interval treatment begins',()=>expect(nextMedicationDue(state,kitten,{...base,schedule:{type:'intervalHours',intervalHours:6,firstDoseAt:'2026-10-19T09:00:00'}},now)?.getHours()).toBe(9));
 it('does not invent a first dose time for imported interval plans',()=>{const med={...base,schedule:{type:'intervalHours',intervalHours:6} as MedicationSchedule};expect(nextMedicationDue(state,kitten,med,now)).toBeNull();expect(medicationScheduleIssue(state,kitten,med,now)).toMatch(/first dose/)});
 it('uses local calendar days for multi-day intervals',()=>expect(localDateKey(nextMedicationDue(logged('given'),kitten,{...base,schedule:{type:'intervalDays',intervalDays:2}},now)!)).toBe('2026-10-21'));
 it('chooses the selected weekday',()=>expect(localDateKey(nextMedicationDue(state,kitten,{...base,schedule:{type:'specificDays',days:['Wed'],times:['10:00']}},now)!)).toBe('2026-10-21'));
 it('finishes one-time medication after a given dose',()=>expect(nextMedicationDue(logged('given'),kitten,{...base,schedule:{type:'oneTime',oneTimeAt:'2026-10-19T08:00:00'}},now)).toBeNull());
 it('never creates automatic PRN reminders',()=>expect(nextMedicationDue(state,kitten,{...base,schedule:{type:'prn'}},now)).toBeNull());
 it('stops scheduling after the local prescription end date',()=>expect(nextMedicationDue(state,kitten,base,date('2026-10-26T00:00:00'))).toBeNull());
 it('rejects duplicate fixed times and empty weekdays',()=>{expect(scheduleErrors({type:'twiceDaily',times:['08:00','08:00']})).not.toEqual([]);expect(scheduleErrors({type:'specificDays',times:['08:00'],days:[]})).not.toEqual([])});
 it('keeps an ended plan active through the end of its local day',()=>expect(nextMedicationDue({...state,events:logged('given','2026-10-25T08:00:00').events},kitten,{...base,schedule:{type:'twiceDaily',times:['08:00','20:00']}},date('2026-10-25T19:00:00'))?.getHours()).toBe(20));
});
describe('care queue',()=>{
 it('includes due medication and daily weights alongside feeding',()=>{const result=careQueue({...state,kittens:[{...kitten,medications:[base]}]},now);expect(result.map((item)=>item.type)).toEqual(expect.arrayContaining(['feeding','weight','medication']));expect(result.find((item)=>item.type==='medication')?.medId).toBe('m1')});
 it('flags weight decreases and excludes archived kittens',()=>{const result=careQueue({...state,kittens:[kitten,{...kitten,id:'archived',inFosterCare:false}],events:[{id:'w1',kittenId:'k1',type:'weight',ts:'2026-10-18T10:00:00',createdAt:now.toISOString(),data:{grams:420}},{id:'w2',kittenId:'k1',type:'weight',ts:'2026-10-19T10:00:00',createdAt:now.toISOString(),data:{grams:400}}]},now);expect(result.some((item)=>item.review&&item.type==='weight')).toBe(true);expect(result.some((item)=>item.kitten.id==='archived')).toBe(false)});
});
