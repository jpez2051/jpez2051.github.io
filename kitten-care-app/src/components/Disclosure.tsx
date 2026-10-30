import {useId,useState,type ReactNode} from 'react';
import {Icon} from './Icon';
export function Disclosure({label,children}:{label:string;children:ReactNode}){const [open,setOpen]=useState(false),id=useId();return <div className="instruction-disclosure"><button className="disclosure-trigger" type="button" aria-expanded={open} aria-controls={id} onClick={()=>setOpen(value=>!value)}>{label}<Icon name="arrow"/></button><div className="disclosure-content" id={id} hidden={!open}>{children}</div></div>}
