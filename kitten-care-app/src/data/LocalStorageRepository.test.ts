import { afterEach, describe, expect, it, vi } from 'vitest';
import { LocalStorageRepository } from './LocalStorageRepository';
import { emptyState } from './migrate';

afterEach(()=>vi.unstubAllGlobals());
describe('verified browser storage',()=>{
  it('does not announce a successful save when the write fails',async()=>{
    vi.stubGlobal('localStorage',{getItem:()=>null,setItem:()=>{throw new Error('Quota exceeded')}});
    const repository=new LocalStorageRepository(),listener=vi.fn();repository.subscribe(listener);
    await expect(repository.save(emptyState())).rejects.toThrow('not saved');expect(listener).not.toHaveBeenCalled();
  });
  it('rejects writes which cannot be read back',async()=>{
    vi.stubGlobal('localStorage',{getItem:()=>null,setItem:()=>{}});
    await expect(new LocalStorageRepository().save(emptyState())).rejects.toThrow('not saved');
  });
  it('does not silently discard corrupted stored data',async()=>{
    vi.stubGlobal('localStorage',{getItem:()=>'{broken',setItem:vi.fn()});
    await expect(new LocalStorageRepository().load()).rejects.toThrow('could not be read');
  });
});
