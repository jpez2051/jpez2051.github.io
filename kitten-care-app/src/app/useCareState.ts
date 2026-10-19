import { useCallback, useEffect, useRef, useState } from 'react';
import type { CareRepository } from '../data/CareRepository';
import type { CareState } from '../domain/models';
import { emptyState } from '../data/migrate';

export function useCareState(repository: CareRepository) {
  const [state, setState] = useState<CareState>(emptyState());
  const [ready, setReady] = useState(false);
  const [saveError, setSaveError] = useState('');
  const currentRef = useRef(state);

  useEffect(() => {
    repository.load().then((loaded) => { currentRef.current = loaded; setState(loaded); setReady(true); }).catch((error) => { setSaveError(String(error instanceof Error ? error.message : error)); setReady(true); });
    return repository.subscribe((next) => { currentRef.current = next; setState(next); });
  }, [repository]);

  const update = useCallback(async (change: (current: CareState) => CareState) => {
    const previous = currentRef.current;
    const next = change(previous);
    currentRef.current = next;
    setState(next);
    setSaveError('');
    try { await repository.save(next); return true; }
    catch (error) {
      currentRef.current = previous;
      setState(previous);
      setSaveError(String(error instanceof Error ? error.message : error));
      return false;
    }
  }, [repository]);

  return { state, update, ready, saveError, clearSaveError: () => setSaveError('') };
}
