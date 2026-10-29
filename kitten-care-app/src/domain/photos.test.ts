import {describe,it,expect} from 'vitest';
import {migrateState} from '../data/migrate';
import {updateKittenPhoto} from './photos';
describe('existing kitten photo updates',()=>{
 const state=migrateState({kittens:[{id:'k1',photo:null},{id:'k2',photo:'existing'}],events:[],litters:[]});
 it('changes only the selected photo and preserves care plans, stays, events and other kittens',()=>{const next=updateKittenPhoto(state,'k1','new',null);expect(next.kittens[0]).toEqual({...state.kittens[0],photo:'new'});expect(next.kittens[1]).toBe(state.kittens[1]);expect(next.events).toBe(state.events);expect(next.kittens[0].careStays).toBe(state.kittens[0].careStays);expect(next.kittens[0].medications).toBe(state.kittens[0].medications)});
 it('supports removing a photo without deleting the kitten',()=>{const next=updateKittenPhoto(state,'k2',null,'existing');expect(next.kittens[1].photo).toBeNull();expect(next.kittens).toHaveLength(2)});
 it('rejects stale photo edits and missing kittens',()=>{expect(()=>updateKittenPhoto(state,'k2','replacement','old')).toThrow(/changed/);expect(()=>updateKittenPhoto(state,'missing','replacement',null)).toThrow(/no longer exists/)});
});
