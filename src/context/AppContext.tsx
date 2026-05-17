"use client";

import React, { createContext, useContext, useReducer, useState, useEffect, useCallback } from 'react';
import {
  AppEvent, GrowthPoint, DayStats,
  SAMPLE_HISTORY, GROWTH as GROWTH_DATA,
  TODAY, dateKey, dateAtTime, durationMin, statsForDate, ageInDays,
} from '@/lib/sampleData';

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
}

type Action =
  | { type: 'SET_SHEET'; sheet: SheetState | null }
  | { type: 'OPEN_EDIT'; event: AppEvent }
  | { type: 'START_SLEEP' }
  | { type: 'STOP_SLEEP' }
  | { type: 'ADD_FEED'; data: { kind: string; breast?: 'G'|'D'|null; ml?: number|null; time: { h: number; m: number }; note: string } }
  | { type: 'ADD_PUMP'; data: { breast: string; ml: number; time: { h: number; m: number }; note: string } }
  | { type: 'ADD_DIAPER'; data: { pipi: boolean; caca: boolean; color: string|null; time: { h: number; m: number }; note: string } }
  | { type: 'ADD_CARE'; data: { kind: string; custom?: string|null; time: { h: number; m: number }; note: string } }
  | { type: 'ADD_TEMP'; data: { value: number; slot: string; time: { h: number; m: number }; note: string } }
  | { type: 'ADD_GROWTH'; data: { poids: number; taille: number; pc: number; date: Date } }
  | { type: 'EDIT_EVENT'; id: string; data: { time: { h: number; m: number }; endTime?: { h: number; m: number }|null; note: string } }
  | { type: 'DELETE_EVENT'; id: string };

function buildInitialState(): AppState {
  return { history: SAMPLE_HISTORY, growth: GROWTH_DATA, activeSleep: null, sheet: null };
}

function reducer(state: AppState, action: Action): AppState {
  const todayKey = dateKey(TODAY);
  const today = state.history[todayKey] || [];

  switch (action.type) {
    case 'SET_SHEET': return { ...state, sheet: action.sheet };
    case 'OPEN_EDIT': return { ...state, sheet: { type: 'edit', event: action.event } };

    case 'START_SLEEP': {
      const ev: AppEvent = {
        id: `s-${todayKey}-active-${Date.now()}`, type: 'sleep',
        start: new Date(), end: null, dur: 0, data: { note: '' },
      };
      return {
        ...state, activeSleep: { start: new Date(), id: ev.id },
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
        id: `f-${todayKey}-${Date.now()}`, type: 'feed',
        start, end: new Date(start.getTime() + dur * 60000), dur,
        data: { kind: d.kind, breast: d.breast ?? undefined, ml: d.ml, note: d.note },
      };
      return { ...state, history: { ...state.history, [todayKey]: [...today, ev].sort((a, b) => a.start.getTime() - b.start.getTime()) } };
    }
    case 'ADD_PUMP': {
      const d = action.data;
      const start = dateAtTime(TODAY, d.time.h, d.time.m);
      const ev: AppEvent = {
        id: `p-${todayKey}-${Date.now()}`, type: 'pump',
        start, end: start, dur: 0, data: { breast: d.breast as 'G'|'D', ml: d.ml, note: d.note },
      };
      return { ...state, history: { ...state.history, [todayKey]: [...today, ev].sort((a, b) => a.start.getTime() - b.start.getTime()) } };
    }
    case 'ADD_DIAPER': {
      const d = action.data;
      const start = dateAtTime(TODAY, d.time.h, d.time.m);
      const ev: AppEvent = {
        id: `d-${todayKey}-${Date.now()}`, type: 'diaper',
        start, end: start, dur: 0, data: { pipi: d.pipi, caca: d.caca, color: d.color, note: d.note },
      };
      return { ...state, history: { ...state.history, [todayKey]: [...today, ev].sort((a, b) => a.start.getTime() - b.start.getTime()) } };
    }
    case 'ADD_CARE': {
      const d = action.data;
      const start = dateAtTime(TODAY, d.time.h, d.time.m);
      const ev: AppEvent = {
        id: `c-${todayKey}-${Date.now()}`, type: 'care',
        start, end: start, dur: 0, data: { kind: d.kind, custom: d.custom, note: d.note },
      };
      return { ...state, history: { ...state.history, [todayKey]: [...today, ev].sort((a, b) => a.start.getTime() - b.start.getTime()) } };
    }
    case 'ADD_TEMP': {
      const d = action.data;
      const start = dateAtTime(TODAY, d.time.h, d.time.m);
      const ev: AppEvent = {
        id: `t-${todayKey}-${Date.now()}`, type: 'temp',
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
      const updated = today.map(e => {
        if (e.id !== action.id) return e;
        const d = action.data;
        const newStart = dateAtTime(TODAY, d.time.h, d.time.m);
        let newEnd = e.end;
        let newDur = e.dur;
        if (d.endTime) {
          newEnd = dateAtTime(TODAY, d.endTime.h, d.endTime.m);
          newDur = durationMin(newStart, newEnd);
        } else if (e.dur > 0) {
          newEnd = new Date(newStart.getTime() + e.dur * 60000);
        }
        return { ...e, start: newStart, end: newEnd, dur: newDur, data: { ...e.data, note: d.note } };
      }).sort((a, b) => a.start.getTime() - b.start.getTime());
      return { ...state, history: { ...state.history, [todayKey]: updated } };
    }
    case 'DELETE_EVENT':
      return { ...state, history: { ...state.history, [todayKey]: today.filter(e => e.id !== action.id) } };

    default: return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  tweaks: Tweaks;
  setTweak: <K extends keyof Tweaks>(key: K, value: Tweaks[K]) => void;
  palette: Palette;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, buildInitialState);
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

  const setTweak = useCallback(<K extends keyof Tweaks>(key: K, value: Tweaks[K]) => {
    setTweaks(prev => ({ ...prev, [key]: value }));
  }, []);

  const palette = PALETTES[tweaks.palette];

  return (
    <AppContext.Provider value={{ state, dispatch, tweaks, setTweak, palette }}>
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
