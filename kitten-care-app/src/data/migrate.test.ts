import { describe, expect, it } from 'vitest';
import { migrateState } from './migrate';

describe('V3 migration',()=>{
  it('imports legacy kittens with safe defaults',()=>{const migrated=migrateState({kittens:[{id:'k1',name:'Mochi'}],events:[],litters:[]});expect(migrated.version).toBe(5);expect(migrated.kittens[0].carePlan.feedingEnabled).toBe(true);expect(migrated.kittens[0].feedingIntervalHours).toBe(4)});
  it('rejects malformed data',()=>expect(migrateState({nope:true}).kittens).toEqual([]));
});
