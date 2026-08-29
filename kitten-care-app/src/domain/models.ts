export type Id = string;

export interface CarePlan {
  feedingEnabled: boolean;
  dailyWeight: boolean;
  bottleBaby: boolean;
}

export interface MedicationSchedule {
  type: 'daily' | 'twiceDaily' | 'threeDaily' | 'intervalHours' | 'intervalDays' | 'specificDays' | 'oneTime' | 'prn';
  times?: string[];
  intervalHours?: number;
  intervalDays?: number;
  days?: string[];
  oneTimeAt?: string;
}

export interface Medication {
  id: Id;
  name: string;
  route: string;
  source: string;
  manualDose: string;
  unit: string;
  doseCalc: { mode: 'manual' | 'weightBased'; rate?: number; rateUnit?: 'mg/kg' | 'mcg/kg'; concentration?: number | null };
  schedule: MedicationSchedule;
  startDate: string;
  endDate: string;
  instructions: string;
}

export interface Kitten {
  id: Id;
  name: string;
  litterId: Id | null;
  inFosterCare: boolean;
  dob: string;
  sex: string;
  markings: string;
  specialNeeds: string;
  feedingIntervalHours: number;
  medications: Medication[];
  photo: string | null;
  carePlan: CarePlan;
}

export interface Litter {
  id: Id;
  name: string;
  dob: string;
  notes: string;
  medicationPlans?: Array<Medication & { kittenIds: Id[] }>;
}

export type CareEventType = 'feeding' | 'weight' | 'medication' | 'potty' | 'health' | 'note';

export interface CareEvent {
  id: Id;
  kittenId: Id;
  type: CareEventType;
  ts: string;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
  data: Record<string, string | number | boolean | null | undefined>;
}

export interface FosterSettings {
  fosterName?: string;
  fosterArea?: string;
  mentorName?: string;
  mentorPhone?: string;
  largeText?: boolean;
  dismissedFirstRun?: boolean;
  lastBackupAt?: string;
}

export interface CareState {
  version: number;
  kittens: Kitten[];
  litters: Litter[];
  events: CareEvent[];
  settings: FosterSettings;
}
