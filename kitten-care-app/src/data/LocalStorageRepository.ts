import type { CareRepository } from './CareRepository';
import type { CareState } from '../domain/models';
import { emptyState, migrateState } from './migrate';

const CURRENT_KEY = 'a4a-kitten-care-app';
const LEGACY_KEY = 'a4a-kitten-care-v3';

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
    localStorage.setItem(CURRENT_KEY, JSON.stringify(state));
    this.listeners.forEach((listener) => listener(state));
  }

  subscribe(listener: (state: CareState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private read(key: string): unknown | null {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  }
}
