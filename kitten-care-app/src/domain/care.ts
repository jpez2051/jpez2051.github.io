import type { CareEvent, CareState, Kitten } from './models';

export function activeKittens(state: CareState): Kitten[] {
  return state.kittens.filter((kitten) => kitten.inFosterCare !== false);
}

export function kittenEvents(state: CareState, kittenId: string, type?: CareEvent['type']): CareEvent[] {
  return state.events
    .filter((event) => event.kittenId === kittenId && !event.deletedAt && (!type || event.type === type))
    .sort((a, b) => Date.parse(b.ts) - Date.parse(a.ts));
}

export function latestWeight(state: CareState, kittenId: string): number | null {
  const event = kittenEvents(state, kittenId, 'weight')[0];
  const grams = Number(event?.data.grams);
  return Number.isFinite(grams) ? grams : null;
}

export function isSameLocalDay(value: string, now = new Date()): boolean {
  return new Date(value).toDateString() === now.toDateString();
}

export function todayCount(state: CareState, type: CareEvent['type']): number {
  const active = new Set(activeKittens(state).map((kitten) => kitten.id));
  return state.events.filter((event) => !event.deletedAt && event.type === type && active.has(event.kittenId) && isSameLocalDay(event.ts)).length;
}

export function nextFeedingAt(state: CareState, kitten: Kitten): Date | null {
  if (!kitten.carePlan.feedingEnabled) return null;
  const last = kittenEvents(state, kitten.id, 'feeding')[0];
  if (!last) return new Date(0);
  return new Date(Date.parse(last.ts) + (kitten.feedingIntervalHours || 4) * 3_600_000);
}
