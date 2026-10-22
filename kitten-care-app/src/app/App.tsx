import { replaceMedicationPlan } from '../domain/medicationSafety';
import { Settings,settingsEditToken } from '../components/Settings';
import { LogForm } from '../components/LogForm';
import { KittenProfile } from '../components/KittenProfile';
import { MedicationSafetyForm } from '../components/MedicationSafetyForm';
import { useEffect, useMemo, useState } from 'react';
import { activeKittens, latestWeight, nextFeedingAt, todayCount } from '../domain/care';
import { createId } from '../domain/ids';
import { validateCareDraft } from '../domain/validation';
import type { CareEvent, CareEventType, CareState, Kitten, Litter, Medication } from '../domain/models';
import type { CareRepository } from '../data/CareRepository';
import { Dialog } from '../components/Dialog';
import { DateField } from '../components/DateField';
import { useCareState } from './useCareState';
import { APP_VERSION, APP_BUILD } from '../version';
import { MedicationForm } from '../components/MedicationForm';
import { careQueue } from '../domain/queue';
import { rescueTemplate } from '../domain/rescueMedications';
import { RescueMedicationForm } from '../components/RescueMedicationForm';

type View = 'today' | 'kittens' | 'attention' | 'handoff';
type Modal = null | { kind: 'litter' } | { kind: 'kitten'; litter?: Litter } | { kind: 'log'; eventType: CareEventType; kittenId?: string; medId?: string } | { kind: 'help' } | { kind: 'emergency' } | { kind: 'settings' } | { kind:'profile'; kittenId:string } | {kind:'medication';kittenId:string} | {kind:'reviewChart';kittenId:string;medId:string};

export function App({ repository }: { repository: CareRepository }) {
  const { state, update, recover, ready, saveError, clearSaveError } = useCareState(repository);
  const [view, setView] = useState<View>('today');
  const [,refreshClock]=useState(0);
  useEffect(()=>{const refresh=()=>refreshClock((tick)=>tick+1);const timer=window.setInterval(refresh,30000);document.addEventListener('visibilitychange',refresh);return()=>{window.clearInterval(timer);document.removeEventListener('visibilitychange',refresh)}},[]);
  const [modal, setModal] = useState<Modal>(null);
  const [undoEvent,setUndoEvent]=useState<CareEvent|null>(null);
  useEffect(()=>{if(!undoEvent)return;const timer=window.setTimeout(()=>setUndoEvent(null),8000);return()=>window.clearTimeout(timer)},[undoEvent]);
  const active = useMemo(() => activeKittens(state), [state]);
  if (!ready) return <main className="loading">Loading foster care…</main>;

  return <div className={state.settings.textSize === 'large' || (!state.settings.textSize && state.settings.largeText) ? 'app large-text' : 'app'}>
    <a className="skip-link" href="#main-content">Skip to care information</a>
    <header className="topbar"><div><small>Action 4 Animals Hawaii</small><strong>Foster Kitten <em>Care</em></strong></div><div className="header-actions"><button className="urgent-button" onClick={() => setModal({ kind: 'emergency' })}>Need help now?</button><button className="header-button" onClick={() => setModal({ kind: 'settings' })}>Settings & help</button></div></header>
    {saveError && <div className="save-error" role="alert"><b>Not saved.</b> {saveError}<button onClick={clearSaveError}>Dismiss</button></div>}
    <main className="container" id="main-content">
      {view === 'today' && <Today onBackup={()=>setModal({kind:'settings'})} onReview={(kittenId,medId)=>setModal({kind:'reviewChart',kittenId,medId})} state={state} onLog={(eventType,kittenId,medId) => setModal({ kind: 'log', eventType,kittenId,medId })} onAdd={() => setModal({ kind: 'litter' })} />}
      {view === 'kittens' && <Kittens state={state} onAddLitter={() => setModal({ kind: 'litter' })} onAddKitten={(litter) => setModal({ kind: 'kitten', litter })} onOpen={(kittenId)=>setModal({kind:'profile',kittenId})} />}
      {view === 'attention' && <Alerts onReview={(kittenId,medId)=>setModal({kind:'reviewChart',kittenId,medId})} state={state} onLog={(eventType,kittenId,medId)=>setModal({kind:'log',eventType,kittenId,medId})} />}
      {view === 'handoff' && <Handoff state={state} />}
      <footer className="release-info"><p>Testing build · Medication automation is enabled. Close older app tabs before testing this update.</p>Version {APP_VERSION} · Build {APP_BUILD}</footer>
    </main>
    <nav className="bottom-nav" aria-label="Primary navigation">
      <Nav active={view === 'today'} icon="🏠" label="Care Now" onClick={() => setView('today')} />
      <Nav active={view === 'kittens'} icon="🐱" label="Kittens" onClick={() => setView('kittens')} />
      <button className="feed-fab" aria-label="Log a feeding" onClick={() => setModal({ kind: 'log', eventType: 'feeding' })}><span>🍼</span><b>Log feeding</b></button>
      <Nav active={view === 'attention'} icon="⚠️" label="Needs attention" onClick={() => setView('attention')} />
      <Nav active={view === 'handoff'} icon="📋" label="Handoff" onClick={() => setView('handoff')} />
    </nav>
    {undoEvent&&<div className="undo-toast" role="status">Care entry saved.<button onClick={()=>{void update((s)=>({...s,events:s.events.filter((e)=>e.id!==undoEvent.id)}));setUndoEvent(null)}}>Undo</button></div>}
    {modal?.kind === 'litter' && <LitterForm onClose={() => setModal(null)} onSave={async(litter) => { if(!await update((s) => ({ ...s, litters: [...s.litters, litter] })))return; setModal({ kind: 'kitten', litter }); setView('kittens'); }} />}
    {modal?.kind === 'kitten' && <KittenForm litter={modal.litter} onClose={() => setModal(null)} onSave={async(kitten, another) => { if(!await update((s) => ({ ...s, kittens: [...s.kittens, kitten] })))return; setModal(another && modal.litter ? { kind: 'kitten', litter: modal.litter } : null); setView('kittens'); }} />}
    {modal?.kind === 'log' && <LogForm state={state} type={modal.eventType} initialKittenId={modal.kittenId} initialMedId={modal.medId} onClose={() => setModal(null)} onSave={async(event) => {const saved=await update((s) => {const checked=validateCareDraft(s,{type:event.type,kittenId:event.kittenId,when:event.ts,data:event.data});if(!checked.valid)throw new Error('Care changed before saving: '+checked.errors.join(' '));return { ...s, events: [...s.events, event] }});if(saved)setUndoEvent(event);return saved}} />}
    {modal?.kind==='profile'&&<KittenProfile state={state} kittenId={modal.kittenId} onClose={()=>setModal(null)} onLog={(eventType,medId)=>setModal({kind:'log',eventType,kittenId:modal.kittenId,medId})} onAddMedication={()=>setModal({kind:'medication',kittenId:modal.kittenId})} onReviewChart={(medId)=>setModal({kind:'reviewChart',kittenId:modal.kittenId,medId})}/>}
    {modal?.kind==='medication'&&<MedicationForm state={state} kitten={state.kittens.find((k)=>k.id===modal.kittenId)!} onClose={()=>setModal({kind:'profile',kittenId:modal.kittenId})} onSave={async(medication)=>{const saved=await update((s)=>({...s,kittens:s.kittens.map((k)=>k.id===modal.kittenId?{...k,medications:[...k.medications,medication]}:k)}));if(saved)setModal({kind:'profile',kittenId:modal.kittenId});return saved}}/>}
    {modal?.kind==='reviewChart'&&(()=>{
      const kitten=state.kittens.find(k=>k.id===modal.kittenId),medication=kitten?.medications.find(m=>m.id===modal.medId),template=medication?.rescueChart&&rescueTemplate(medication.rescueChart.templateId);
      if(!kitten||!medication)return null;
      const close=()=>setModal({kind:'profile',kittenId:kitten.id});
      const save=async(updated:Medication,expectedPlan?:string)=>{const saved=await update(current=>replaceMedicationPlan(current,kitten.id,updated,expectedPlan));if(saved)close();return saved};
      return template?<RescueMedicationForm state={state} kitten={kitten} template={template} existing={medication} selector={<p>Reviewing the existing medication plan. Saving keeps its care history.</p>} onClose={close} onSave={save}/>:<MedicationSafetyForm medication={medication} onClose={close} onSave={save}/>;
    })()}    {modal?.kind === 'help' && <Dialog title="Help and how-to guides" onClose={() => setModal(null)}><div className="prose help-sections"><p>This app tracks daily foster care. Shelterluv remains the official rescue record.</p><h3>Set up a litter</h3><p>Add the litter first, then choose “Save and add another” until every kitten is entered. The litter date of birth carries to each kitten and can be changed individually.</p><h3>Log a feeding</h3><p>Choose “Fed successfully” only when the kitten ate a measured amount. Refused and unable feedings require a note and do not reset the next-feeding schedule.</p><h3>Record weights</h3><p>Weigh in grams using the same scale and similar conditions. Recheck an unexpected result before acting on it.</p><h3>Medication safety</h3><p>Automation remains enabled for this private testing build. The amount and route appear first; expand Full instructions and calculation for the full plan. Record a corrected weight before dosing if a reweigh differs. Enter the bottle, measuring device and rescue-defined limits under Review medication plan (or Safety settings for a custom prescription). Warnings require an explicit reason and approving contact or “testing only”; this is not clinical approval.</p><p>Add only current rescue or veterinary instructions. Confirm the kitten, medication, route, amount, concentration, and weight before recording a dose as given.</p><h3>Needs attention</h3><p>This screen updates only while the app is open. It does not replace phone alarms, rescue instructions, or veterinary guidance.</p><h3>Testing and accessibility</h3><p>Use Larger text in Settings, keyboard Tab and Shift+Tab, and device text sizing. Test with made-up records. The caregiver testing checklist is linked in Settings; real caregiver and screen-reader sessions must still be performed.</p><h3>Backup and privacy</h3><p>Until cloud accounts are enabled, records stay in this browser. Download regular backups and store them privately because they may contain photos, medical notes, and contact details.</p></div></Dialog>}
    {modal?.kind === 'emergency' && <Emergency state={state} onClose={() => setModal(null)} />}
    {modal?.kind === 'settings' && <Settings onBackup={()=>update(s=>({...s,settings:{...s.settings,lastBackupAt:new Date().toISOString()}}))} onRecovery={()=>repository.recoveryBackup?repository.recoveryBackup():Promise.resolve(null)} state={state} onClose={() => setModal(null)} onHelp={() => setModal({kind:'help'})} onRestore={async(restored)=>{const saved=await recover(restored);if(saved)setModal(null);return saved}} onSave={async(settings,expectedToken) => {const saved=await update((s) => {if(settingsEditToken(s.settings)!==expectedToken)throw new Error('Settings changed in another tab. Reopen Settings before saving.');return {...s,settings:{...s.settings,...settings}}});if(saved)setModal(null);return saved}} />}
  </div>;
}

function Nav({ active, icon, label, onClick }: { active: boolean; icon: string; label: string; onClick: () => void }) {
  return <button aria-current={active?'page':undefined} className={active ? 'nav-button active' : 'nav-button'} onClick={onClick}><span aria-hidden="true">{icon}</span>{label}</button>;
}

function Today({ state, onLog, onAdd,onReview,onBackup }: {onBackup:()=>void;onReview:(kittenId:string,medId:string)=>void; state: CareState; onLog: (type: CareEventType, kittenId?: string, medId?: string) => void; onAdd: () => void }) {
  const active = activeKittens(state);

  return <><section className="hero"><div><h1>Care Now</h1><p>{active.length ? `What needs attention for ${active.length} kitten${active.length === 1 ? '' : 's'}` : 'Set up your first foster litter'}</p></div><time>{new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date())}</time></section>
    <section className="metrics"><Metric value={active.length} label="In your care" /><Metric value={todayCount(state, 'feeding')} label="Feeds today" /><Metric value={todayCount(state, 'medication')} label="Meds logged" /><Metric value={todayCount(state, 'weight')} label="Weights today" /></section>
    {!active.length && <section className="card setup-card"><b>Get started</b><h2>Add the litter currently with you</h2><p>We’ll add every kitten, confirm feeding schedules, record starting weights, and review medications.</p><button onClick={onAdd}>Start guided setup</button></section>}
    <section className="open-app-warning"><b>No background alarms:</b> Needs Attention updates only while this app is open. Use a phone alarm for overnight care.</section>
    {(!state.settings.lastBackupAt||!Number.isFinite(Date.parse(state.settings.lastBackupAt))||Date.now()-Date.parse(state.settings.lastBackupAt)>86400000)&&<section className="info backup-reminder"><b>Keep a backup outside this browser.</b><p>No backup has been requested in the last 24 hours. A local recovery copy can also be lost if browser data is cleared.</p><button className="primary-wide" onClick={onBackup}>Open backup settings</button></section>}<section className="card"><header><h2>Care queue</h2><small>Due care and items to review</small></header><QueuePanel state={state} onLog={onLog} onReview={onReview}/></section>
    <section className="card"><header><h2>Quick log</h2><small>Choose what happened</small></header><div className="quick-grid">{([['feeding','🍼','Feeding'],['weight','⚖️','Weight'],['medication','💊','Medication'],['potty','🚽','Potty'],['note','📝','Note'],['health','🩺','Health']] as const).map(([type, icon, label]) => <button key={type} onClick={() => onLog(type)}><span>{icon}</span><b>{label}</b></button>)}</div></section></>;
}

function Metric({ value, label }: { value: number; label: string }) { return <div className="metric"><b>{value}</b><span>{label}</span></div>; }
function Empty({ text, action, onClick }: { text: string; action?: string; onClick?: () => void }) { return <div className="empty"><span>🐱</span><b>{text}</b>{action && <button onClick={onClick}>{action}</button>}</div>; }

function Kittens({ state, onAddLitter, onAddKitten,onOpen }: { state: CareState; onAddLitter: () => void; onAddKitten: (litter?: Litter) => void;onOpen:(id:string)=>void }) {
  return <><section className="hero"><div><h1>Kittens & litters</h1><p>Profiles, schedules, weights, and medications</p></div><div className="hero-actions"><button onClick={onAddLitter}>Add litter</button><button onClick={() => onAddKitten()}>Add one kitten</button></div></section>{[...state.litters,...(state.kittens.some((k)=>k.inFosterCare&&!state.litters.some((l)=>l.id===k.litterId))?[{id:'unassigned',name:'Individual kittens',dob:'',notes:''}]:[])].map((litter) => { const kittens = state.kittens.filter((kitten) => (litter.id==='unassigned'?!state.litters.some((l)=>l.id===kitten.litterId):kitten.litterId===litter.id) && kitten.inFosterCare);if(!kittens.length)return null; return <section className="card litter" key={litter.id}><header><div><h2>🐾 {litter.name}</h2><small>{kittens.length} kitten{kittens.length === 1 ? '' : 's'}{litter.dob ? ` · DOB ${litter.dob}` : ''}</small></div><button onClick={() => onAddKitten(litter)}>Add kitten</button></header><div className="kitten-grid">{kittens.map((kitten) => <button className="kitten-card" key={kitten.id} onClick={()=>onOpen(kitten.id)}><span className="avatar">{kitten.photo ? <img src={kitten.photo} alt="" /> : '🐱'}</span><span><b>{kitten.name}</b><small>{latestWeight(state, kitten.id) ?? 'No weight'}{latestWeight(state,kitten.id)?' g':''} · {kitten.medications.length} medication{kitten.medications.length===1?'':'s'}</small></span><span aria-hidden="true">›</span></button>)}</div></section>; })}{!state.litters.length && <section className="card"><Empty text="No kittens are set up" action="Add a litter and all its kittens" onClick={onAddLitter} /><p className="centered-help">Use “Add one kitten” only when the kitten is not part of a litter.</p></section>}</>;
}

type QueueAction=(type:CareEventType,kittenId?:string,medId?:string)=>void;
function QueuePanel({state,onLog,onReview}:{state:CareState;onLog:QueueAction;onReview:(kittenId:string,medId:string)=>void}) {
  const items=careQueue(state);
  if(!activeKittens(state).length)return <Empty text="No kittens currently in your care"/>;
  if(!items.length)return <Empty text="No scheduled care due within one hour"/>;
  return <>{items.map((item)=><div className={`queue-row ${item.review?'review-item':''}`} key={item.id}><span aria-hidden="true">{item.type==='feeding'?'🍼':item.type==='weight'?'⚖️':item.type==='health'?'🩺':'💊'}</span><div><b>{item.kitten.name}</b><small>{item.text}</small>{item.due&&item.due.getTime()>0&&<time>{item.due.toLocaleString()}</time>}</div>{item.review&&item.type==='medication'&&item.medId?<button onClick={()=>onReview(item.kitten.id,item.medId!)}>Review plan</button>:<button onClick={()=>onLog(item.type,item.kitten.id,item.medId)}>{item.type==='feeding'?'Log feeding':item.type==='weight'?'Log weight':item.type==='health'?'Log health':'Log dose'}</button>}</div>)}</>;
}
function Alerts({state,onLog,onReview}:{state:CareState;onLog:QueueAction;onReview:(kittenId:string,medId:string)=>void}) {
  return <><section className="hero"><div><h1>Needs attention</h1><p>Scheduled care and items to review</p></div></section><section className="open-app-warning"><b>This is not a phone alarm.</b> The list updates while the app is open. Use your phone alarms for overnight care.</section><section className="card"><QueuePanel state={state} onLog={onLog} onReview={onReview}/></section></>;
}
function Handoff({ state }: { state: CareState }) {
  const [selected,setSelected]=useState<string[]>([]),[copied,setCopied]=useState('');
  const kittens=activeKittens(state),chosen=kittens.filter((k)=>selected.includes(k.id));
  const text=chosen.map((k)=>{const feeding=state.events.filter((e)=>e.kittenId===k.id&&e.type==='feeding'&&!e.deletedAt).sort((a,b)=>Date.parse(b.ts)-Date.parse(a.ts))[0];return `${k.name}\nWeight: ${latestWeight(state,k.id)??'not recorded'} g\nLast feeding: ${feeding?`${new Date(feeding.ts).toLocaleString()} — ${feeding.data.amount||'attempt'} ${feeding.data.unit||''}`:'not recorded'}\nMedications: ${k.medications.map((m)=>`${m.name} (${m.route}) — verify bottle and prescription`).join('; ')||'none assigned'}\nCare notes: ${k.specialNeeds||'none recorded'}`}).join('\n\n');
  return <><section className="hero"><div><h1>Handoff</h1><p>Select only the kittens transferring now</p></div></section><section className="card prose"><p>Review medication bottles, next feeding, supplies, and concerns together with the receiving caregiver.</p>{kittens.length?kittens.map((k)=><label className="handoff-choice" key={k.id}><input type="checkbox" checked={selected.includes(k.id)} onChange={(e)=>{setSelected(e.target.checked?[...selected,k.id]:selected.filter((id)=>id!==k.id));setCopied('')}}/>{k.name}</label>):<Empty text="No kittens currently in your care"/>}{chosen.length>0&&<><label>Review summary<textarea aria-label="Review summary" className="handoff-text" value={text} readOnly/></label><button onClick={async()=>{try{await navigator.clipboard.writeText(text);setCopied('Summary copied')}catch{setCopied('Select and copy the summary manually')}}}>Copy selected kittens’ summary</button><p role="status">{copied}</p></>}</section></>;
}

function LitterForm({ onClose, onSave }: { onClose: () => void; onSave: (litter: Litter) => void }) {
  return <Dialog title="Add litter" onClose={onClose}><form onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); onSave({ id: createId('litter'), name: String(data.get('name')).trim(), dob: String(data.get('dob')), notes: String(data.get('notes')) }); }}><label>Litter name *<input name="name" required autoFocus /></label><label>Shared / estimated DOB<DateField name="dob" /></label><div className="info">Shelterluv remains the source of truth for the official intake date.</div><label>Litter notes<textarea name="notes" /></label><div className="actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button>Save & add kittens</button></div></form></Dialog>;
}

function KittenForm({ litter, onClose, onSave }: { litter?: Litter; onClose: () => void; onSave: (kitten: Kitten, another: boolean) => void }) {
  return <Dialog title={litter ? `Add kittens · ${litter.name}` : 'Add kitten'} onClose={onClose}><form onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); onSave({ id: createId('kitten'), name: String(data.get('name')).trim(), litterId: litter?.id || null, inFosterCare: true, dob: String(data.get('dob')), sex: String(data.get('sex')), markings: String(data.get('markings')), specialNeeds: String(data.get('specialNeeds')), feedingIntervalHours: Number(data.get('interval')) || 4, medications: [], photo: null, carePlan: { feedingEnabled: true, dailyWeight: true, bottleBaby: data.get('bottleBaby') === 'on' } }, String(data.get('action')) === 'another'); }}><label>Name *<input name="name" required autoFocus /></label><label>Date of birth<DateField name="dob" defaultValue={litter?.dob} /></label>{litter?.dob && <small>Using the litter DOB. Tap the date to change it only if this kitten has a different DOB.</small>}<label>Sex<select name="sex"><option value="">Unknown</option><option>Female</option><option>Male</option></select></label><label>Color / markings<input name="markings" /></label><label>Special needs / medical notes<textarea name="specialNeeds" /></label><label>Feed every (hours)<input name="interval" type="number" min="1" max="24" step="0.5" defaultValue="4" /></label><label className="check"><input name="bottleBaby" type="checkbox" /> Bottle Baby Mode</label><div className="actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button>{litter ? <><button name="action" value="finish">Save & finish litter</button><button name="action" value="another">Save & add another</button></> : <button>Save kitten</button>}</div></form></Dialog>;
}

function Emergency({state,onClose}:{state:CareState;onClose:()=>void}) { const contacts=[state.settings.mentorName&&state.settings.mentorPhone?[state.settings.mentorName,state.settings.mentorPhone]:null,state.settings.rescueName&&state.settings.rescuePhone?[state.settings.rescueName,state.settings.rescuePhone]:null].filter(Boolean) as string[][];return <Dialog title="Urgent help" onClose={onClose}><div className="prose"><div className="emergency-warning"><b>Do not wait for an app alert or response when rescue instructions call for urgent veterinary attention.</b></div><p>This app does not diagnose illness. Follow current rescue and veterinary instructions.</p>{state.settings.emergencyInstructions&&<div className="info"><b>Rescue-approved instructions</b><p>{state.settings.emergencyInstructions}</p></div>}{contacts.length?contacts.map(([name,phone])=><a className="contact-button" key={phone} href={`tel:${phone}`}>Call {name}<span>{phone}</span></a>):<p><b>No urgent contacts are saved.</b> Add approved contacts in Settings before fostering.</p>}</div></Dialog>}
