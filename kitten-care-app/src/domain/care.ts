import type { CareEvent, CareState, Kitten } from './models';

export function activeKittens(state: CareState): Kitten[] {
  return state.kittens.filter((kitten) => kitten.inFosterCare !== false);
}

export function kittenEvents(state: CareState, kittenId: string, type?: CareEvent['type']): CareEvent[] {
  return state.events.slice().reverse()
    .filter((event) => event.kittenId === kittenId && !event.deletedAt && (!type || event.type === type))
    .sort((a, b) => Date.parse(b.ts) - Date.parse(a.ts) || Date.parse(b.createdAt)-Date.parse(a.createdAt) || 0);
}

export function latestWeight(state: CareState, kittenId: string): number | null {
  const event = kittenEvents(state, kittenId, 'weight')[0];
  const grams = Number(event?.data.grams);
  return Number.isFinite(grams) && grams > 0 ? grams : null;
}

export function isSameLocalDay(value: string, now = new Date()): boolean {
  return new Date(value).toDateString() === now.toDateString();
}

export function todayCount(state: CareState, type: CareEvent['type'], now=new Date()): number {
  const active = new Set(activeKittens(state).map((kitten) => kitten.id));
  return state.events.filter((event) => !event.deletedAt && event.type === type && active.has(event.kittenId) && isSameLocalDay(event.ts,now) && (type !== 'medication' || event.data.status === 'given') && (type !== 'feeding' || (event.data.outcome === 'fed' && Number(event.data.amount)>0))).length;
}

export function nextFeedingAt(state: CareState, kitten: Kitten): Date | null {
  if (!kitten.carePlan.feedingEnabled) return null;
  const last = kittenEvents(state, kitten.id, 'feeding').find((event) =>
    event.data.outcome === 'fed' && Number(event.data.amount) > 0,
  );
  if (!last) return new Date(0);
  return new Date(Date.parse(last.ts) + (kitten.feedingIntervalHours || 4) * 3_600_000);
}

export function localDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function localDateTimeValue(date = new Date()): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${localDateKey(date)}T${hours}:${minutes}:${seconds}`;
}
