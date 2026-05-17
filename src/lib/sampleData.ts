// Sample data layer — local state for the app (mirrors the design prototype).
// Firebase integration will layer on top of this structure later.

export const BIRTH = new Date(2026, 2, 3); // 3 mars 2026
export const TODAY = new Date(); // live date — was fixed to May 17 2026 in prototype

export type AppEventType = 'sleep' | 'feed' | 'pump' | 'diaper' | 'care' | 'temp';

export interface AppEventData {
  note: string;
  kind?: string;
  breast?: 'G' | 'D' | 'GD';
  ml?: number | null;
  pipi?: boolean;
  caca?: boolean;
  color?: string | null;
  value?: number;
  slot?: string;
  custom?: string | null;
}

export interface AppEvent {
  id: string;
  type: AppEventType;
  start: Date;
  end: Date | null;
  dur: number; // minutes
  data: AppEventData;
}

export interface GrowthPoint {
  id?: string;
  date: Date;
  day: number;
  poids: number;
  taille: number;
  pc: number;
}

export interface DayStats {
  sleepMin: number;
  feedCount: number;
  pumpMl: number;
  pumpCount: number;
  diaperCount: number;
  pipiCount: number;
  cacaCount: number;
  lastTemp: number | null;
  lastFeed: AppEvent | null;
  lastBreast: 'G' | 'D' | null;
}

// ─── Tone palette ─────────────────────────────────────────────────────────────
export interface Tone { bg: string; ink: string; soft: string; }

export const TONES: Record<string, Tone> = {
  indigo: { bg: '#D8D6E2', ink: '#3A3650', soft: '#EBEAF1' },
  sand:   { bg: '#E8DCC4', ink: '#5A4A2E', soft: '#F2EADA' },
  rose:   { bg: '#E8CFC2', ink: '#5C3E33', soft: '#F2E0D6' },
  olive:  { bg: '#CFD4BE', ink: '#3F4830', soft: '#E2E5D5' },
  sky:    { bg: '#C8D6DB', ink: '#2E454D', soft: '#DDE6EA' },
  clay:   { bg: '#DEC2B5', ink: '#5A3528', soft: '#EBD4C8' },
};

export type ToneKey = 'indigo' | 'sand' | 'rose' | 'olive' | 'sky' | 'clay';

export const EVENT_TYPES: Record<AppEventType, { key: AppEventType; label: string; short: string; tone: ToneKey }> = {
  sleep: { key: 'sleep', label: 'Sommeil',     short: 'Sommeil',  tone: 'indigo' },
  feed:  { key: 'feed',  label: 'Nourriture',  short: 'Tétée',    tone: 'sand'   },
  pump:  { key: 'pump',  label: 'Tirage',      short: 'Tirage',   tone: 'rose'   },
  diaper:{ key: 'diaper',label: 'Couche',      short: 'Couche',   tone: 'olive'  },
  care:  { key: 'care',  label: 'Soins',       short: 'Soins',    tone: 'sky'    },
  temp:  { key: 'temp',  label: 'Température', short: 'Temp.',    tone: 'clay'   },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function pad2(n: number): string { return String(n).padStart(2, '0'); }
export function fmtTime(d: Date): string { return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`; }
export function fmtDate(d: Date): string {
  const months = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}
export function fmtDateFull(d: Date): string {
  const days = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
  return `${days[d.getDay()]} ${fmtDate(d)}`;
}
export function ageInDays(d: Date): number {
  return Math.floor((d.getTime() - BIRTH.getTime()) / 86400000);
}
export function ageLabel(d: Date = TODAY): string {
  const days = ageInDays(d);
  const months = Math.floor(days / 30.4375);
  const remDays = Math.floor(days - months * 30.4375);
  if (months < 1) return `${days} jours`;
  return `${months} mois ${remDays} j`;
}
export function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
}
export function dateAtTime(date: Date, h: number, m: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, m, 0);
}
export function durationMin(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / 60000);
}
export function fmtDur(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h${pad2(m)}`;
}
export function nowHM(): string { return `${pad2(TODAY.getHours())}:${pad2(TODAY.getMinutes())}`; }

export function careLabel(kind: string): string {
  const map: Record<string, string> = {
    bain: 'Bain', douche: 'Douche', nettoyage_nez: 'Mouche-bébé',
    vitamine_d: 'Vitamine D', cordon: 'Soin du cordon', creme: 'Crème',
    massage: 'Massage', ongles: 'Ongles', yeux: 'Soin des yeux',
    change: 'Habillage', osteo: 'Ostéopathe', medecin: 'Pédiatre',
    vaccin: 'Vaccin', medicament: 'Médicament',
  };
  return map[kind] || kind;
}

export function statsForDate(events: AppEvent[]): DayStats {
  const sleep = events.filter(e => e.type === 'sleep');
  const feeds = events.filter(e => e.type === 'feed');
  const pumps = events.filter(e => e.type === 'pump');
  const diapers = events.filter(e => e.type === 'diaper');
  const temps = events.filter(e => e.type === 'temp');
  const sleepMin = sleep.reduce((s, e) => s + (e.dur || 0), 0);
  const pumpMl = pumps.reduce((s, e) => s + (e.data?.ml || 0), 0);
  return {
    sleepMin,
    feedCount: feeds.length,
    pumpMl,
    pumpCount: pumps.length,
    diaperCount: diapers.length,
    pipiCount: diapers.filter(e => e.data?.pipi).length,
    cacaCount: diapers.filter(e => e.data?.caca).length,
    lastTemp: temps.length ? temps[temps.length-1].data.value ?? null : null,
    lastFeed: feeds.length ? feeds[feeds.length-1] : null,
    lastBreast: (feeds.filter(e => e.data?.breast).slice(-1)[0]?.data?.breast as 'G' | 'D') || null,
  };
}

// ─── Sample data generator ────────────────────────────────────────────────────
function seedRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

function genEventsForDate(date: Date, isToday = false): AppEvent[] {
  const events: AppEvent[] = [];
  const r = seedRandom(date.getDate() * 31 + date.getMonth() * 1000);
  const cutoff = isToday ? (TODAY.getHours() * 60 + TODAY.getMinutes()) : 24 * 60;

  let t = 6 * 60 + 30 + Math.floor(r() * 30);
  let lastBreast: 'G' | 'D' = r() > 0.5 ? 'G' : 'D';
  while (t < cutoff && t < 23 * 60) {
    const h = Math.floor(t / 60), m = t % 60;
    const start = dateAtTime(date, h, m);
    const dur = 12 + Math.floor(r() * 18);
    const end = new Date(start.getTime() + dur * 60000);
    const kind = r() > 0.85 ? 'biberon' : 'sein';
    lastBreast = lastBreast === 'G' ? 'D' : 'G';
    events.push({
      id: `f-${dateKey(date)}-${events.length}`,
      type: 'feed', start, end, dur,
      data: { kind, breast: kind === 'sein' ? lastBreast : undefined, ml: kind === 'biberon' ? 90 + Math.floor(r() * 60) : null, note: '' },
    });
    t += 150 + Math.floor(r() * 60);
  }

  const naps = [
    { h: 8, m: 15, len: 35 + Math.floor(r() * 30) },
    { h: 11, m: 30, len: 70 + Math.floor(r() * 50) },
    { h: 15, m: 0, len: 60 + Math.floor(r() * 40) },
    { h: 18, m: 30, len: 30 + Math.floor(r() * 20) },
    { h: 21, m: 30, len: 9 * 60 + Math.floor(r() * 60) },
  ];
  naps.forEach((n, i) => {
    const startMin = n.h * 60 + n.m;
    if (startMin < cutoff) {
      const start = dateAtTime(date, n.h, n.m);
      const end = new Date(start.getTime() + n.len * 60000);
      events.push({ id: `s-${dateKey(date)}-${i}`, type: 'sleep', start, end, dur: n.len, data: { note: '' } });
    }
  });

  const dn = 7 + Math.floor(r() * 3);
  for (let i = 0; i < dn; i++) {
    const tMin = 6 * 60 + 30 + i * (15 * 60 / dn) + Math.floor(r() * 40);
    if (tMin < cutoff) {
      const h = Math.floor(tMin / 60), m = tMin % 60;
      const start = dateAtTime(date, h, m);
      const pipi = r() > 0.1;
      const caca = r() > 0.55;
      events.push({ id: `d-${dateKey(date)}-${i}`, type: 'diaper', start, end: start, dur: 0, data: { pipi, caca, color: caca ? (r() > 0.5 ? 'jaune' : 'moutarde') : null, note: '' } });
    }
  }

  const pn = 2 + Math.floor(r() * 2);
  for (let i = 0; i < pn; i++) {
    const tMin = 9 * 60 + i * 250 + Math.floor(r() * 30);
    if (tMin < cutoff) {
      const h = Math.floor(tMin / 60), m = tMin % 60;
      const start = dateAtTime(date, h, m);
      events.push({ id: `p-${dateKey(date)}-${i}`, type: 'pump', start, end: start, dur: 0, data: { breast: r() > 0.5 ? 'G' : 'D', ml: 80 + Math.floor(r() * 70), note: '' } });
    }
  }

  if (8 * 60 + 30 < cutoff) events.push({ id: `c-${dateKey(date)}-vd`, type: 'care', start: dateAtTime(date, 8, 30), end: dateAtTime(date, 8, 30), dur: 0, data: { kind: 'vitamine_d', note: '' } });
  if (date.getDate() % 2 === 1 && 19 * 60 < cutoff) events.push({ id: `c-${dateKey(date)}-bath`, type: 'care', start: dateAtTime(date, 19, 0), end: dateAtTime(date, 19, 15), dur: 15, data: { kind: 'bain', note: '' } });
  if (9 * 60 + 5 < cutoff) events.push({ id: `c-${dateKey(date)}-nez-am`, type: 'care', start: dateAtTime(date, 9, 5), end: dateAtTime(date, 9, 5), dur: 0, data: { kind: 'nettoyage_nez', note: '' } });
  if (17 * 60 + 30 < cutoff) events.push({ id: `c-${dateKey(date)}-nez-pm`, type: 'care', start: dateAtTime(date, 17, 30), end: dateAtTime(date, 17, 30), dur: 0, data: { kind: 'nettoyage_nez', note: '' } });
  if (r() > 0.5 && 12 * 60 + 15 < cutoff) events.push({ id: `c-${dateKey(date)}-creme`, type: 'care', start: dateAtTime(date, 12, 15), end: dateAtTime(date, 12, 15), dur: 0, data: { kind: 'creme', note: '' } });
  if (r() > 0.65 && 19 * 60 + 30 < cutoff) events.push({ id: `c-${dateKey(date)}-massage`, type: 'care', start: dateAtTime(date, 19, 30), end: dateAtTime(date, 19, 35), dur: 5, data: { kind: 'massage', note: '' } });
  if (date.getDay() === 0 && 16 * 60 < cutoff) events.push({ id: `c-${dateKey(date)}-ongles`, type: 'care', start: dateAtTime(date, 16, 0), end: dateAtTime(date, 16, 0), dur: 0, data: { kind: 'ongles', note: '' } });

  if (8 * 60 + 5 < cutoff) events.push({ id: `t-${dateKey(date)}-am`, type: 'temp', start: dateAtTime(date, 8, 5), end: dateAtTime(date, 8, 5), dur: 0, data: { value: 36.7 + r() * 0.4, slot: 'matin', note: '' } });
  if (20 * 60 + 30 < cutoff) events.push({ id: `t-${dateKey(date)}-pm`, type: 'temp', start: dateAtTime(date, 20, 30), end: dateAtTime(date, 20, 30), dur: 0, data: { value: 36.8 + r() * 0.4, slot: 'soir', note: '' } });

  return events.sort((a, b) => a.start.getTime() - b.start.getTime());
}

export function buildHistory(): Record<string, AppEvent[]> {
  const map: Record<string, AppEvent[]> = {};
  for (let i = 45; i >= 0; i--) {
    const d = new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() - i);
    map[dateKey(d)] = genEventsForDate(d, i === 0);
  }
  return map;
}

export const SAMPLE_HISTORY = buildHistory();

export const GROWTH: GrowthPoint[] = (() => {
  const points: GrowthPoint[] = [];
  const ages = [0, 7, 14, 21, 30, 40, 50, 60, 70, 75];
  ages.forEach((a, i) => {
    const d = new Date(BIRTH.getTime() + a * 86400000);
    if (d > TODAY) return;
    points.push({
      date: d, day: a,
      poids: +(3.40 + a * 0.025 + (i % 2 ? 0.05 : 0)).toFixed(2),
      taille: +(50 + a * 0.13).toFixed(1),
      pc: +(35 + a * 0.065).toFixed(1),
    });
  });
  return points;
})();
