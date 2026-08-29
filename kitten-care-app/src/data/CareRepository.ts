import type { CareState } from '../domain/models';

export interface CareRepository {
  load(): Promise<CareState>;
  save(state: CareState): Promise<void>;
  subscribe(listener: (state: CareState) => void): () => void;
}
