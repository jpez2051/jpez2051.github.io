import { describe, expect, it } from 'vitest';
import { migrateState, restoreBackup } from './migrate';

describe('V3 migration',()=>{
  it('keeps legacy departed kittens out of active care',()=>{const migrated=migrateState({kittens:[{id:'k1',name:'Archived',status:'Adopted'},{id:'k2',name:'Returned',status:'Returned to A4A'}],events:[],litters:[]});expect(migrated.kittens.every((k)=>!k.inFosterCare)).toBe(true)});
  it('imports legacy kittens with safe defaults',()=>{const migrated=migrateState({kittens:[{id:'k1',name:'Mochi'}],events:[],litters:[]});expect(migrated.version).toBe(7);expect(migrated.kittens[0].carePlan.feedingEnabled).toBe(true);expect(migrated.kittens[0].feedingIntervalHours).toBe(4)});
  it('marks measured legacy feedings as successful',()=>{const migrated=migrateState({kittens:[{id:'k1',name:'Mochi'}],events:[{id:'f1',kittenId:'k1',type:'feeding',ts:'2026-01-01T00:00:00Z',createdAt:'2026-01-01T00:00:00Z',data:{amount:'8'}}],litters:[]});expect(migrated.events[0].data.outcome).toBe('fed')});
  it('rejects malformed data',()=>expect(migrateState({nope:true}).kittens).toEqual([]));
  it('rejects invalid restore input instead of replacing records with an empty state',()=>{expect(()=>restoreBackup({nope:true})).toThrow();expect(()=>restoreBackup({kittens:[],litters:[],events:[{id:'orphan',kittenId:'missing',ts:'bad',data:{}}]})).toThrow();expect(restoreBackup({kittens:[],events:[],litters:[]}).version).toBe(7)});
});
