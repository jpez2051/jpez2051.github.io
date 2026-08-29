import { useMemo, useState } from 'react';
import { activeKittens, latestWeight, nextFeedingAt, todayCount } from '../domain/care';
import { createId } from '../domain/ids';
import type { CareEventType, CareState, Kitten, Litter } from '../domain/models';
import type { CareRepository } from '../data/CareRepository';
import { Dialog } from '../components/Dialog';
import { DateField } from '../components/DateField';
import { useCareState } from './useCareState';

type View = 'today' | 'kittens' | 'alerts' | 'handoff';
type Modal = null | { kind: 'litter' } | { kind: 'kitten'; litter?: Litter } | { kind: 'log'; eventType: CareEventType } | { kind: 'help' };

export function App({ repository }: { repository: CareRepository }) {
  const { state, update, ready } = useCareState(repository);
  const [view, setView] = useState<View>('today');
  const [modal, setModal] = useState<Modal>(null);
  const active = useMemo(() => activeKittens(state), [state]);
  if (!ready) return <main className="loading">Loading foster care…</main>;

  return <div className={state.settings.largeText ? 'app large-text' : 'app'}>
    <header className="topbar"><div><small>Action 4 Animals Hawaii</small><strong>Foster Kitten <em>Care</em></strong></div><button className="header-button" onClick={() => setModal({ kind: 'help' })}>? Help</button></header>
    <main className="container">
      {view === 'today' && <Today state={state} onLog={(eventType) => setModal({ kind: 'log', eventType })} onAdd={() => setModal({ kind: 'litter' })} />}
      {view === 'kittens' && <Kittens state={state} onAddLitter={() => setModal({ kind: 'litter' })} onAddKitten={(litter) => setModal({ kind: 'kitten', litter })} />}
      {view === 'alerts' && <Alerts state={state} />}
      {view === 'handoff' && <Handoff state={state} />}
    </main>
    <nav className="bottom-nav">
      <Nav active={view === 'today'} icon="🏠" label="Today" onClick={() => setView('today')} />
      <Nav active={view === 'kittens'} icon="🐱" label="Kittens" onClick={() => setView('kittens')} />
      <button className="feed-fab" aria-label="Log a feeding" title="Log a feeding" onClick={() => setModal({ kind: 'log', eventType: 'feeding' })}>🍼</button>
      <Nav active={view === 'alerts'} icon="🔔" label="Alerts" onClick={() => setView('alerts')} />
      <Nav active={view === 'handoff'} icon="📋" label="Handoff" onClick={() => setView('handoff')} />
    </nav>
    {modal?.kind === 'litter' && <LitterForm onClose={() => setModal(null)} onSave={(litter) => { update((s) => ({ ...s, litters: [...s.litters, litter] })); setModal({ kind: 'kitten', litter }); setView('kittens'); }} />}
    {modal?.kind === 'kitten' && <KittenForm litter={modal.litter} onClose={() => setModal(null)} onSave={(kitten, another) => { update((s) => ({ ...s, kittens: [...s.kittens, kitten] })); setModal(another && modal.litter ? { kind: 'kitten', litter: modal.litter } : null); setView('kittens'); }} />}
    {modal?.kind === 'log' && <LogForm state={state} type={modal.eventType} onClose={() => setModal(null)} onSave={(event) => update((s) => ({ ...s, events: [...s.events, event] }))} />}
    {modal?.kind === 'help' && <Dialog title="Help & support" onClose={() => setModal(null)}><div className="prose"><p>This application tracks daily foster care. Shelterluv remains the official rescue record.</p><p>Care Queue information updates while the app is open and does not replace alarms, rescue instructions, or veterinary guidance.</p><h3>Migration build</h3><p>This parallel application automatically imports existing V3 browser data. The current V3 page remains available while feature parity is tested.</p></div></Dialog>}
  </div>;
}

function Nav({ active, icon, label, onClick }: { active: boolean; icon: string; label: string; onClick: () => void }) {
  return <button className={active ? 'nav-button active' : 'nav-button'} onClick={onClick}><span>{icon}</span>{label}</button>;
}

function Today({ state, onLog, onAdd }: { state: CareState; onLog: (type: CareEventType) => void; onAdd: () => void }) {
  const active = activeKittens(state);
  const overdue = active.filter((kitten) => (nextFeedingAt(state, kitten)?.getTime() || Infinity) <= Date.now());
  return <><section className="hero"><div><h1>Care Now</h1><p>{active.length ? `What needs attention for ${active.length} kitten${active.length === 1 ? '' : 's'}` : 'Set up your first foster litter'}</p></div><time>{new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date())}</time></section>
    <section className="metrics"><Metric value={active.length} label="In your care" /><Metric value={todayCount(state, 'feeding')} label="Feeds today" /><Metric value={todayCount(state, 'medication')} label="Meds logged" /><Metric value={todayCount(state, 'weight')} label="Weights today" /></section>
    <section className="card"><header><h2>Care queue</h2><small>Updates while app is open</small></header>{active.length === 0 ? <Empty text="No kittens currently in your care" action="Add first litter" onClick={onAdd} /> : overdue.length ? overdue.map((kitten) => <div className="queue-row" key={kitten.id}><span>🍼</span><div><b>{kitten.name}</b><small>Feeding overdue</small></div><button onClick={() => onLog('feeding')}>Log</button></div>) : <Empty text="Everyone is current" />}</section>
    <section className="card"><header><h2>Quick log</h2><small>Choose what happened</small></header><div className="quick-grid">{([['feeding','🍼','Feeding'],['weight','⚖️','Weight'],['medication','💊','Medication'],['potty','🚽','Potty'],['note','📝','Note'],['health','🩺','Health']] as const).map(([type, icon, label]) => <button key={type} onClick={() => onLog(type)}><span>{icon}</span><b>{label}</b></button>)}</div></section></>;
}

function Metric({ value, label }: { value: number; label: string }) { return <div className="metric"><b>{value}</b><span>{label}</span></div>; }
function Empty({ text, action, onClick }: { text: string; action?: string; onClick?: () => void }) { return <div className="empty"><span>🐱</span><b>{text}</b>{action && <button onClick={onClick}>{action}</button>}</div>; }

function Kittens({ state, onAddLitter, onAddKitten }: { state: CareState; onAddLitter: () => void; onAddKitten: (litter?: Litter) => void }) {
  return <><section className="hero"><div><h1>Kittens & litters</h1><p>Profiles, care plans, and litter care</p></div><div className="hero-actions"><button onClick={onAddLitter}>+ Litter</button><button onClick={() => onAddKitten()}>+ Kitten</button></div></section>{state.litters.map((litter) => { const kittens = state.kittens.filter((kitten) => kitten.litterId === litter.id && kitten.inFosterCare); return <section className="card litter" key={litter.id}><header><div><h2>🐾 {litter.name}</h2><small>{kittens.length} kitten{kittens.length === 1 ? '' : 's'}{litter.dob ? ` · DOB ${litter.dob}` : ''}</small></div><button onClick={() => onAddKitten(litter)}>+ Kitten</button></header><div className="kitten-grid">{kittens.map((kitten) => <article className="kitten-card" key={kitten.id}><span className="avatar">{kitten.photo ? <img src={kitten.photo} alt="" /> : '🐱'}</span><div><h3>{kitten.name}</h3><p>{latestWeight(state, kitten.id) ?? '—'} g · {kitten.medications.length} meds</p></div></article>)}</div></section>; })}{!state.litters.length && <section className="card"><Empty text="No litters yet" action="Add first litter" onClick={onAddLitter} /></section>}</>;
}

function Alerts({ state }: { state: CareState }) { const due = activeKittens(state).filter((kitten) => (nextFeedingAt(state, kitten)?.getTime() || Infinity) <= Date.now()); return <><section className="hero"><div><h1>Alerts</h1><p>Care needing attention</p></div></section><section className="card">{due.length ? due.map((kitten) => <div className="queue-row" key={kitten.id}><span>🍼</span><b>{kitten.name} · feeding overdue</b></div>) : <Empty text="No active alerts" />}</section></>; }
function Handoff({ state }: { state: CareState }) { return <><section className="hero"><div><h1>Handoff</h1><p>Foster-to-foster summary</p></div></section><section className="card"><div className="prose">{activeKittens(state).map((kitten) => <p key={kitten.id}><b>{kitten.name}</b>: {latestWeight(state, kitten.id) ?? 'no weight'} g</p>)}</div></section></>; }

function LitterForm({ onClose, onSave }: { onClose: () => void; onSave: (litter: Litter) => void }) {
  return <Dialog title="Add litter" onClose={onClose}><form onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); onSave({ id: createId('litter'), name: String(data.get('name')).trim(), dob: String(data.get('dob')), notes: String(data.get('notes')) }); }}><label>Litter name *<input name="name" required autoFocus /></label><label>Shared / estimated DOB<DateField name="dob" /></label><div className="info">Shelterluv remains the source of truth for the official intake date.</div><label>Litter notes<textarea name="notes" /></label><div className="actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button>Save & add kittens</button></div></form></Dialog>;
}

function KittenForm({ litter, onClose, onSave }: { litter?: Litter; onClose: () => void; onSave: (kitten: Kitten, another: boolean) => void }) {
  return <Dialog title={litter ? `Add kittens · ${litter.name}` : 'Add kitten'} onClose={onClose}><form onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); onSave({ id: createId('kitten'), name: String(data.get('name')).trim(), litterId: litter?.id || null, inFosterCare: true, dob: String(data.get('dob')), sex: String(data.get('sex')), markings: String(data.get('markings')), specialNeeds: String(data.get('specialNeeds')), feedingIntervalHours: Number(data.get('interval')) || 4, medications: [], photo: null, carePlan: { feedingEnabled: true, dailyWeight: true, bottleBaby: data.get('bottleBaby') === 'on' } }, String(data.get('action')) === 'another'); }}><label>Name *<input name="name" required autoFocus /></label><label>Date of birth<DateField name="dob" defaultValue={litter?.dob} /></label>{litter?.dob && <small>Using the litter DOB. Tap the date to change it only if this kitten has a different DOB.</small>}<label>Sex<select name="sex"><option value="">Unknown</option><option>Female</option><option>Male</option></select></label><label>Color / markings<input name="markings" /></label><label>Special needs / medical notes<textarea name="specialNeeds" /></label><label>Feed every (hours)<input name="interval" type="number" min="1" max="24" step="0.5" defaultValue="4" /></label><label className="check"><input name="bottleBaby" type="checkbox" /> Bottle Baby Mode</label><div className="actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button>{litter ? <><button name="action" value="finish">Save & finish litter</button><button name="action" value="another">Save & add another</button></> : <button>Save kitten</button>}</div></form></Dialog>;
}

function LogForm({ state, type, onClose, onSave }: { state: CareState; type: CareEventType; onClose: () => void; onSave: (event: CareState['events'][number]) => void }) {
  const kittens = activeKittens(state); return <Dialog title={`Log ${type}`} onClose={onClose}>{kittens.length ? <form onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget), now = new Date().toISOString(); const payload: Record<string, string | number> = { note: String(data.get('note') || '') }; if (type === 'feeding') { payload.amount = String(data.get('amount') || ''); payload.unit = String(data.get('unit') || 'mL'); } if (type === 'weight') payload.grams = Number(data.get('grams')); onSave({ id: createId('evt'), kittenId: String(data.get('kittenId')), type, ts: new Date(String(data.get('when'))).toISOString(), createdAt: now, data: payload }); onClose(); }}><label>Kitten<select name="kittenId">{kittens.map((kitten) => <option key={kitten.id} value={kitten.id}>{kitten.name}</option>)}</select></label>{type === 'feeding' && <div className="two"><label>Amount<input name="amount" inputMode="decimal" /></label><label>Unit<select name="unit"><option>mL</option><option>g</option><option>oz</option></select></label></div>}{type === 'weight' && <label>Weight (grams) *<input name="grams" type="number" min="1" required /></label>}<label>Notes<textarea name="note" /></label><label>Date & time<DateField name="when" type="datetime-local" defaultValue={new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 16)} /></label><div className="actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button>Save log</button></div></form> : <Empty text="Add a kitten before logging care" />}</Dialog>;
}
