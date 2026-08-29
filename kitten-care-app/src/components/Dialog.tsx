import type { PropsWithChildren } from 'react';
import { useEffect, useRef } from 'react';

interface DialogProps extends PropsWithChildren {
  title: string;
  onClose: () => void;
}

export function Dialog({ title, onClose, children }: DialogProps) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    panel.current?.focus();
    const escape = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  }, [onClose]);

  return <div className="overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title" tabIndex={-1} ref={panel}>
      <header className="dialog-head"><h2 id="dialog-title">{title}</h2><button className="icon-close" aria-label="Close dialog" onClick={onClose}>×</button></header>
      {children}
    </div>
  </div>;
}
