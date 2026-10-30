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
  firstDoseAt?: string;
}

export interface Medication {
  litterPlanId?:string;
  litterPlanOverride?:boolean;
  id: Id;
  name: string;
  route: string;
  source: string;
  manualDose: string;
  unit: string;
  doseCalc: { mode: 'manual' | 'weightBased' | 'rescueChart'; rate?: number; rateUnit?: 'mg/kg' | 'mcg/kg' | 'mL/lb'; concentration?: number | null };
  rescueChart?: { templateId:string; revision:string; productConfirmed:boolean; vetTechApproval?:string; courseStartedElsewhere?:boolean;additionalInstructions?:string };
  safety?: MedicationSafety;
  schedule: MedicationSchedule;
  startDate: string;
  endDate: string;
  instructions: string;
}

export interface MedicationSafety {
  productLabel?:string;
  preparation?:string;
  approvedBy?:string;
  deviceName?:string;
  minimumMeasurableMl?:number;
  incrementMl?:number;
  minimumSpacingHours?:number;
  minimumWeightG?:number;
  maximumWeightG?:number;
  maximumWeightChangePercent?:number;
}

export interface Kitten {
  careStays?: CareStay[];
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

export type Departure = 'another-foster' | 'adopted' | 'petco' | 'rescue' | 'deceased' | 'other' | 'unknown';
export interface CareStay {
  id: Id;
  arrival: string;
  departure: string;
  closed: boolean;
  approximate: boolean;
  from: string;
  destination: string;
  outcome: Departure;
  notes: string;
  createdAt: string;
  revisions?: Array<{at:string;reason:string;previous:string}>;
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
  walkthroughStatus?: 'completed' | 'skipped';
  fosterName?: string;
  fosterArea?: string;
  mentorName?: string;
  mentorPhone?: string;
  largeText?: boolean;
  dismissedFirstRun?: boolean;
  lastBackupAt?: string;
  textSize?: 'standard' | 'large';
  onboardingComplete?: boolean;
  rescueName?: string;
  rescuePhone?: string;
  emergencyInstructions?: string;
}

export interface CareState {
  version: number;
  kittens: Kitten[];
  litters: Litter[];
  events: CareEvent[];
  settings: FosterSettings;
}
