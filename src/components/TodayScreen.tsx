"use client";

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { TONES, fmtTime, fmtDur, fmtDateFull, ageLabel, sameDay, dateKey, statsForDate, careLabel, TODAY, AppEvent, EVENT_TYPES } from '@/lib/sampleData';
import { ComparisonChip, Sheet } from './ui/Primitives';
import { IconMoonFilled, IconFeed, IconPump, IconDiaper, IconCare, IconTemp, IconChevronLeft, IconChevronRight, IconNote } from './ui/Icons';
import { EventTile, TileGrid, EncodeSheet } from './TrackerScreen';
import { EditEventForm } from './TrackerScreen';

// ─── Timeline helpers ─────────────────────────────────────────────────────────
function eventGlyph(type: string) {
  const s = 14;
  if (type === 'sleep') return <IconMoonFilled size={s} />;
  if (type === 'feed') return <IconFeed size={s} />;
  if (type === 'pump') return <IconPump size={s} />;
  if (type === 'diaper') return <IconDiaper size={s} />;
  if (type === 'care') return <IconCare size={s} />;
  if (type === 'temp') return <IconTemp size={s} />;
  return null;
}
function eventTone(type: string) {
  const map: Record<string, keyof typeof TONES> = { sleep: 'indigo', feed: 'sand', pump: 'rose', diaper: 'olive', care: 'sky', temp: 'clay' };
  return TONES[map[type] || 'indigo'];
}
function eventTitle(e: AppEvent): string { return EVENT_TYPES[e.type]?.short || e.type; }
function eventDetail(e: AppEvent): string {
  if (e.type === 'sleep') return e.end ? fmtDur(e.dur) : 'en cours…';
  if (e.type === 'feed') return e.data.kind === 'sein' ? `sein ${e.data.breast === 'G' ? 'gauche' : 'droit'} · ${e.dur} min` : `biberon ${e.data.ml} ml`;
  if (e.type === 'pump') return `${e.data.ml} ml · sein ${e.data.breast}`;
  if (e.type === 'diaper') { const parts: string[] = []; if (e.data.pipi) parts.push('pipi'); if (e.data.caca) parts.push(`caca${e.data.color ? ` (${e.data.color})` : ''}`); return parts.join(' + ') || '—'; }
  if (e.type === 'care') return e.data.custom || careLabel(e.data.kind || '');
  if (e.type === 'temp') return `${e.data.value?.toFixed(1)}° · ${e.data.slot}`;
  return '';
}

// ─── Timeline variants ────────────────────────────────────────────────────────
function TimelineRail({ events, palette, onEdit }: { events: AppEvent[]; palette: any; onEdit: (e: AppEvent) => void }) {
  return (
    <div style={{ position: 'relative', paddingLeft: 56 }}>
      <div style={{ position: 'absolute', left: 56, top: 8, bottom: 8, width: 1, background: `linear-gradient(180deg, transparent 0%, ${palette.line} 8%, ${palette.line} 92%, transparent 100%)` }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {events.map(e => {
          const tone = eventTone(e.type);
          const sleeping = e.type === 'sleep' && !e.end;
          return (
            <button key={e.id} onClick={() => onEdit(e)} style={{ position: 'relative', textAlign: 'left', padding: 0 }}>
              <div className="num" style={{ position: 'absolute', left: -56, top: 14, width: 40, textAlign: 'right', fontSize: 11.5, fontWeight: 600, color: palette.inkSoft, letterSpacing: 0 }}>{fmtTime(e.start)}</div>
              <div style={{ position: 'absolute', left: -10, top: 18, width: 18, height: 18, borderRadius: '50%', background: sleeping ? '#3A3650' : tone.bg, color: sleeping ? '#FFF6D8' : tone.ink, display: 'grid', placeItems: 'center', boxShadow: `0 0 0 3px ${palette.bg}`, animation: sleeping ? 'breathe 3s ease-in-out infinite' : 'none' }}>{eventGlyph(e.type)}</div>
              <div style={{ background: palette.surface, borderRadius: 14, padding: '12px 14px', border: `0.5px solid ${palette.line}`, marginLeft: 14 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: palette.ink, letterSpacing: '-0.005em' }}>{eventTitle(e)}</div>
                  {e.data.note && <IconNote size={12} stroke={palette.inkSoft} />}
                </div>
                <div style={{ fontSize: 12.5, color: palette.inkSoft, marginTop: 2 }}>{eventDetail(e)}</div>
                {e.data.note && <div style={{ fontSize: 11.5, color: palette.inkSoft, marginTop: 6, fontStyle: 'italic', opacity: 0.8 }}>« {e.data.note} »</div>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TimelineCards({ events, palette, onEdit }: { events: AppEvent[]; palette: any; onEdit: (e: AppEvent) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {events.map(e => {
        const tone = eventTone(e.type);
        const sleeping = e.type === 'sleep' && !e.end;
        return (
          <button key={e.id} onClick={() => onEdit(e)} style={{ display: 'block', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, background: sleeping ? '#2A2E47' : palette.surface, color: sleeping ? '#F0EEE7' : palette.ink, border: `0.5px solid ${sleeping ? 'rgba(255,255,255,0.08)' : palette.line}`, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: sleeping ? '#FFF6D8' : tone.ink, opacity: 0.5 }} />
              <div style={{ width: 38, height: 38, borderRadius: 12, background: sleeping ? 'rgba(255,255,255,0.1)' : tone.bg, color: sleeping ? '#FFF6D8' : tone.ink, display: 'grid', placeItems: 'center', marginLeft: 4 }}>{eventGlyph(e.type)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{eventTitle(e)}</div>
                  <div className="num" style={{ fontSize: 11.5, fontWeight: 600, opacity: 0.65 }}>{fmtTime(e.start)}</div>
                </div>
                <div style={{ fontSize: 12.5, opacity: 0.7, marginTop: 1 }}>{eventDetail(e)}</div>
                {e.data.note && <div style={{ fontSize: 11.5, opacity: 0.6, marginTop: 4, fontStyle: 'italic' }}>« {e.data.note} »</div>}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function TimelineCompact({ events, palette, onEdit }: { events: AppEvent[]; palette: any; onEdit: (e: AppEvent) => void }) {
  return (
    <div style={{ background: palette.surface, borderRadius: 16, border: `0.5px solid ${palette.line}`, overflow: 'hidden' }}>
      {events.map((e, i) => {
        const tone = eventTone(e.type);
        const sleeping = e.type === 'sleep' && !e.end;
        return (
          <button key={e.id} onClick={() => onEdit(e)} style={{ width: '100%', textAlign: 'left', display: 'grid', gridTemplateColumns: '46px 22px 1fr auto', alignItems: 'center', gap: 10, padding: '10px 14px', borderTop: i === 0 ? 'none' : `0.5px solid ${palette.line}`, background: sleeping ? 'rgba(58,54,80,0.06)' : 'transparent' }}>
            <div className="num" style={{ fontSize: 11.5, fontWeight: 600, color: palette.inkSoft }}>{fmtTime(e.start)}</div>
            <div style={{ width: 22, height: 22, borderRadius: 999, background: sleeping ? '#3A3650' : tone.bg, color: sleeping ? '#FFF6D8' : tone.ink, display: 'grid', placeItems: 'center' }}>{eventGlyph(e.type)}</div>
            <div style={{ minWidth: 0 }}><span style={{ fontSize: 13, fontWeight: 600, color: palette.ink }}>{eventTitle(e)}</span><span style={{ fontSize: 12.5, color: palette.inkSoft, marginLeft: 8 }}>{eventDetail(e)}</span></div>
            {e.data.note && <IconNote size={12} stroke={palette.inkSoft} />}
          </button>
        );
      })}
    </div>
  );
}

function Timeline({ events, style = 'rail', palette, onEdit }: { events: AppEvent[]; style?: string; palette: any; onEdit: (e: AppEvent) => void }) {
  if (!events.length) return <div style={{ padding: 28, textAlign: 'center', background: palette.surface, borderRadius: 16, border: `0.5px solid ${palette.line}`, color: palette.inkSoft, fontSize: 13 }}>Aucun événement encodé pour cette journée.</div>;
  if (style === 'compact') return <TimelineCompact events={events} palette={palette} onEdit={onEdit} />;
  if (style === 'cards') return <TimelineCards events={events} palette={palette} onEdit={onEdit} />;
  return <TimelineRail events={events} palette={palette} onEdit={onEdit} />;
}

function TimelinePaginated({ events, style, palette, onEdit, perPage = 10 }: { events: AppEvent[]; style: string; palette: any; onEdit: (e: AppEvent) => void; perPage?: number }) {
  const reversed = useMemo(() => [...events].reverse(), [events]);
  const [count, setCount] = useState(perPage);
  const visible = reversed.slice(0, count);
  const hasMore = reversed.length > count;
  const remaining = reversed.length - count;
  return (
    <div>
      <Timeline events={visible} style={style} palette={palette} onEdit={onEdit} />
      {hasMore && (
        <button onClick={() => setCount(c => c + perPage)} style={{ marginTop: 12, width: '100%', padding: '13px 16px', borderRadius: 14, background: palette.surface, border: `0.5px solid ${palette.line}`, color: palette.ink, fontWeight: 600, fontSize: 13.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, letterSpacing: '-0.005em' }}>
          Voir plus
          <span style={{ fontSize: 12, color: palette.inkSoft, fontWeight: 500 }}>· {Math.min(perPage, remaining)} de plus ({remaining} restants)</span>
        </button>
      )}
      {!hasMore && count > perPage && (
        <button onClick={() => setCount(perPage)} style={{ marginTop: 12, width: '100%', padding: '11px 16px', borderRadius: 14, background: 'transparent', color: palette.inkSoft, fontWeight: 600, fontSize: 12.5 }}>Réduire</button>
      )}
    </div>
  );
}

// ─── Today Screen ─────────────────────────────────────────────────────────────
export default function TodayScreen() {
  const { state, dispatch, tweaks, palette } = useApp();
  const [date, setDate] = useState(new Date(TODAY));
  const [editEvent, setEditEvent] = useState<AppEvent | null>(null);

  const key = dateKey(date);
  const events = state.history[key] || [];
  const stats = statsForDate(events);

  const prevDate = new Date(date.getTime() - 86400000);
  const prevKey = dateKey(prevDate);
  let prevEvents = state.history[prevKey] || [];
  if (sameDay(date, TODAY)) {
    const cutoff = TODAY.getHours() * 60 + TODAY.getMinutes();
    prevEvents = prevEvents.filter(e => (e.start.getHours() * 60 + e.start.getMinutes()) <= cutoff);
  }
  const prevStats = statsForDate(prevEvents);
  const isToday = sameDay(date, TODAY);
  const sleeping = isToday && !!(state.activeSleep || events.some(e => e.type === 'sleep' && !e.end));

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: palette.bg }}>
      <div style={{ padding: '60px 22px 8px' }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: palette.inkSoft, opacity: 0.7 }}>Aujourd&apos;hui</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
          <button onClick={() => setDate(new Date(date.getTime() - 86400000))} style={{ width: 36, height: 36, borderRadius: 999, background: palette.surface, display: 'grid', placeItems: 'center', color: palette.ink, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <IconChevronLeft size={18} />
          </button>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div className="serif" style={{ fontSize: 30, lineHeight: 1.1, color: palette.ink }}>{isToday ? "Aujourd'hui" : fmtDateFull(date).replace(/^./, (c: string) => c.toUpperCase())}</div>
            <div style={{ fontSize: 11.5, color: palette.inkSoft, marginTop: 2 }}>{isToday ? fmtDateFull(date) : ageLabel(date)}</div>
          </div>
          <button onClick={() => !isToday && setDate(new Date(date.getTime() + 86400000))} disabled={isToday} style={{ width: 36, height: 36, borderRadius: 999, background: isToday ? 'transparent' : palette.surface, display: 'grid', placeItems: 'center', color: isToday ? 'rgba(0,0,0,0.2)' : palette.ink, boxShadow: isToday ? 'none' : '0 1px 3px rgba(0,0,0,0.05)', opacity: isToday ? 0.5 : 1 }}>
            <IconChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="scroll" style={{ flex: 1, overflowY: 'auto', padding: '14px 16px 110px' }}>
        <TileGrid layout={tweaks.trackerLayout}>
          <EventTile kind="sleep" tone={TONES.indigo} label="Sommeil" primary={fmtDur(stats.sleepMin)} hint={<ComparisonChip delta={Math.round((stats.sleepMin - prevStats.sleepMin)/60 * 10)/10} unit="h" />} mode="today" asleep={sleeping} layout={tweaks.trackerLayout} />
          <EventTile kind="feed" tone={TONES.sand} label="Tétées" primary={stats.feedCount} hint={<ComparisonChip delta={stats.feedCount - prevStats.feedCount} unit="" />} mode="today" layout={tweaks.trackerLayout} />
          <EventTile kind="pump" tone={TONES.rose} label="Tirage" primary={`${stats.pumpMl} ml`} hint={<ComparisonChip delta={stats.pumpMl - prevStats.pumpMl} unit="ml" />} mode="today" layout={tweaks.trackerLayout} />
          <EventTile kind="diaper" tone={TONES.olive} label="Couches" primary={stats.diaperCount} hint={<ComparisonChip delta={stats.diaperCount - prevStats.diaperCount} unit="" />} mode="today" layout={tweaks.trackerLayout} />
          <EventTile kind="care" tone={TONES.sky} label="Soins" primary={events.filter(e => e.type === 'care').length}
            hint={(() => { const c = events.filter(e => e.type === 'care'); if (!c.length) return '—'; return c.map(e => careLabel(e.data.kind || '').toLowerCase()).slice(-2).join(' · '); })()}
            mode="today" layout={tweaks.trackerLayout} />
          <EventTile kind="temp" tone={TONES.clay} label="Température" primary={stats.lastTemp ? `${stats.lastTemp.toFixed(1)}°` : '—'}
            hint={(() => { const t = events.filter(e => e.type === 'temp'); if (!t.length) return '—'; return `dernière ${fmtTime(t[t.length-1].start)}`; })()}
            mode="today" layout={tweaks.trackerLayout} />
        </TileGrid>

        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '0 4px 12px' }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: palette.inkSoft, opacity: 0.65 }}>Le fil de la journée</div>
            <div className="num" style={{ fontSize: 11.5, color: palette.inkSoft, opacity: 0.6, fontWeight: 600 }}>{events.length} événement{events.length > 1 ? 's' : ''}</div>
          </div>
          <TimelinePaginated events={events} style={tweaks.timelineStyle} palette={palette} onEdit={(ev) => setEditEvent(ev)} />
        </div>
      </div>

      {/* Edit sheet */}
      <Sheet open={!!editEvent} onClose={() => setEditEvent(null)}>
        {editEvent && (
          <EditEventForm
            event={editEvent}
            onSubmit={(d) => { dispatch({ type: 'EDIT_EVENT', id: editEvent.id, data: d }); setEditEvent(null); }}
            onDelete={() => { dispatch({ type: 'DELETE_EVENT', id: editEvent.id }); setEditEvent(null); }}
          />
        )}
      </Sheet>
    </div>
  );
}
