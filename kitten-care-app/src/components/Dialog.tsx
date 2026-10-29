import {Icon} from './Icon';
import type { PropsWithChildren } from 'react';
import { useEffect, useRef } from 'react';

interface DialogProps extends PropsWithChildren {
  title: string;
  onClose: () => void;
}

export function Dialog({ title, onClose, children }: DialogProps) {
  const panel = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const escape = (event: KeyboardEvent) => {
      if(event.key === 'Escape') closeRef.current();
      if(event.key !== 'Tab' || !panel.current) return;
      const elements = Array.from(panel.current.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],[tabindex="0"]')).filter((element)=>element.getClientRects().length);
      const first=elements[0],last=elements.at(-1);
      if(!first){event.preventDefault();return}
      if(event.shiftKey&&(document.activeElement===first||document.activeElement===panel.current)){event.preventDefault();last?.focus()}
      else if(!event.shiftKey&&(document.activeElement===last||document.activeElement===panel.current)){event.preventDefault();first.focus()}
    };
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('keydown', escape); previous?.focus(); };
  }, []);

  return <div className="overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title" tabIndex={-1} ref={panel}>
      <header className="dialog-head"><h2 id="dialog-title">{title}</h2><button className="icon-close" aria-label="Close dialog" onClick={onClose}><Icon name="close"/></button></header>
      {children}
    </div>
  </div>;
}
