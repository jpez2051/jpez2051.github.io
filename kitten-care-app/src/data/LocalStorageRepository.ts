import type { CareRepository } from './CareRepository';
import type { CareState } from '../domain/models';
import { emptyState, migrateState } from './migrate';

const CURRENT_KEY = 'a4a-kitten-care-app';
const LEGACY_KEY = 'a4a-kitten-care-v3';

export class CareStorageError extends Error {
  constructor(message: string, options?: ErrorOptions) { super(message, options); this.name = 'CareStorageError'; }
}

export class LocalStorageRepository implements CareRepository {
  private listeners = new Set<(state: CareState) => void>();

  async load(): Promise<CareState> {
    const current = this.read(CURRENT_KEY);
    if (current) return migrateState(current);
    const legacy = this.read(LEGACY_KEY);
    if (legacy) {
      const migrated = migrateState(legacy);
      await this.save(migrated);
      return migrated;
    }
    return emptyState();
  }

  async save(state: CareState): Promise<void> {
    try {
      const serialized = JSON.stringify(state);
      localStorage.setItem(CURRENT_KEY, serialized);
      if (localStorage.getItem(CURRENT_KEY) !== serialized) throw new Error('Save verification failed');
      this.listeners.forEach((listener) => listener(state));
    } catch (error) {
      throw new CareStorageError('Your care entry was not saved. Browser storage may be full or unavailable. Make a backup before continuing.', { cause: error });
    }
  }

  subscribe(listener: (state: CareState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
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
