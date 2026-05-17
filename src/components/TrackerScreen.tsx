"use client";

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  TONES, fmtTime, fmtDur, durationMin, dateKey, statsForDate, careLabel, nowHM, TODAY, EVENT_TYPES,
  AppEvent, pad2, ageLabel, fmtDateFull,
} from '@/lib/sampleData';
import { Sheet, Segmented, Stepper, FormHeader, FieldLabel, SubmitBar, TimeField, CharlieAvatar } from './ui/Primitives';
import { SleepOverlay } from './ui/Primitives';
import { IconMoonFilled, IconSleep, IconFeed, IconPump, IconDiaper, IconCare, IconTemp, IconPlus, IconPipi, IconCaca } from './ui/Icons';
import { Palette } from '@/context/AppContext';

// ─── Event tile ───────────────────────────────────────────────────────────────
function EventTile({ kind, tone, label, hint, primary, badge, onClick, mode = 'tracker', asleep = false, layout = 'grid_2' }: {
  kind: string; tone: typeof TONES.indigo; label: string;
  hint?: React.ReactNode; primary?: React.ReactNode; badge?: string | null;
  onClick?: () => void; mode?: 'tracker' | 'today'; asleep?: boolean; layout?: string;
}) {
  const isCircle = layout === 'circles';
  const sleepActive = kind === 'sleep' && asleep;
  const ink = sleepActive ? '#F0EEE7' : tone.ink;

  const icon = (size: number) => {
    if (kind === 'sleep') return sleepActive ? <IconMoonFilled size={size} /> : <IconSleep size={size} />;
    if (kind === 'feed') return <IconFeed size={size} />;
    if (kind === 'pump') return <IconPump size={size} />;
    if (kind === 'diaper') return <IconDiaper size={size} />;
    if (kind === 'care') return <IconCare size={size} />;
    if (kind === 'temp') return <IconTemp size={size} />;
    return null;
  };

  return (
    <button onClick={onClick} disabled={mode === 'today'} style={{
      position: 'relative', textAlign: 'left',
      padding: isCircle ? 0 : '15px 16px 14px',
      width: '100%', aspectRatio: isCircle ? '1' : 'auto', minHeight: isCircle ? 0 : 112,
      borderRadius: isCircle ? 9999 : 22,
      background: sleepActive
        ? 'linear-gradient(180deg, #2F3450 0%, #1F2238 100%)'
        : `linear-gradient(180deg, ${tone.bg} 0%, ${tone.soft} 100%)`,
      color: ink,
      display: 'flex', flexDirection: 'column',
      justifyContent: 'space-between', alignItems: isCircle ? 'center' : 'stretch',
      cursor: mode === 'tracker' ? 'pointer' : 'default',
      overflow: 'hidden', transition: 'transform 180ms ease, background 280ms ease',
      boxShadow: sleepActive
        ? '0 0 0 0.5px rgba(255,255,255,0.06) inset, 0 1px 0 rgba(255,255,255,0.08) inset, 0 8px 22px rgba(20,20,40,0.22)'
        : '0 1px 0 rgba(255,255,255,0.55) inset, 0 0 0 0.5px rgba(0,0,0,0.025), 0 2px 6px rgba(40,38,32,0.04)',
    }}>
      {sleepActive && (
        <>
          <div style={{ position: 'absolute', top: 8, right: 14 }}><div style={{ width: 3, height: 3, borderRadius: '50%', background: '#FFF6D8', animation: 'twinkle 2.3s ease-in-out infinite', boxShadow: '0 0 4px rgba(255,246,216,0.6)' }} /></div>
          <div style={{ position: 'absolute', top: 24, right: 30 }}><div style={{ width: 2, height: 2, borderRadius: '50%', background: '#E8EAFF', animation: 'twinkle 3.1s ease-in-out infinite', animationDelay: '0.6s' }} /></div>
          <div style={{ position: 'absolute', top: 38, right: 18 }}><div style={{ width: 2.4, height: 2.4, borderRadius: '50%', background: '#FFF6D8', animation: 'twinkle 2.7s ease-in-out infinite', animationDelay: '1.2s' }} /></div>
        </>
      )}

      {isCircle ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12 }}>
          <div style={{ color: ink }}>{icon(26)}</div>
          <div style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: '-0.005em' }}>{label}</div>
          {primary && <div className="num" style={{ fontSize: 11, opacity: 0.65, fontWeight: 500 }}>{primary}</div>}
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: sleepActive ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.55)', display: 'grid', placeItems: 'center', color: ink, boxShadow: sleepActive ? 'none' : '0 1px 2px rgba(0,0,0,0.04)' }}>
              {icon(20)}
            </div>
            {badge && <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.04em', padding: '3px 7px', borderRadius: 999, background: sleepActive ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.06)', color: sleepActive ? '#F0EEE7' : ink }}>{badge}</span>}
          </div>
          <div style={{ marginTop: mode === 'today' ? 6 : 14 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: '-0.005em', opacity: sleepActive ? 0.7 : 0.75 }}>{label}</div>
            {primary && <div className="num" style={{ fontSize: mode === 'today' ? 21 : 18, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 2, lineHeight: 1.15 }}>{primary}</div>}
            {hint && <div style={{ fontSize: 11, opacity: 0.55, marginTop: 1, fontWeight: 500 }}>{hint}</div>}
          </div>
        </>
      )}
    </button>
  );
}

function TileGrid({ layout, children }: { layout: string; children: React.ReactNode }) {
  if (layout === 'list') return <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>;
  if (layout === 'circles') return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>{children}</div>;
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>{children}</div>;
}

// ─── Forms ────────────────────────────────────────────────────────────────────
function FeedForm({ onSubmit, suggestBreast = 'G' }: { onSubmit: (d: any) => void; suggestBreast?: 'G'|'D' }) {
  const [kind, setKind] = useState('sein');
  const [breast, setBreast] = useState(suggestBreast);
  const [ml, setMl] = useState(120);
  const [time, setTime] = useState(nowHM());
  const [note, setNote] = useState('');
  return (
    <div>
      <FormHeader title="Nouvelle tétée" />
      <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div><FieldLabel>Type</FieldLabel><Segmented value={kind} onChange={setKind} options={[{ value: 'sein', label: 'Sein' }, { value: 'biberon', label: 'Biberon' }]} /></div>
        {kind === 'sein' && (
          <div><FieldLabel>Sein</FieldLabel>
            <div style={{ display: 'flex', gap: 10 }}>
              {(['G', 'D'] as const).map(b => (
                <button key={b} onClick={() => setBreast(b)} style={{ flex: 1, padding: '16px 12px', borderRadius: 14, background: breast === b ? TONES.sand.bg : '#fff', border: `1px solid ${breast === b ? TONES.sand.ink + '40' : 'rgba(0,0,0,0.08)'}`, color: breast === b ? TONES.sand.ink : '#2A2620', fontWeight: 600, fontSize: 14, textAlign: 'left' }}>
                  <div style={{ fontSize: 11, opacity: 0.6, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Côté</div>
                  <div style={{ fontSize: 18, marginTop: 2 }}>{b === 'G' ? 'Gauche' : 'Droit'}</div>
                  {b === suggestBreast && <div style={{ fontSize: 10.5, marginTop: 4, opacity: 0.65, fontWeight: 500 }}>suggéré (alterné)</div>}
                </button>
              ))}
            </div>
          </div>
        )}
        {kind === 'biberon' && <div><FieldLabel>Quantité</FieldLabel><Stepper value={ml} onChange={setMl} min={10} max={300} step={10} unit=" ml" /></div>}
        <div><FieldLabel>Heure</FieldLabel><TimeField value={time} onChange={setTime} /></div>
        <div><FieldLabel>Note</FieldLabel><textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optionnel…" style={{ width: '100%', minHeight: 60, padding: 12, borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)', background: '#fff', resize: 'none', fontFamily: 'inherit', fontSize: 14 }} /></div>
      </div>
      <SubmitBar onClick={() => { const [h, m] = time.split(':').map(Number); onSubmit({ kind, breast: kind === 'sein' ? breast : null, ml: kind === 'biberon' ? ml : null, time: { h, m }, note }); }} />
    </div>
  );
}

function PumpForm({ onSubmit }: { onSubmit: (d: any) => void }) {
  const [breast, setBreast] = useState('G');
  const [ml, setMl] = useState(110);
  const [time, setTime] = useState(nowHM());
  const [note, setNote] = useState('');
  return (
    <div>
      <FormHeader title="Tirage de lait" />
      <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div><FieldLabel>Sein</FieldLabel><Segmented value={breast} onChange={setBreast} options={[{ value: 'G', label: 'Gauche' }, { value: 'D', label: 'Droit' }, { value: 'GD', label: 'Les deux' }]} /></div>
        <div><FieldLabel>Quantité tirée</FieldLabel><Stepper value={ml} onChange={setMl} min={5} max={400} step={5} unit=" ml" /></div>
        <div><FieldLabel>Heure</FieldLabel><TimeField value={time} onChange={setTime} /></div>
        <div><FieldLabel>Note</FieldLabel><textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Confort, flux, contexte…" style={{ width: '100%', minHeight: 60, padding: 12, borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)', background: '#fff', resize: 'none', fontFamily: 'inherit', fontSize: 14 }} /></div>
      </div>
      <SubmitBar onClick={() => { const [h, m] = time.split(':').map(Number); onSubmit({ breast, ml, time: { h, m }, note }); }} />
    </div>
  );
}

function DiaperForm({ onSubmit }: { onSubmit: (d: any) => void }) {
  const [pipi, setPipi] = useState(true);
  const [caca, setCaca] = useState(false);
  const [color, setColor] = useState('jaune');
  const [time, setTime] = useState(nowHM());
  const [note, setNote] = useState('');
  const colors = [{ v: 'jaune', l: 'Jaune', sw: '#E8C76A' }, { v: 'moutarde', l: 'Moutarde', sw: '#B98A2E' }, { v: 'vert', l: 'Verdâtre', sw: '#8AA070' }, { v: 'marron', l: 'Marron', sw: '#7A5238' }];
  return (
    <div>
      <FormHeader title="Couche" />
      <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div><FieldLabel>Contenu</FieldLabel>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setPipi(!pipi)} style={{ flex: 1, padding: '16px 12px', borderRadius: 14, background: pipi ? TONES.olive.bg : '#fff', border: `1px solid ${pipi ? TONES.olive.ink + '40' : 'rgba(0,0,0,0.08)'}`, color: pipi ? TONES.olive.ink : '#2A2620', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
              <IconPipi size={18} /> Pipi
            </button>
            <button onClick={() => setCaca(!caca)} style={{ flex: 1, padding: '16px 12px', borderRadius: 14, background: caca ? TONES.olive.bg : '#fff', border: `1px solid ${caca ? TONES.olive.ink + '40' : 'rgba(0,0,0,0.08)'}`, color: caca ? TONES.olive.ink : '#2A2620', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
              <IconCaca size={18} /> Caca
            </button>
          </div>
        </div>
        {caca && <div><FieldLabel>Couleur</FieldLabel><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{colors.map(c => <button key={c.v} onClick={() => setColor(c.v)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 999, background: color === c.v ? '#2A2620' : '#fff', color: color === c.v ? '#FAF9F5' : '#2A2620', border: '1px solid rgba(0,0,0,0.08)', fontSize: 13, fontWeight: 600 }}><span style={{ width: 14, height: 14, borderRadius: '50%', background: c.sw, border: '1px solid rgba(0,0,0,0.1)' }} />{c.l}</button>)}</div></div>}
        <div><FieldLabel>Heure</FieldLabel><TimeField value={time} onChange={setTime} /></div>
        <div><FieldLabel>Note</FieldLabel><textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optionnel…" style={{ width: '100%', minHeight: 50, padding: 12, borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)', background: '#fff', resize: 'none', fontFamily: 'inherit', fontSize: 14 }} /></div>
      </div>
      <SubmitBar onClick={() => { const [h, m] = time.split(':').map(Number); onSubmit({ pipi, caca, color: caca ? color : null, time: { h, m }, note }); }} />
    </div>
  );
}

function CareForm({ onSubmit }: { onSubmit: (d: any) => void }) {
  const [kind, setKind] = useState('vitamine_d');
  const [custom, setCustom] = useState('');
  const [time, setTime] = useState(nowHM());
  const [note, setNote] = useState('');
  const opts = [
    { v: 'bain', l: 'Bain' }, { v: 'douche', l: 'Douche' }, { v: 'nettoyage_nez', l: 'Nez (mouche-bébé)' },
    { v: 'vitamine_d', l: 'Vitamine D' }, { v: 'cordon', l: 'Soin du cordon' }, { v: 'creme', l: 'Crème / pommade' },
    { v: 'massage', l: 'Massage' }, { v: 'ongles', l: 'Ongles' }, { v: 'yeux', l: 'Soin des yeux' },
    { v: 'change', l: 'Habillage' }, { v: 'osteo', l: 'Ostéopathe' }, { v: 'medecin', l: 'Pédiatre / médecin' },
    { v: 'vaccin', l: 'Vaccin' }, { v: 'medicament', l: 'Médicament' }, { v: 'custom', l: 'Autre' },
  ];
  return (
    <div>
      <FormHeader title="Soins" />
      <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div><FieldLabel>Type</FieldLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {opts.map(o => <button key={o.v} onClick={() => setKind(o.v)} style={{ padding: '12px 14px', borderRadius: 14, textAlign: 'left', background: kind === o.v ? TONES.sky.bg : '#fff', border: `1px solid ${kind === o.v ? TONES.sky.ink + '40' : 'rgba(0,0,0,0.08)'}`, color: kind === o.v ? TONES.sky.ink : '#2A2620', fontWeight: 600, fontSize: 13.5, letterSpacing: '-0.005em' }}>{o.l}</button>)}
          </div>
        </div>
        {kind === 'custom' && <div><FieldLabel>Détail</FieldLabel><input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="ex: peau à peau…" style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)', background: '#fff', fontFamily: 'inherit', fontSize: 14 }} /></div>}
        <div><FieldLabel>Heure</FieldLabel><TimeField value={time} onChange={setTime} /></div>
        <div><FieldLabel>Note</FieldLabel><textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optionnel…" style={{ width: '100%', minHeight: 50, padding: 12, borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)', background: '#fff', resize: 'none', fontFamily: 'inherit', fontSize: 14 }} /></div>
      </div>
      <SubmitBar onClick={() => { const [h, m] = time.split(':').map(Number); onSubmit({ kind, custom: kind === 'custom' ? custom : null, time: { h, m }, note }); }} />
    </div>
  );
}

function TempForm({ onSubmit }: { onSubmit: (d: any) => void }) {
  const [value, setValue] = useState(36.8);
  const [slot, setSlot] = useState('matin');
  const [time, setTime] = useState(nowHM());
  const [note, setNote] = useState('');
  return (
    <div>
      <FormHeader title="Température" />
      <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div><FieldLabel>Moment</FieldLabel><Segmented value={slot} onChange={setSlot} options={[{ value: 'matin', label: 'Matin' }, { value: 'soir', label: 'Soir' }]} /></div>
        <div><FieldLabel>Mesure</FieldLabel>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button onClick={() => setValue(+(value - 0.1).toFixed(1))} style={{ width: 44, height: 44, borderRadius: 999, background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', fontSize: 22, fontWeight: 500 }}>−</button>
            <div className="serif num" style={{ flex: 1, textAlign: 'center', fontSize: 52, fontWeight: 400, color: value > 38 ? '#9A4F3F' : '#2A2620' }}>{value.toFixed(1)}°</div>
            <button onClick={() => setValue(+(value + 0.1).toFixed(1))} style={{ width: 44, height: 44, borderRadius: 999, background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', fontSize: 22, fontWeight: 500 }}>+</button>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.45)', textAlign: 'center', marginTop: 6 }}>{value < 36 ? 'Hypothermie possible' : value > 38 ? '⚠ Fièvre' : value > 37.5 ? 'Légèrement élevé' : 'Plage normale'}</div>
        </div>
        <div><FieldLabel>Heure</FieldLabel><TimeField value={time} onChange={setTime} /></div>
        <div><FieldLabel>Note</FieldLabel><textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optionnel…" style={{ width: '100%', minHeight: 50, padding: 12, borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)', background: '#fff', resize: 'none', fontFamily: 'inherit', fontSize: 14 }} /></div>
      </div>
      <SubmitBar onClick={() => { const [h, m] = time.split(':').map(Number); onSubmit({ value, slot, time: { h, m }, note }); }} />
    </div>
  );
}

export function EditEventForm({ event, onSubmit, onDelete }: { event: AppEvent; onSubmit: (d: any) => void; onDelete: () => void }) {
  const [time, setTime] = useState(`${pad2(event.start.getHours())}:${pad2(event.start.getMinutes())}`);
  const [endTime, setEndTime] = useState(event.end && event.dur ? `${pad2(event.end.getHours())}:${pad2(event.end.getMinutes())}` : null);
  const [note, setNote] = useState(event.data?.note || '');
  const T = EVENT_TYPES[event.type];
  const detail = () => {
    if (event.type === 'feed') return event.data.kind === 'sein' ? `Sein ${event.data.breast === 'G' ? 'gauche' : 'droit'}` : `Biberon ${event.data.ml} ml`;
    if (event.type === 'sleep') return `Durée ${fmtDur(event.dur)}`;
    if (event.type === 'pump') return `${event.data.ml} ml · sein ${event.data.breast}`;
    if (event.type === 'diaper') return [event.data.pipi && 'pipi', event.data.caca && `caca${event.data.color ? ` (${event.data.color})` : ''}`].filter(Boolean).join(' + ');
    if (event.type === 'care') return event.data.kind === 'vitamine_d' ? 'Vitamine D' : event.data.kind;
    if (event.type === 'temp') return `${event.data.value?.toFixed(1)}° · ${event.data.slot}`;
    return '';
  };
  return (
    <div>
      <FormHeader title={`Modifier · ${T.label}`} />
      <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ padding: 14, background: '#fff', borderRadius: 14, border: '1px solid rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 11.5, color: 'rgba(0,0,0,0.5)', fontWeight: 600 }}>Détails</div>
          <div style={{ fontSize: 14, marginTop: 4 }}>{detail()}</div>
        </div>
        <div><FieldLabel>Heure</FieldLabel><TimeField value={time} onChange={setTime} /></div>
        {endTime !== null && <div><FieldLabel>Fin</FieldLabel><TimeField value={endTime} onChange={setEndTime} /></div>}
        <div><FieldLabel>Note</FieldLabel><textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note libre…" style={{ width: '100%', minHeight: 70, padding: 12, borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)', background: '#fff', resize: 'none', fontFamily: 'inherit', fontSize: 14 }} /></div>
      </div>
      <SubmitBar onClick={() => {
        const [h, m] = time.split(':').map(Number);
        let endHM = null;
        if (endTime) { const [eh, em] = endTime.split(':').map(Number); endHM = { h: eh, m: em }; }
        onSubmit({ time: { h, m }, endTime: endHM, note });
      }} onDelete={onDelete} />
    </div>
  );
}

// ─── Encode sheet ─────────────────────────────────────────────────────────────
function EncodeSheet({ sheet, setSheet }: { sheet: { type: string; event?: AppEvent } | null; setSheet: (s: any) => void }) {
  const { dispatch, state } = useApp();
  const todayKey = dateKey(TODAY);
  const events = state.history[todayKey] || [];
  const stats = statsForDate(events);
  const open = !!sheet;
  return (
    <Sheet open={open} onClose={() => setSheet(null)}>
      {sheet?.type === 'feed' && <FeedForm onSubmit={(d) => { dispatch({ type: 'ADD_FEED', data: d }); setSheet(null); }} suggestBreast={stats.lastBreast === 'G' ? 'D' : 'G'} />}
      {sheet?.type === 'pump' && <PumpForm onSubmit={(d) => { dispatch({ type: 'ADD_PUMP', data: d }); setSheet(null); }} />}
      {sheet?.type === 'diaper' && <DiaperForm onSubmit={(d) => { dispatch({ type: 'ADD_DIAPER', data: d }); setSheet(null); }} />}
      {sheet?.type === 'care' && <CareForm onSubmit={(d) => { dispatch({ type: 'ADD_CARE', data: d }); setSheet(null); }} />}
      {sheet?.type === 'temp' && <TempForm onSubmit={(d) => { dispatch({ type: 'ADD_TEMP', data: d }); setSheet(null); }} />}
      {sheet?.type === 'edit' && sheet.event && (
        <EditEventForm
          event={sheet.event}
          onSubmit={(d) => { dispatch({ type: 'EDIT_EVENT', id: sheet.event!.id, data: d }); setSheet(null); }}
          onDelete={() => { dispatch({ type: 'DELETE_EVENT', id: sheet.event!.id }); setSheet(null); }}
        />
      )}
    </Sheet>
  );
}

// ─── Tracker Screen ───────────────────────────────────────────────────────────
export default function TrackerScreen() {
  const { state, dispatch, tweaks, palette } = useApp();
  const todayKey = dateKey(TODAY);
  const events = state.history[todayKey] || [];
  const stats = statsForDate(events);
  const activeSleep = state.activeSleep;
  const activeFromList = events.find(e => e.type === 'sleep' && !e.end) || null;
  const sleeping = !!(activeSleep || activeFromList);
  const sleepStart = activeSleep?.start || activeFromList?.start;
  const lastFeed = stats.lastFeed;
  const lastBreast = stats.lastBreast;
  const lastFeedTime = lastFeed ? fmtTime(lastFeed.start) : '—';
  const lastSleep = [...events].reverse().find(e => e.type === 'sleep' && e.end);
  const [sheet, setSheet] = useState<{ type: string; event?: AppEvent } | null>(null);

  const showImmersive = sleeping && tweaks.sleepMode === 'immersive';
  const showMarked = sleeping && tweaks.sleepMode === 'marked';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: palette.bg, position: 'relative' }}>
      {showImmersive && <SleepOverlay active intensity="immersive" startTime={sleepStart} onStop={() => dispatch({ type: 'STOP_SLEEP' })} />}

      {!showImmersive && (
        <>
          {showMarked && <SleepOverlay active intensity="marked" startTime={sleepStart} onStop={() => dispatch({ type: 'STOP_SLEEP' })} />}

          <div style={{ padding: '60px 22px 8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <CharlieAvatar size={50} />
                <div style={{ minWidth: 0 }}>
                  <div className="serif" style={{ fontSize: 30, lineHeight: 1.05, color: palette.ink, letterSpacing: '-0.01em' }}>Charlie</div>
                  <div style={{ fontSize: 11.5, color: palette.inkSoft, marginTop: 3, fontWeight: 500 }}>{ageLabel(TODAY)} · {fmtDateFull(TODAY)}</div>
                </div>
              </div>
              {sleeping && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 999, background: '#3A3650', color: '#E8E6F3', fontSize: 11.5, fontWeight: 600, boxShadow: '0 6px 18px rgba(58,54,80,0.3)', animation: 'breathe 3.2s ease-in-out infinite', flexShrink: 0 }}>
                  <IconMoonFilled size={12} /> dort
                </div>
              )}
            </div>
          </div>

          <div className="scroll" style={{ flex: 1, overflowY: 'auto', padding: '14px 16px 110px' }}>
            <TileGrid layout={tweaks.trackerLayout}>
              <EventTile kind="sleep" tone={TONES.indigo} label="Sommeil"
                primary={sleeping ? fmtDur(durationMin(sleepStart!, new Date())) : (lastSleep ? fmtDur(lastSleep.dur) : '—')}
                hint={sleeping ? `endormi à ${fmtTime(sleepStart!)}` : (lastSleep ? `dernier ${fmtTime(lastSleep.start)}` : "aucun aujourd'hui")}
                badge={sleeping ? 'EN COURS' : null} asleep={sleeping}
                onClick={() => sleeping ? dispatch({ type: 'STOP_SLEEP' }) : dispatch({ type: 'START_SLEEP' })}
                layout={tweaks.trackerLayout} />
              <EventTile kind="feed" tone={TONES.sand} label="Nourriture"
                primary={lastFeed ? lastFeedTime : '—'}
                hint={lastFeed ? (lastFeed.data.kind === 'sein' ? `sein ${lastBreast === 'G' ? 'gauche' : 'droit'}` : `biberon ${lastFeed.data.ml}ml`) : 'rien encore'}
                badge={lastBreast ? `→ ${lastBreast === 'G' ? 'D' : 'G'}` : null}
                onClick={() => setSheet({ type: 'feed' })} layout={tweaks.trackerLayout} />
              <EventTile kind="pump" tone={TONES.rose} label="Tirage"
                primary={`${stats.pumpMl} ml`} hint={`${stats.pumpCount} séance${stats.pumpCount > 1 ? 's' : ''}`}
                onClick={() => setSheet({ type: 'pump' })} layout={tweaks.trackerLayout} />
              <EventTile kind="diaper" tone={TONES.olive} label="Couches"
                primary={stats.diaperCount} hint={`${stats.pipiCount} pipi · ${stats.cacaCount} caca`}
                onClick={() => setSheet({ type: 'diaper' })} layout={tweaks.trackerLayout} />
              <EventTile kind="care" tone={TONES.sky} label="Soins"
                primary={events.filter(e => e.type === 'care').length}
                hint={(() => { const c = events.filter(e => e.type === 'care'); if (!c.length) return 'rien encore'; return `dernier · ${careLabel(c[c.length-1].data.kind!).toLowerCase()}`; })()}
                onClick={() => setSheet({ type: 'care' })} layout={tweaks.trackerLayout} />
              <EventTile kind="temp" tone={TONES.clay} label="Température"
                primary={stats.lastTemp ? `${stats.lastTemp.toFixed(1)}°` : '—'}
                hint={(() => { const t = events.filter(e => e.type === 'temp'); if (!t.length) return 'pas encore prise'; return `${t[t.length-1].data.slot} · ${fmtTime(t[t.length-1].start)}`; })()}
                onClick={() => setSheet({ type: 'temp' })} layout={tweaks.trackerLayout} />
            </TileGrid>

            <div style={{ marginTop: 22, padding: '14px 16px', background: palette.surface, borderRadius: 18, border: `0.5px solid ${palette.line}` }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: palette.inkSoft, opacity: 0.65, marginBottom: 10 }}>Aperçu rapide</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[{ label: 'Sommeil', value: fmtDur(stats.sleepMin) }, { label: 'Tétées', value: stats.feedCount }, { label: 'Lait tiré', value: `${stats.pumpMl}ml` }].map(s => (
                  <div key={s.label}>
                    <div style={{ fontSize: 10.5, color: palette.inkSoft, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', opacity: 0.7 }}>{s.label}</div>
                    <div className="num" style={{ fontSize: 18, fontWeight: 700, marginTop: 2, color: palette.ink, letterSpacing: '-0.02em' }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      <EncodeSheet sheet={sheet} setSheet={setSheet} />
    </div>
  );
}

export { EventTile, TileGrid, EncodeSheet };
