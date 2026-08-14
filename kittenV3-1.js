'use strict';
const STORAGE_KEY='a4a-kitten-care-v3';
let state=migrate(loadRaw()),activeView='today',activeKittenId=null;
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
function uid(p='id'){return p+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8)}
function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function loadRaw(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'null')}catch(e){console.error('Storage parse error',e);return null}}
function migrate(raw){
 const s=raw&&Array.isArray(raw.kittens)&&Array.isArray(raw.events)?raw:{version:4,kittens:[],events:[],litters:[],settings:{fosterName:'Foster Home'}};
 s.version=4;s.settings=s.settings||{fosterName:'Foster Home'};s.events=s.events||[];s.litters=Array.isArray(s.litters)?s.litters:[];
 const byName=new Map(s.litters.map(l=>[(l.name||'').trim().toLowerCase(),l]));
 s.kittens=(s.kittens||[]).map(k=>{k.medications=Array.isArray(k.medications)?k.medications:[];k.photo=k.photo||null;k.status=k.status||'In foster';k.carePlan={feedingEnabled:k.carePlan?.feedingEnabled??true,dailyWeight:k.carePlan?.dailyWeight??true,bottleBaby:k.carePlan?.bottleBaby??false,...(k.carePlan||{})};
   if(!k.litterId&&k.litter){const key=String(k.litter).trim().toLowerCase();if(key){let l=byName.get(key);if(!l){l={id:uid('litter'),name:String(k.litter).trim(),dob:'',intakeDate:'',foster:'',notes:''};s.litters.push(l);byName.set(key,l)}k.litterId=l.id}}
   k.medications=k.medications.map(m=>normalizeMed(m));return k});
 return s;
}
function normalizeMed(m){const out={...m};out.id=out.id||uid('med');out.schedule=out.schedule||{type:out.intervalHours?'intervalHours':'daily',intervalHours:Number(out.intervalHours)||12,times:['08:00']};out.doseCalc=out.doseCalc||{mode:'manual'};out.startDate=out.startDate||new Date().toISOString().slice(0,10);out.endDate=out.endDate||'';out.instructions=out.instructions||'';return out}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}
function kitten(id){return state.kittens.find(k=>k.id===id)}
function litter(id){return state.litters.find(l=>l.id===id)}
function events(id,type){return state.events.filter(e=>e.kittenId===id&&(!type||e.type===type)&&!e.deletedAt).sort((a,b)=>new Date(b.ts)-new Date(a.ts))}
function last(id,type){return events(id,type)[0]||null}
function sameDay(a,b){return new Date(a).toDateString()===new Date(b).toDateString()}
function fmtTime(x){return new Intl.DateTimeFormat(undefined,{hour:'numeric',minute:'2-digit'}).format(new Date(x))}
function fmtDate(x){return new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric'}).format(new Date(x))}
function todayISO(){return new Date().toISOString().slice(0,10)}
function ageText(dob){if(!dob)return'Age unknown';const d=Math.max(0,Math.floor((Date.now()-new Date(dob+'T12:00:00'))/86400000));if(d<14)return`${d} day${d===1?'':'s'} old`;if(d<365)return`${Math.floor(d/7)} wk ${d%7} d`;return`${Math.floor(d/365)} yr ${Math.floor((d%365)/30)} mo`}
function avatar(k,large=false){return `<div class="avatar${large?' large':''}">${k&&k.photo?`<img src="${k.photo}" alt="${esc(k.name)}">`:'🐱'}</div>`}
function latestWeight(k){const e=last(k.id,'weight');return e?Number(e.data.grams):null}
function previousWeight(k){const e=events(k.id,'weight')[1];return e?Number(e.data.grams):null}
function weightDue(k){if(!k.carePlan?.dailyWeight)return false;const e=last(k.id,'weight');return !e||!sameDay(e.ts,new Date())}
function nextFeeding(k){if(!k.carePlan?.feedingEnabled)return null;const e=last(k.id,'feeding');if(!e)return new Date().toISOString();return new Date(new Date(e.ts).getTime()+Number(k.feedingIntervalHours||4)*3600000).toISOString()}
function timeUntil(x){const d=new Date(x)-Date.now(),a=Math.abs(d),h=Math.floor(a/3600000),m=Math.floor((a%3600000)/60000),t=(h?h+'h ':'')+m+'m';return d<0?t+' overdue':'in '+t}
function activeDate(m,date=new Date()){const ymd=date.toISOString().slice(0,10);return (!m.startDate||ymd>=m.startDate)&&(!m.endDate||ymd<=m.endDate)}
function medLogs(k,m){return state.events.filter(e=>e.kittenId===k.id&&e.type==='medication'&&e.data.medId===m.id&&!e.deletedAt).sort((a,b)=>new Date(b.ts)-new Date(a.ts))}
function scheduleLabel(m){const s=m.schedule||{};if(s.type==='prn')return'As needed (PRN)';if(s.type==='oneTime')return`One time ${s.oneTimeAt?fmtDate(s.oneTimeAt)+' '+fmtTime(s.oneTimeAt):''}`;if(s.type==='intervalHours')return`Every ${s.intervalHours||12} hours`;if(s.type==='intervalDays')return`Every ${s.intervalDays||1} day${Number(s.intervalDays||1)===1?'':'s'}`;if(s.type==='specificDays')return`${(s.days||[]).join(', ')||'Selected days'} at ${(s.times||['08:00']).join(', ')}`;if(s.type==='twiceDaily')return`Twice daily · ${(s.times||['08:00','20:00']).join(', ')}`;if(s.type==='threeDaily')return`Three times daily · ${(s.times||['08:00','14:00','20:00']).join(', ')}`;return`Once daily · ${(s.times||['08:00']).join(', ')}`}
function nextMedDue(k,m){
 if(!activeDate(m)||m.schedule?.type==='prn')return null;
 const s=m.schedule||{},logs=medLogs(k,m).filter(e=>e.data.status==='given'),lastGiven=logs[0];
 if(s.type==='oneTime'){const at=s.oneTimeAt?new Date(s.oneTimeAt):null;if(!at||lastGiven)return null;return at.toISOString()}
 if(s.type==='intervalHours'){const base=lastGiven?new Date(lastGiven.ts).getTime():new Date((m.startDate||todayISO())+'T00:00:00').getTime();return new Date(base+Number(s.intervalHours||12)*3600000).toISOString()}
 if(s.type==='intervalDays'){const base=lastGiven?new Date(lastGiven.ts).getTime():new Date((m.startDate||todayISO())+'T08:00:00').getTime()-Number(s.intervalDays||1)*86400000;return new Date(base+Number(s.intervalDays||1)*86400000).toISOString()}
 const times=s.times?.length?s.times:(s.type==='twiceDaily'?['08:00','20:00']:s.type==='threeDaily'?['08:00','14:00','20:00']:['08:00']);
 for(let day=0;day<8;day++){const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()+day);if(s.type==='specificDays'){const key=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()];if(!(s.days||[]).includes(key))continue}for(const t of times){const [hh,mm]=t.split(':').map(Number),candidate=new Date(d);candidate.setHours(hh||0,mm||0,0,0);if(candidate>Date.now()||!lastGiven||candidate>new Date(lastGiven.ts))return candidate.toISOString()}}
 return null
}
function doseCalculation(k,m){
 const dc=m.doseCalc||{mode:'manual'},wg=latestWeight(k);if(dc.mode!=='weightBased'||!wg)return null;
 const kg=wg/1000,rate=Number(dc.rate)||0;if(!rate)return null;
 let mg=dc.rateUnit==='mcg/kg'?(rate*kg/1000):(rate*kg),ml=null;
 const conc=Number(dc.concentration)||0;if(conc>0)ml=mg/conc;
 return{kg,mg,ml,weightG:wg}
}
function medStatus(k,m){const due=nextMedDue(k,m);return{due,overdue:!!due&&new Date(due)<=new Date(),calc:doseCalculation(k,m)}}
function alertsFor(k){
 const out=[],nf=nextFeeding(k);if(nf&&new Date(nf)<=new Date())out.push({kind:'feeding',level:'warn',text:'Feeding '+timeUntil(nf)});
 if(weightDue(k))out.push({kind:'weight',level:'neutral',text:'Daily weight not logged'});
 const w=latestWeight(k),p=previousWeight(k);if(w!=null&&p!=null&&w<p)out.push({kind:'weight',level:'danger',text:`Weight down ${p-w}g from prior entry`});
 (k.medications||[]).forEach(m=>{const s=medStatus(k,m);if(s.overdue)out.push({kind:'medication',level:'danger',text:`${m.name} ${timeUntil(s.due)}`,med:m})});return out
}