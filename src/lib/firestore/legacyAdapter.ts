// Adapter between the existing "Charlie" legacy Firestore schema
// (collection `events`, trackerId === 'charlie-shared', epoch-ms times,
// EventDetails map) and the shape this app's screens consume (AppEvent /
// GrowthPoint). Read + write both speak legacy so data stays compatible
// with the original tracker app.

import { AppEvent, AppEventType, GrowthPoint, ageInDays, careLabel } from '@/lib/sampleData';

export const LEGACY_SCOPE = 'charlie-shared';

type Legacy = Record<string, any>;

const TYPE_IN: Record<string, AppEventType | 'growth'> = {
  sleep: 'sleep',
  feed: 'feed',
  diaper: 'diaper',
  pumping: 'pump',
  temperature: 'temp',
  medication: 'care',
  growth: 'growth',
};

export function legacyToAppEvent(id: string, data: Legacy): AppEvent | null {
  const mapped = TYPE_IN[data.type];
  if (!mapped || mapped === 'growth') return null;

  const startMs = typeof data.startTime === 'number' ? data.startTime : Date.now();
  const endMs = typeof data.endTime === 'number' ? data.endTime : null;
  const start = new Date(startMs);
  const end = endMs != null ? new Date(endMs) : null;
  let dur = end ? Math.round((endMs! - startMs) / 60000) : 0;

  const d: Legacy = data.details ?? {};
  const note: string = typeof data.notes === 'string' ? data.notes : '';
  let payload: AppEvent['data'];

  switch (mapped) {
    case 'sleep':
      payload = { note };
      break;
    case 'feed':
      if (d.feedSide === 'bottle') {
        payload = { kind: 'biberon', ml: typeof d.feedAmountMl === 'number' ? d.feedAmountMl : null, note };
      } else {
        payload = {
          kind: 'sein',
          breast: d.feedSide === 'right' ? 'D' : 'G',
          ml: typeof d.bottleSupplement === 'number' ? d.bottleSupplement : null,
          note,
        };
      }
      break;
    case 'diaper': {
      const dt = d.diaperType;
      payload = {
        pipi: dt === 'wet' || dt === 'both',
        caca: dt === 'dirty' || dt === 'both',
        color: typeof d.stoolColor === 'string' ? d.stoolColor : null,
        note,
      };
      break;
    }
    case 'pump': {
      const side = d.pumpingSide;
      const breast = side === 'left' ? 'G' : side === 'right' ? 'D' : 'GD';
      const ml =
        typeof d.pumpingVolumeMl === 'number'
          ? d.pumpingVolumeMl
          : (d.pumpingLeftMl ?? 0) + (d.pumpingRightMl ?? 0) || null;
      if (typeof d.pumpingDurationMin === 'number') dur = d.pumpingDurationMin;
      payload = { breast, ml, note };
      break;
    }
    case 'temp':
      payload = {
        value: typeof d.temperature === 'number' ? d.temperature : undefined,
        slot: d.temperaturePeriod === 'evening' ? 'soir' : 'matin',
        note,
      };
      break;
    case 'care':
      payload = {
        kind: 'medicament',
        custom: typeof d.medicationName === 'string' ? d.medicationName : null,
        note,
      };
      break;
    default:
      payload = { note };
  }

  return { id, type: mapped, start, end, dur, data: payload };
}

export function legacyToGrowth(id: string, data: Legacy): GrowthPoint | null {
  if (data.type !== 'growth') return null;
  const d: Legacy = data.details ?? {};
  if (typeof d.weight !== 'number' && typeof d.height !== 'number' && typeof d.head !== 'number') {
    return null;
  }
  const date = new Date(typeof data.startTime === 'number' ? data.startTime : Date.now());
  return {
    id,
    date,
    day: ageInDays(date),
    poids: typeof d.weight === 'number' ? d.weight : 0,
    taille: typeof d.height === 'number' ? d.height : 0,
    pc: typeof d.head === 'number' ? d.head : 0,
  };
}

function stripUndefined(obj: Legacy): Legacy {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}

// AppEvent → legacy event doc (for writes). `uid` is the current Firebase user.
export function appEventToLegacy(
  ev: { type: AppEventType; start: Date; end: Date | null; data: AppEvent['data'] },
  uid: string,
): Legacy {
  const base: Legacy = {
    startTime: ev.start.getTime(),
    endTime: ev.end ? ev.end.getTime() : null,
    notes: ev.data.note?.trim() || null,
    userId: uid,
    trackerId: LEGACY_SCOPE,
    actorRole: 'manager',
  };

  let type: string;
  let details: Legacy = {};

  switch (ev.type) {
    case 'sleep':
      type = 'sleep';
      break;
    case 'feed':
      type = 'feed';
      if (ev.data.kind === 'biberon') {
        details = { feedSide: 'bottle', feedAmountMl: ev.data.ml ?? undefined };
      } else {
        details = {
          feedSide: ev.data.breast === 'D' ? 'right' : 'left',
          bottleSupplement: ev.data.ml ?? undefined,
        };
      }
      break;
    case 'pump':
      type = 'pumping';
      details = {
        pumpingSide: ev.data.breast === 'G' ? 'left' : ev.data.breast === 'D' ? 'right' : 'both',
        pumpingVolumeMl: ev.data.ml ?? undefined,
      };
      break;
    case 'diaper':
      type = 'diaper';
      details = {
        diaperType: ev.data.pipi && ev.data.caca ? 'both' : ev.data.caca ? 'dirty' : 'wet',
        stoolColor: ev.data.color ?? undefined,
      };
      break;
    case 'temp':
      type = 'temperature';
      details = {
        temperature: ev.data.value,
        temperaturePeriod: ev.data.slot === 'soir' ? 'evening' : 'morning',
      };
      break;
    case 'care':
      type = 'medication';
      details = {
        medicationName: ev.data.custom || careLabel(ev.data.kind || ''),
        careCategory: 'care',
      };
      break;
    default:
      type = ev.type;
  }

  return { ...base, type, details: stripUndefined(details) };
}

// GrowthPoint → legacy growth event doc (for writes).
export function growthToLegacy(
  point: { date: Date; poids: number; taille: number; pc: number },
  uid: string,
): Legacy {
  return {
    type: 'growth',
    startTime: point.date.getTime(),
    endTime: point.date.getTime(),
    notes: null,
    userId: uid,
    trackerId: LEGACY_SCOPE,
    actorRole: 'manager',
    details: { weight: point.poids, height: point.taille, head: point.pc },
  };
}
