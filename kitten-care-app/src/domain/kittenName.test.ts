import {describe,it,expect} from 'vitest';
import {migrateState} from '../data/migrate';
import {updateKittenName} from './kittenName';
describe('kitten renaming',()=>{
 const state=migrateState({kittens:[{id:'k1',name:'Original',photo:'photo',inFosterCare:true,medications:[{id:'m1',name:'Plan'}]},{id:'k2',name:'Sibling',inFosterCare:false}],events:[],litters:[]});
 it('trims names while retaining identity and all related data',()=>{const next=updateKittenName(state,'k1','  New name  ','Original');expect(next.kittens[0]).toEqual({...state.kittens[0],name:'New name'});expect(next.kittens[0].medications).toBe(state.kittens[0].medications);expect(next.kittens[0].careStays).toBe(state.kittens[0].careStays);expect(next.kittens[1]).toBe(state.kittens[1]);expect(next.events).toBe(state.events)});
 it('allows past kittens and matching names without merging kittens',()=>{const next=updateKittenName(state,'k2','Original','Sibling');expect(next.kittens).toHaveLength(2);expect(next.kittens[1].id).toBe('k2');expect(next.kittens[1].inFosterCare).toBe(false)});
 it('rejects blank, overlong, stale or missing records',()=>{expect(()=>updateKittenName(state,'k1','   ','Original')).toThrow(/Enter/);expect(()=>updateKittenName(state,'k1','a'.repeat(121),'Original')).toThrow(/120/);expect(()=>updateKittenName(state,'k1','New','Stale')).toThrow(/changed/);expect(()=>updateKittenName(state,'missing','New','Original')).toThrow(/no longer exists/)});
 it('merges safely with a concurrent photo change',()=>{const changed={...state,kittens:state.kittens.map(k=>k.id==='k1'?{...k,photo:'New photo'}:k)};expect(updateKittenName(changed,'k1','New','Original').kittens[0].photo).toBe('New photo')});
});
