import type { CareState, Kitten, Litter } from '../domain/models';

export const APP_SCHEMA_VERSION = 5;

export function emptyState(): CareState {
  return { version: APP_SCHEMA_VERSION, kittens: [], litters: [], events: [], settings: {} };
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
    inFosterCare: kitten.inFosterCare !== false,
    dob: String(kitten.dob || ''),
    sex: String(kitten.sex || ''),
    markings: String(kitten.markings || ''),
    specialNeeds: String(kitten.specialNeeds || ''),
    feedingIntervalHours: Number(kitten.feedingIntervalHours) || 4,
    medications: Array.isArray(kitten.medications) ? kitten.medications : [],
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
    events: raw.events,
    settings: raw.settings || {},
  };
}
