import type {CareState,CareStay,Departure,Kitten} from './models';
import {localDateKey} from './care';
export const departureLabels:Record<Departure,string>={'another-foster':'Another foster',adopted:'Adopted',petco:'Petco cubby',rescue:'Rescue facility',deceased:'Passed away',other:'Other destination',unknown:'Unknown outcome'};
export function validCareDate(value:string){if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const d=new Date(value+'T12:00:00');return Number.isFinite(d.getTime())&&localDateKey(d)===value}
function dayNumber(value:string){const [y,m,d]=value.split('-').map(Number);return Date.UTC(y,m-1,d)/86400000}
export function stayDays(stay:CareStay,today=localDateKey()):number|null{const end=stay.closed?stay.departure:today;return validCareDate(stay.arrival)&&validCareDate(end)&&end>=stay.arrival?dayNumber(end)-dayNumber(stay.arrival)+1:null}
export function stayErrors(stay:CareStay,others:CareStay[]=[],today=localDateKey()):string[]{
 const errors:string[]=[];
 if(stay.arrival&&(!validCareDate(stay.arrival)||stay.arrival>today))errors.push('Enter a valid arrival date on or before today.');
 if(stay.departure&&(!validCareDate(stay.departure)||stay.departure>today))errors.push('Enter a valid departure date on or before today.');
 if(!stay.closed&&stay.departure)errors.push('An open stay cannot have a departure date.');
 if(stay.arrival&&stay.departure&&stay.departure<stay.arrival)errors.push('Departure cannot be before arrival.');
 if(!Object.hasOwn(departureLabels,stay.outcome))errors.push('Choose a valid departure reason.');
 if(others.some(s=>s.id!==stay.id&&!s.closed&&!stay.closed))errors.push('This kitten already has an open care stay.');
 if(stay.arrival&&others.some(s=>s.id!==stay.id&&s.arrival&&((stay.arrival===s.arrival&&stay.departure===s.departure&&stay.closed===s.closed)||(stay.arrival<(s.closed?s.departure||today:today)&&s.arrival<(stay.closed?stay.departure||today:today)))))errors.push('These dates overlap another care stay. Review the dates first.');
 return errors;
}
export function saveStay(state:CareState,kittenId:string,stay:CareStay,expected?:string,reason=''):CareState{
 const kitten=state.kittens.find(k=>k.id===kittenId);if(!kitten)throw new Error('Kitten no longer exists.');
 const previous=kitten.careStays?.find(s=>s.id===stay.id);
 if(expected!==undefined&&JSON.stringify(previous)!==expected)throw new Error('This care stay changed. Reopen it before saving.');
 if(previous&&!reason.trim())throw new Error('Add a reason for updating this care stay.');
 const errors=stayErrors(stay,kitten.careStays);if(errors.length)throw new Error(errors.join(' '));
 const updated={...stay,revisions:previous?[...(previous.revisions||[]),{at:new Date().toISOString(),reason:reason.trim(),previous:JSON.stringify({...previous,revisions:undefined})}]:[]};
 const stays=previous?(kitten.careStays||[]).map(s=>s.id===stay.id?updated:s):[...(kitten.careStays||[]),updated];
 return {...state,kittens:state.kittens.map(k=>k.id===kittenId?{...k,careStays:stays,inFosterCare:stays.some(s=>!s.closed)}:k)};
}
export function journeyStats(kittens:Kitten[]){const stays=kittens.flatMap(k=>k.careStays||[]);return {unique:kittens.length,current:kittens.filter(k=>k.inFosterCare).length,stays:stays.length,knownDays:stays.reduce((n,s)=>n+(stayDays(s)??0),0),unknownDates:stays.filter(s=>stayDays(s)===null).length,approximate:stays.some(s=>s.approximate)}};
