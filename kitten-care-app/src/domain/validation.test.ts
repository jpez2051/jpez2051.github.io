import { describe,expect,it } from 'vitest';
import { validateCareDraft } from './validation';
import type { CareState,Kitten } from './models';
const kitten:Kitten={id:'k1',name:'Mochi',litterId:null,inFosterCare:true,dob:'',sex:'',markings:'',specialNeeds:'',feedingIntervalHours:4,medications:[],photo:null,carePlan:{feedingEnabled:true,dailyWeight:true,bottleBaby:false}};
const state:CareState={version:6,kittens:[kitten],litters:[],events:[],settings:{}};
const when='2026-08-28T10:00:00';
describe('care entry safety',()=>{
 it('requires an explicit true confirmation for an assigned medication',()=>{const assigned={...state,kittens:[{...kitten,medications:[{id:'m1',name:'Prescription',route:'Oral',source:'Vet',manualDose:'1',unit:'mL',doseCalc:{mode:'manual' as const},schedule:{type:'daily' as const},startDate:'',endDate:'',instructions:''}]}]};for(const confirmed of [false,'false',undefined])expect(validateCareDraft(assigned,{type:'medication',kittenId:'k1',when,data:{medId:'m1',status:'given',adminAmount:'1',adminUnit:'mL',confirmed}},new Date(when)).valid).toBe(false);expect(validateCareDraft(assigned,{type:'medication',kittenId:'k1',when,data:{medId:'m1',status:'given',adminAmount:'1',adminUnit:'mL',confirmed:true}},new Date(when)).valid).toBe(true)});
 it('rejects a successful feeding without a positive amount',()=>expect(validateCareDraft(state,{type:'feeding',kittenId:'k1',when,data:{outcome:'fed',amount:''}},new Date('2026-08-28T10:00:00')).valid).toBe(false));
 it('requires a note when a feeding is refused',()=>expect(validateCareDraft(state,{type:'feeding',kittenId:'k1',when,data:{outcome:'refused'}},new Date('2026-08-28T10:00:00')).errors).toContain('Add a note explaining the refused or unsuccessful feeding.'));
 it('rejects a medication entry when no plan is assigned',()=>expect(validateCareDraft(state,{type:'medication',kittenId:'k1',when,data:{status:'given',adminAmount:'1',adminUnit:'mL',confirmed:true}},new Date('2026-08-28T10:00:00')).valid).toBe(false));
 it('rejects care logged too far in the future',()=>expect(validateCareDraft(state,{type:'note',kittenId:'k1',when:'2026-08-28T11:00:00',data:{note:'test'}},new Date('2026-08-28T10:00:00')).valid).toBe(false));
});
