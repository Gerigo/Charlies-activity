// ─── Event types ───────────────────────────────────────────────────────────────

export type EventType =
  | "sleep"
  | "feeding"
  | "pumping"
  | "diaper"
  | "care"
  | "temperature";

export type Breast = "left" | "right" | "both";
export type DiaperContent = "wet" | "dirty" | "both";
export type CareName = "bath" | "shower" | "nose" | "vitaminD" | "custom";

// Discriminated union for event detail payloads
export type SleepDetail = {
  type: "sleep";
  isActive: boolean;
};

export type FeedingDetail = {
  type: "feeding";
  breastfed: boolean;
  bottle: boolean;
  breast?: "left" | "right";
  quantityMl?: number;
};

export type PumpingDetail = {
  type: "pumping";
  breast: Breast;
  quantityMl: number;
};

export type DiaperDetail = {
  type: "diaper";
  content: DiaperContent;
  color?: string;
};

export type CareDetail = {
  type: "care";
  careName: CareName;
  customNote?: string;
};

export type TemperatureDetail = {
  type: "temperature";
  value: number;
  period: "morning" | "evening";
};

export type EventDetail =
  | SleepDetail
  | FeedingDetail
  | PumpingDetail
  | DiaperDetail
  | CareDetail
  | TemperatureDetail;

// Full event document (as stored in Firestore)
export interface BabyEvent {
  id: string;
  date: string; // YYYY-MM-DD — for easy day-level queries
  startTime: Date;
  endTime?: Date;
  detail: EventDetail;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Growth ────────────────────────────────────────────────────────────────────

export interface GrowthMeasurement {
  id: string;
  date: string; // YYYY-MM-DD
  weight?: number; // grams
  height?: number; // cm
  headCircumference?: number; // cm
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Daily summary (computed client-side) ─────────────────────────────────────

export interface DaySummary {
  date: string;
  sleepMinutes: number;
  mealCount: number;
  pumpedMl: number;
  diaperCount: number;
  isSleeping: boolean;
  lastBreast?: "left" | "right";
  lastTemperature?: number;
}
