import { useCallback, useEffect, useState } from 'react';
import type { CareRepository } from '../data/CareRepository';
import type { CareState } from '../domain/models';
import { emptyState } from '../data/migrate';

export function useCareState(repository: CareRepository) {
  const [state, setState] = useState<CareState>(emptyState());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    repository.load().then((loaded) => { setState(loaded); setReady(true); });
    return repository.subscribe(setState);
  }, [repository]);

  const update = useCallback((change: (current: CareState) => CareState) => {
    setState((current) => {
      const next = change(current);
      void repository.save(next);
      return next;
    });
  }, [repository]);

  return { state, update, ready };
}
