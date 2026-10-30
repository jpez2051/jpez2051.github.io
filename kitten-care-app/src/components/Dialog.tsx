import {Icon} from './Icon';
import type { PropsWithChildren } from 'react';
import { useLayoutEffect, useRef } from 'react';

let locks=0,restorePage:(()=>void)|undefined;
function lockPage(){
 if(locks++===0){const x=window.scrollX,y=window.scrollY,body=document.body,html=document.documentElement;
 const saved={position:body.style.position,top:body.style.top,left:body.style.left,width:body.style.width,overflow:body.style.overflow,paddingRight:body.style.paddingRight,htmlOverflow:html.style.overflow};
 const gap=window.innerWidth-html.clientWidth;if(gap)body.style.paddingRight=`${parseFloat(getComputedStyle(body).paddingRight)+gap}px`;
 Object.assign(body.style,{position:'fixed',top:`-${y}px`,left:`-${x}px`,width:'100%',overflow:'hidden'});html.style.overflow='hidden';
 restorePage=()=>{Object.assign(body.style,{position:saved.position,top:saved.top,left:saved.left,width:saved.width,overflow:saved.overflow,paddingRight:saved.paddingRight});html.style.overflow=saved.htmlOverflow;window.scrollTo(x,y)};
 }
 return ()=>{if(--locks===0){restorePage?.();restorePage=undefined}};
}

interface DialogProps extends PropsWithChildren {
  title: string;
  onClose: () => void;
}

export function Dialog({ title, onClose, children }: DialogProps) {
  const panel = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useLayoutEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const unlock=lockPage();
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
    return () => { document.removeEventListener('keydown', escape); unlock();previous?.focus({preventScroll:true}); };
  }, []);

  return <div className="overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title" tabIndex={-1} ref={panel}>
      <header className="dialog-head"><h2 id="dialog-title">{title}</h2><button className="icon-close" aria-label="Close dialog" onClick={onClose}><Icon name="close"/></button></header>
      <div className="dialog-body">{children}</div>
    </div>
  </div>;
}
