import { afterEach,beforeEach, describe, expect, it, vi } from 'vitest';
import { LocalStorageRepository } from './LocalStorageRepository';
import { emptyState } from './migrate';

beforeEach(()=>vi.stubGlobal('navigator',{}));
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
  it('rejects valid JSON with a broken storage schema',async()=>{vi.stubGlobal('localStorage',{getItem:()=>'{"unexpected":true}',setItem:vi.fn()});await expect(new LocalStorageRepository().load()).rejects.toThrow()});
  it('rejects stale writes and preserves the winning tab records',async()=>{
    const values=new Map<string,string>();vi.stubGlobal('localStorage',{getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>values.set(key,value)});
    const first=new LocalStorageRepository(),second=new LocalStorageRepository();await first.load();await second.load();
    const winning={...emptyState(),settings:{mentorName:'Winning tab'}},losing={...emptyState(),settings:{mentorName:'Stale tab'}};
    await first.save(winning);const listener=vi.fn();second.subscribe(listener);await expect(second.save(losing)).rejects.toThrow('Another tab');
    expect(JSON.parse(values.get('a4a-kitten-care-app')!).settings.mentorName).toBe('Winning tab');expect(listener).toHaveBeenCalledWith(expect.objectContaining({settings:expect.objectContaining(winning.settings)}));
    await second.save({...winning,settings:{...winning.settings,mentorPhone:'123'}});expect((await first.load()).settings).toMatchObject({mentorName:'Winning tab',mentorPhone:'123'});
    expect((await first.recoveryBackup())?.settings.mentorName).toBe('Winning tab');
  });
  it('compares the captured revision inside a serialized write lock',async()=>{
    const values=new Map<string,string>();let queue=Promise.resolve<unknown>(undefined);vi.stubGlobal('localStorage',{getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>values.set(key,value)});
    vi.stubGlobal('navigator',{locks:{request:(_name:string,callback:()=>void)=>{const operation=queue.then(callback);queue=operation.catch(()=>undefined);return operation}}});
    const a=new LocalStorageRepository(),b=new LocalStorageRepository();await a.load();await b.load();const results=await Promise.allSettled([a.save({...emptyState(),settings:{mentorName:'A'}}),b.save({...emptyState(),settings:{mentorName:'B'}})]);
    expect(results.filter(result=>result.status==='fulfilled')).toHaveLength(1);expect(results.filter(result=>result.status==='rejected')).toHaveLength(1);
  });
  it('keeps a good recovery copy when explicitly replacing corrupted current data',async()=>{
    const values=new Map([['a4a-kitten-care-app','{broken'],['a4a-kitten-care-app-previous',JSON.stringify({...emptyState(),settings:{mentorName:'Recovery'}})]]);vi.stubGlobal('localStorage',{getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>values.set(key,value)});
    const repository=new LocalStorageRepository();await expect(repository.load()).rejects.toThrow();await repository.save(emptyState());expect((await repository.recoveryBackup())?.settings.mentorName).toBe('Recovery');
  });
  it('does not replace current data if saving the recovery copy fails',async()=>{
    const original=JSON.stringify(emptyState());vi.stubGlobal('localStorage',{getItem:(key:string)=>key==='a4a-kitten-care-app'?original:null,setItem:()=>{throw new Error('Storage full')}});const repository=new LocalStorageRepository();await repository.load();await expect(repository.save({...emptyState(),settings:{mentorName:'Not saved'}})).rejects.toThrow('not saved');expect(localStorage.getItem('a4a-kitten-care-app')).toBe(original);
  });});
