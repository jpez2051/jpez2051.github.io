import { useCallback, useEffect, useRef, useState } from 'react';
import type { CareRepository } from '../data/CareRepository';
import type { CareState } from '../domain/models';
import { emptyState } from '../data/migrate';

export function useCareState(repository: CareRepository) {
  const [state, setState] = useState<CareState>(emptyState());
  const [ready, setReady] = useState(false);
  const [saveError, setSaveError] = useState('');
  const currentRef = useRef(state);
  const loadFailed = useRef(false);
  const writeQueue = useRef<Promise<unknown>>(Promise.resolve());

  useEffect(() => {
    repository.load().then((loaded) => { loadFailed.current=false; currentRef.current = loaded; setState(loaded); setReady(true); }).catch((error) => { loadFailed.current=true; setSaveError(String(error instanceof Error ? error.message : error)); setReady(true); });
    return repository.subscribe((next) => { currentRef.current = next; setState(next); });
  }, [repository]);

  const update = useCallback((change: (current: CareState) => CareState) => {
    const operation=writeQueue.current.then(async()=>{
      if(loadFailed.current){setSaveError('Saved care data could not be loaded. Reload or recover a backup before adding new records.');return false}
      const next=change(currentRef.current);
      try {
        await repository.save(next);
        currentRef.current=next;setState(next);setSaveError('');return true;
      } catch(error){setSaveError(String(error instanceof Error ? error.message : error));return false}
    });
    writeQueue.current=operation.catch(()=>false);
    return operation;
  }, [repository]);

  return { state, update, ready, saveError, clearSaveError: () => setSaveError('') };
}
