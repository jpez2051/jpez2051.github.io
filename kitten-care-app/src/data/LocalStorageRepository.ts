import type { CareRepository } from './CareRepository';
import type { CareState } from '../domain/models';
import { emptyState, migrateState, restoreBackup } from './migrate';

const CURRENT_KEY = 'a4a-kitten-care-app';
const LEGACY_KEY = 'a4a-kitten-care-v3';
const RECOVERY_KEY = 'a4a-kitten-care-app-previous';

export class CareStorageError extends Error {
  constructor(message: string, options?: ErrorOptions) { super(message, options); this.name = 'CareStorageError'; }
}

export class LocalStorageRepository implements CareRepository {
  private listeners = new Set<(state: CareState) => void>();
  private baseline: string|null|undefined;
  private storageChanged = (event:StorageEvent) => {
    if(event.key!==CURRENT_KEY&&event.key!==null)return;
    const raw=localStorage.getItem(CURRENT_KEY);
    if(raw===this.baseline)return;
    try{const state=raw===null?emptyState():restoreBackup(JSON.parse(raw));this.baseline=raw;this.listeners.forEach(listener=>listener(state))}catch{/* Keep current data; the next save fails rather than replacing unreadable data. */}
  };

  async load(): Promise<CareState> {
    this.baseline=localStorage.getItem(CURRENT_KEY);
    const current = this.read(CURRENT_KEY);
    if (current !== null) return restoreBackup(current);
    const legacy = this.read(LEGACY_KEY);
    if (legacy) {
      const migrated = migrateState(legacy);
      await this.save(migrated);
      return migrated;
    }
    return emptyState();
  }

  async save(state: CareState): Promise<void> {
    const expected=this.baseline===undefined?null:this.baseline;
    const write=()=>{
      const current=localStorage.getItem(CURRENT_KEY);
      if(current!==expected){
        try{const latest=current===null?emptyState():restoreBackup(JSON.parse(current));this.baseline=current;this.listeners.forEach(listener=>listener(latest))}catch{/* Never overwrite an unreadable newer copy. */}
        throw new CareStorageError('Another tab changed the care records. Your entry was not saved. The latest readable data has been loaded; review your open form and try again.');
      }
      const serialized=JSON.stringify(state);
      if(current!==null){let valid=false;try{restoreBackup(JSON.parse(current));valid=true}catch{/* Preserve the previous recovery copy when the current data is corrupt. */}if(valid)localStorage.setItem(RECOVERY_KEY,current)}
      localStorage.setItem(CURRENT_KEY,serialized);
      if(localStorage.getItem(CURRENT_KEY)!==serialized)throw new Error('Save verification failed');
      this.baseline=serialized;
      this.listeners.forEach(listener=>listener(state));
    };
    try {
      if(typeof navigator!=='undefined'&&navigator.locks)await navigator.locks.request('a4a-kitten-care-save',write);
      else if(typeof indexedDB!=='undefined')await this.indexedWrite(write);
      else if(typeof window==='undefined')write();
      else throw new CareStorageError('Safe browser saving is unavailable. Use an updated browser. Existing records were not changed; download a backup before switching.');
    } catch (error) {
      if(error instanceof CareStorageError)throw error;
      throw new CareStorageError('Your care entry was not saved. Browser storage may be full or unavailable. Make a backup before continuing.', { cause: error });
    }
  }

  subscribe(listener: (state: CareState) => void): () => void {
    if(!this.listeners.size&&typeof window!=='undefined')window.addEventListener('storage',this.storageChanged);
    this.listeners.add(listener);
    return () => {this.listeners.delete(listener);if(!this.listeners.size&&typeof window!=='undefined')window.removeEventListener('storage',this.storageChanged)};
  }

  async recoveryBackup():Promise<CareState|null>{const value=this.read(RECOVERY_KEY);return value===null?null:restoreBackup(value)}

  private indexedWrite(write:()=>void):Promise<void>{
    return new Promise((resolve,reject)=>{
      const request=indexedDB.open('a4a-care-save-lock',1);
      request.onupgradeneeded=()=>request.result.createObjectStore('locks');
      request.onerror=()=>reject(request.error);
      request.onsuccess=()=>{
        const db=request.result,transaction=db.transaction('locks','readwrite');let failure:unknown;
        transaction.objectStore('locks').put(Date.now(),'write').onsuccess=()=>{try{write()}catch(error){failure=error;transaction.abort()}};
        transaction.oncomplete=()=>{db.close();resolve()};
        transaction.onabort=()=>{db.close();reject(failure||transaction.error)};
        transaction.onerror=()=>{db.close();reject(failure||transaction.error)};
      };
    });
  }

  private read(key: string): unknown | null {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      throw new CareStorageError('Saved foster data could not be read safely. Restore a known-good backup before entering new care.', { cause: error });
    }
  }
}
