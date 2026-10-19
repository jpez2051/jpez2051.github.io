import type { CareState, Kitten, Litter, Medication } from '../domain/models';

export const APP_SCHEMA_VERSION = 6;

export function emptyState(): CareState {
  return { version: APP_SCHEMA_VERSION, kittens: [], litters: [], events: [], settings: {} };
}

export function restoreBackup(value: unknown): CareState {
  if (!value || typeof value !== 'object') throw new Error('Invalid backup');
  const raw=value as Partial<CareState>;
  if(typeof raw.version==='number'&&raw.version>APP_SCHEMA_VERSION) throw new Error('This backup requires a newer application version');
  if (!Array.isArray(raw.kittens)||!Array.isArray(raw.events)||!Array.isArray(raw.litters)) throw new Error('Invalid backup');
  for (const list of [raw.kittens,raw.events,raw.litters]) {
    if(list.some((item)=>!item||typeof item!=='object'||typeof item.id!=='string'||!item.id)) throw new Error('Invalid record');
    if(new Set(list.map((item)=>item.id)).size!==list.length) throw new Error('Duplicate records');
  }
  if(raw.events.some((event)=>!event.data||typeof event.data!=='object'||Array.isArray(event.data)||!Number.isFinite(Date.parse(event.ts))||!raw.kittens!.some((kitten)=>kitten.id===event.kittenId))) throw new Error('Invalid care history');
  return migrateState(raw);
}

export function migrateState(value: unknown): CareState {
  if (!value || typeof value !== 'object') return emptyState();
  const raw = value as Partial<CareState>;
  if (!Array.isArray(raw.kittens) || !Array.isArray(raw.events)) return emptyState();

  const litters: Litter[] = Array.isArray(raw.litters) ? raw.litters.map((litter) => ({
    ...litter,
    id: String(litter.id),
    name: String(litter.name || 'Unnamed litter'),
    dob: String(litter.dob || ''),
    notes: String(litter.notes || ''),
  })) : [];

  const kittens: Kitten[] = raw.kittens.map((kitten) => ({
    ...kitten,
    id: String(kitten.id),
    name: String(kitten.name || 'Unnamed kitten'),
    litterId: kitten.litterId ? String(kitten.litterId) : null,
    inFosterCare: typeof kitten.inFosterCare==='boolean'?kitten.inFosterCare:!['Adopted','Transferred','Returned to A4A','Deceased'].includes(String((kitten as Kitten & {status?:string}).status)),
    dob: String(kitten.dob || ''),
    sex: String(kitten.sex || ''),
    markings: String(kitten.markings || ''),
    specialNeeds: String(kitten.specialNeeds || ''),
    feedingIntervalHours: Number(kitten.feedingIntervalHours) || 4,
    medications: Array.isArray(kitten.medications) ? kitten.medications.map((medication)=>({ ...medication, doseCalc:medication.doseCalc||{mode:'manual'}, schedule:medication.schedule||{type:'daily',times:['08:00']} } as Medication)) : [],
    photo: kitten.photo || null,
    carePlan: {
      feedingEnabled: kitten.carePlan?.feedingEnabled ?? true,
      dailyWeight: kitten.carePlan?.dailyWeight ?? true,
      bottleBaby: kitten.carePlan?.bottleBaby ?? false,
    },
  }));

  return {
    version: APP_SCHEMA_VERSION,
    kittens,
    litters,
    events: raw.events.map((event) => event.type === 'feeding' && !event.data?.outcome
      ? { ...event, data: { ...event.data, outcome: Number(event.data?.amount) > 0 ? 'fed' : 'unable' } }
      : event),
    settings: {
      textSize: raw.settings?.largeText ? 'large' : 'standard',
      onboardingComplete: Boolean(raw.settings?.dismissedFirstRun || raw.kittens.length),
      ...(raw.settings || {}),
    },
  };
}
