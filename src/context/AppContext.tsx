"use client";

import React, {
  createContext, useContext, useReducer, useState,
  useEffect, useCallback, useRef,
} from 'react';
import {
  AppEvent, GrowthPoint, DayStats,
  SAMPLE_HISTORY, GROWTH as GROWTH_DATA,
  TODAY, dateKey, dateAtTime, durationMin, statsForDate, ageInDays,
} from '@/lib/sampleData';
import { subscribeToHistory, fsAddEvent, fsUpdateEvent, fsDeleteEvent } from '@/lib/firestore/events';
import { subscribeToGrowth, fsAddGrowth } from '@/lib/firestore/growth';
import { isFirebaseConfigured } from '@/lib/firebase';

// ─── Palette ──────────────────────────────────────────────────────────────────
export const PALETTES = {
  sage: {
    bg: '#EFEDE8', surface: '#FFFFFF', soft: '#F6F4EE', line: '#DAD4C8',
    mid: '#C6BFAE', olive: '#928974', ink: '#2A2620', inkSoft: '#6B6358', name: 'Sauge',
  },
  cream: {
    bg: '#F5EFE6', surface: '#FFFFFF', soft: '#FBF6EC', line: '#E8D8C0',
    mid: '#D4BFA0', olive: '#A47E50', ink: '#332518', inkSoft: '#6E5C45', name: 'Crème',
  },
  mist: {
    bg: '#ECEEEE', surface: '#FFFFFF', soft: '#F3F5F4', line: '#D4D9D6',
    mid: '#B6BFB9', olive: '#7A8782', ink: '#1F2625', inkSoft: '#5A6562', name: 'Brume',
  },
} as const;

export type PaletteKey = keyof typeof PALETTES;
export type Palette = typeof PALETTES[PaletteKey];

// ─── Tweaks ───────────────────────────────────────────────────────────────────
export interface Tweaks {
  palette: PaletteKey;
  trackerLayout: 'grid_2' | 'list' | 'circles';
  timelineStyle: 'rail' | 'cards' | 'compact';
  sleepMode: 'subtle' | 'marked' | 'immersive';
  darkMode: boolean;
}

const TWEAK_DEFAULTS: Tweaks = {
  palette: 'sage',
  trackerLayout: 'grid_2',
  timelineStyle: 'rail',
  sleepMode: 'immersive',
  darkMode: false,
};

// ─── App state ────────────────────────────────────────────────────────────────
export interface SheetState {
  type: 'feed' | 'pump' | 'diaper' | 'care' | 'temp' | 'growth' | 'edit';
  event?: AppEvent;
}

export interface AppState {
  history: Record<string, AppEvent[]>;
  growth: GrowthPoint[];
  activeSleep: { start: Date; id: string } | null;
  sheet: SheetState | null;
  loaded: boolean;
}

type Action =
  | { type: 'SET_SHEET'; sheet: SheetState | null }
  | { type: 'OPEN_EDIT'; event: AppEvent }
  | { type: 'START_SLEEP' }
  | { type: 'STOP_SLEEP' }
  | { type: 'SET_ACTIVE_SLEEP_ID'; id: string }
  | { type: 'ADD_FEED'; data: { kind: string; breast?: 'G'|'D'|null; ml?: number|null; time: { h: number; m: number }; note: string } }
  | { type: 'ADD_PUMP'; data: { breast: string; ml: number; time: { h: number; m: number }; note: string } }
  | { type: 'ADD_DIAPER'; data: { pipi: boolean; caca: boolean; color: string|null; time: { h: number; m: number }; note: string } }
  | { type: 'ADD_CARE'; data: { kind: string; custom?: string|null; time: { h: number; m: number }; note: string } }
  | { type: 'ADD_TEMP'; data: { value: number; slot: string; time: { h: number; m: number }; note: string } }
  | { type: 'ADD_GROWTH'; data: { poids: number; taille: number; pc: number; date: Date } }
  | { type: 'EDIT_EVENT'; id: string; data: { time: { h: number; m: number }; endTime?: { h: number; m: number }|null; note: string } }
  | { type: 'DELETE_EVENT'; id: string }
  | { type: 'LOAD_HISTORY'; history: Record<string, AppEvent[]> }
  | { type: 'LOAD_GROWTH'; growth: GrowthPoint[] };

const IS_FIREBASE = isFirebaseConfigured;

function buildInitialState(): AppState {
  if (IS_FIREBASE) {
    return { history: {}, growth: [], activeSleep: null, sheet: null, loaded: false };
  }
  return { history: SAMPLE_HISTORY, growth: GROWTH_DATA, activeSleep: null, sheet: null, loaded: true };
}

function findEventDay(history: Record<string, AppEvent[]>, id: string): { ev: AppEvent; key: string } | null {
  for (const [key, events] of Object.entries(history)) {
    const ev = events.find(e => e.id === id);
    if (ev) return { ev, key };
  }
  return null;
}

function reducer(state: AppState, action: Action): AppState {
  const todayKey = dateKey(TODAY);
  const today = state.history[todayKey] || [];

  switch (action.type) {
    case 'SET_SHEET': return { ...state, sheet: action.sheet };
    case 'OPEN_EDIT': return { ...state, sheet: { type: 'edit', event: action.event } };

    case 'SET_ACTIVE_SLEEP_ID':
      return { ...state, activeSleep: state.activeSleep ? { ...state.activeSleep, id: action.id } : null };

    case 'START_SLEEP': {
      const ev: AppEvent = {
        id: `s-${Date.now()}`, type: 'sleep',
        start: new Date(), end: null, dur: 0, data: { note: '' },
      };
      return {
        ...state, activeSleep: { start: ev.start, id: ev.id },
        history: { ...state.history, [todayKey]: [...today, ev].sort((a, b) => a.start.getTime() - b.start.getTime()) },
      };
    }
    case 'STOP_SLEEP': {
      const stopAt = new Date();
      const updated = today.map(e => {
        if (e.id === state.activeSleep?.id) return { ...e, end: stopAt, dur: durationMin(e.start, stopAt) };
        return e;
      });
      return { ...state, activeSleep: null, history: { ...state.history, [todayKey]: updated } };
    }

    case 'ADD_FEED': {
      const d = action.data;
      const start = dateAtTime(TODAY, d.time.h, d.time.m);
      const dur = d.kind === 'sein' ? 18 : 15;
      const ev: AppEvent = {
        id: `f-${Date.now()}`, type: 'feed',
        start, end: new Date(start.getTime() + dur * 60000), dur,
        data: { kind: d.kind, breast: d.breast ?? undefined, ml: d.ml, note: d.note },
      };
      return { ...state, history: { ...state.history, [todayKey]: [...today, ev].sort((a, b) => a.start.getTime() - b.start.getTime()) } };
    }
    case 'ADD_PUMP': {
      const d = action.data;
      const start = dateAtTime(TODAY, d.time.h, d.time.m);
      const ev: AppEvent = {
        id: `p-${Date.now()}`, type: 'pump',
        start, end: start, dur: 0, data: { breast: d.breast as 'G'|'D', ml: d.ml, note: d.note },
      };
      return { ...state, history: { ...state.history, [todayKey]: [...today, ev].sort((a, b) => a.start.getTime() - b.start.getTime()) } };
    }
    case 'ADD_DIAPER': {
      const d = action.data;
      const start = dateAtTime(TODAY, d.time.h, d.time.m);
      const ev: AppEvent = {
        id: `d-${Date.now()}`, type: 'diaper',
        start, end: start, dur: 0, data: { pipi: d.pipi, caca: d.caca, color: d.color, note: d.note },
      };
      return { ...state, history: { ...state.history, [todayKey]: [...today, ev].sort((a, b) => a.start.getTime() - b.start.getTime()) } };
    }
    case 'ADD_CARE': {
      const d = action.data;
      const start = dateAtTime(TODAY, d.time.h, d.time.m);
      const ev: AppEvent = {
        id: `c-${Date.now()}`, type: 'care',
        start, end: start, dur: 0, data: { kind: d.kind, custom: d.custom, note: d.note },
      };
      return { ...state, history: { ...state.history, [todayKey]: [...today, ev].sort((a, b) => a.start.getTime() - b.start.getTime()) } };
    }
    case 'ADD_TEMP': {
      const d = action.data;
      const start = dateAtTime(TODAY, d.time.h, d.time.m);
      const ev: AppEvent = {
        id: `t-${Date.now()}`, type: 'temp',
        start, end: start, dur: 0, data: { value: d.value, slot: d.slot, note: d.note },
      };
      return { ...state, history: { ...state.history, [todayKey]: [...today, ev].sort((a, b) => a.start.getTime() - b.start.getTime()) } };
    }
    case 'ADD_GROWTH': {
      const d = action.data;
      const day = ageInDays(d.date);
      const point: GrowthPoint = { date: d.date, day, poids: d.poids, taille: d.taille, pc: d.pc };
      return { ...state, growth: [...state.growth, point].sort((a, b) => a.day - b.day) };
    }

    case 'EDIT_EVENT': {
      const found = findEventDay(state.history, action.id);
      if (!found) return state;
      const { ev, key } = found;
      const dayDate = new Date(ev.start.getFullYear(), ev.start.getMonth(), ev.start.getDate());
      const newStart = dateAtTime(dayDate, action.data.time.h, action.data.time.m);
      let newEnd = ev.end;
      let newDur = ev.dur;
      if (action.data.endTime) {
        newEnd = dateAtTime(dayDate, action.data.endTime.h, action.data.endTime.m);
        newDur = durationMin(newStart, newEnd);
      } else if (ev.dur > 0) {
        newEnd = new Date(newStart.getTime() + ev.dur * 60000);
      }
      const updatedEvents = state.history[key]
        .map(e => e.id === action.id ? { ...e, start: newStart, end: newEnd, dur: newDur, data: { ...e.data, note: action.data.note } } : e)
        .sort((a, b) => a.start.getTime() - b.start.getTime());
      return { ...state, history: { ...state.history, [key]: updatedEvents } };
    }
    case 'DELETE_EVENT': {
      const found = findEventDay(state.history, action.id);
      if (!found) return state;
      const { key } = found;
      return { ...state, history: { ...state.history, [key]: state.history[key].filter(e => e.id !== action.id) } };
    }

    case 'LOAD_HISTORY': {
      const todayEvents = action.history[todayKey] || [];
      const activeSleepEv = todayEvents.find(e => e.type === 'sleep' && e.end === null);
      const activeSleep: AppState['activeSleep'] = activeSleepEv
        ? { id: activeSleepEv.id, start: activeSleepEv.start }
        : null;
      return { ...state, history: action.history, activeSleep, loaded: true };
    }
    case 'LOAD_GROWTH':
      return { ...state, growth: action.growth };

    default: return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
interface AppContextValue {
  state: AppState;
  dispatch: (action: Action) => void;
  tweaks: Tweaks;
  setTweak: <K extends keyof Tweaks>(key: K, value: Tweaks[K]) => void;
  palette: Palette;
  firebaseError: string | null;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, rawDispatch] = useReducer(reducer, undefined, buildInitialState);
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const [firebaseError, setFirebaseError] = useState<string | null>(null);

  const [tweaks, setTweaks] = useState<Tweaks>(() => {
    if (typeof window === 'undefined') return TWEAK_DEFAULTS;
    try {
      const stored = localStorage.getItem('charlie-tweaks');
      return stored ? { ...TWEAK_DEFAULTS, ...JSON.parse(stored) } : TWEAK_DEFAULTS;
    } catch { return TWEAK_DEFAULTS; }
  });

  useEffect(() => {
    try { localStorage.setItem('charlie-tweaks', JSON.stringify(tweaks)); } catch {}
  }, [tweaks]);

  // ─── Firestore subscriptions ─────────────────────────────────────────────
  useEffect(() => {
    console.log('[Charlie] Firebase mode:', IS_FIREBASE, '| project:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '(not set)');
    if (!IS_FIREBASE) return;

    const from = new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() - 44);
    const handleError = (err: Error) => setFirebaseError(err.message);

    const unsub1 = subscribeToHistory(
      from,
      history => rawDispatch({ type: 'LOAD_HISTORY', history }),
      handleError,
    );
    const unsub2 = subscribeToGrowth(
      growth => rawDispatch({ type: 'LOAD_GROWTH', growth }),
      handleError,
    );
    return () => { unsub1(); unsub2(); };
  }, []);

  // ─── Firestore write-through ─────────────────────────────────────────────
  const handleFirestoreWrite = useCallback(async (action: Action) => {
    const s = stateRef.current;
    const todayStr = dateKey(TODAY);

    switch (action.type) {
      case 'START_SLEEP': {
        const now = new Date();
        const id = await fsAddEvent(
          { type: 'sleep', start: now, end: null, dur: 0, data: { note: '' } },
          todayStr,
        );
        rawDispatch({ type: 'SET_ACTIVE_SLEEP_ID', id });
        break;
      }
      case 'STOP_SLEEP': {
        if (s.activeSleep?.id) {
          const now = new Date();
          await fsUpdateEvent(s.activeSleep.id, {
            end: now,
            dur: durationMin(s.activeSleep.start, now),
          });
        }
        break;
      }
      case 'ADD_FEED': {
        const d = action.data;
        const start = dateAtTime(TODAY, d.time.h, d.time.m);
        const dur = d.kind === 'sein' ? 18 : 15;
        await fsAddEvent(
          { type: 'feed', start, end: new Date(start.getTime() + dur * 60000), dur,
            data: { kind: d.kind, breast: d.breast ?? undefined, ml: d.ml, note: d.note } },
          todayStr,
        );
        break;
      }
      case 'ADD_PUMP': {
        const d = action.data;
        const start = dateAtTime(TODAY, d.time.h, d.time.m);
        await fsAddEvent(
          { type: 'pump', start, end: start, dur: 0,
            data: { breast: d.breast as 'G' | 'D' | 'GD', ml: d.ml, note: d.note } },
          todayStr,
        );
        break;
      }
      case 'ADD_DIAPER': {
        const d = action.data;
        const start = dateAtTime(TODAY, d.time.h, d.time.m);
        await fsAddEvent(
          { type: 'diaper', start, end: start, dur: 0,
            data: { pipi: d.pipi, caca: d.caca, color: d.color, note: d.note } },
          todayStr,
        );
        break;
      }
      case 'ADD_CARE': {
        const d = action.data;
        const start = dateAtTime(TODAY, d.time.h, d.time.m);
        await fsAddEvent(
          { type: 'care', start, end: start, dur: 0,
            data: { kind: d.kind, custom: d.custom, note: d.note } },
          todayStr,
        );
        break;
      }
      case 'ADD_TEMP': {
        const d = action.data;
        const start = dateAtTime(TODAY, d.time.h, d.time.m);
        await fsAddEvent(
          { type: 'temp', start, end: start, dur: 0,
            data: { value: d.value, slot: d.slot, note: d.note } },
          todayStr,
        );
        break;
      }
      case 'ADD_GROWTH': {
        const d = action.data;
        await fsAddGrowth({ date: d.date, day: ageInDays(d.date), poids: d.poids, taille: d.taille, pc: d.pc });
        break;
      }
      case 'EDIT_EVENT': {
        const found = findEventDay(s.history, action.id);
        if (!found) break;
        const { ev } = found;
        const dayDate = new Date(ev.start.getFullYear(), ev.start.getMonth(), ev.start.getDate());
        const newStart = dateAtTime(dayDate, action.data.time.h, action.data.time.m);
        const patch: Parameters<typeof fsUpdateEvent>[1] = {
          start: newStart,
          data: { ...ev.data, note: action.data.note },
          date: dateKey(dayDate),
        };
        if (action.data.endTime) {
          patch.end = dateAtTime(dayDate, action.data.endTime.h, action.data.endTime.m);
          patch.dur = durationMin(newStart, patch.end!);
        }
        await fsUpdateEvent(action.id, patch);
        break;
      }
      case 'DELETE_EVENT':
        await fsDeleteEvent(action.id);
        break;
    }
  }, []);

  const dispatch = useCallback((action: Action) => {
    rawDispatch(action);
    if (IS_FIREBASE) {
      handleFirestoreWrite(action).catch(err => console.error('[Firestore]', err));
    }
  }, [handleFirestoreWrite]);

  const setTweak = useCallback(<K extends keyof Tweaks>(key: K, value: Tweaks[K]) => {
    setTweaks(prev => ({ ...prev, [key]: value }));
  }, []);

  const palette = PALETTES[tweaks.palette];

  return (
    <AppContext.Provider value={{ state, dispatch, tweaks, setTweak, palette, firebaseError }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export type { Action, AppEvent, GrowthPoint, DayStats };
export { statsForDate };
