"use client";

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { TONES, fmtDur, pad2, sameDay, dateKey, dateAtTime, statsForDate, TODAY } from '@/lib/sampleData';
import { Segmented } from './ui/Primitives';
import { LineChart, BarStack } from './ui/Charts';

function AvgCard({ tone, label, value, sub }: { tone: any; label: string; value: string; sub: string }) {
  return (
    <div style={{ padding: '14px 16px 16px', borderRadius: 16, background: tone.soft, color: tone.ink, border: '0.5px solid rgba(0,0,0,0.04)' }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.75 }}>{label}</div>
      <div className="num serif" style={{ fontSize: 30, fontWeight: 400, marginTop: 8, letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, opacity: 0.6, fontWeight: 500, marginTop: 6 }}>{sub}</div>
    </div>
  );
}

function ChartCard({ title, subtitle, unit, tone, data, labels, minY, maxY, palette }: {
  title: string; subtitle: string; unit: string; tone: any;
  data: { x: number; y: number }[]; labels: (string|null)[]; minY?: number; maxY?: number; palette: any;
}) {
  return (
    <div style={{ padding: 16, borderRadius: 18, background: palette.surface, border: `0.5px solid ${palette.line}`, marginBottom: 14 }}>
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: palette.ink, letterSpacing: '-0.005em' }}>{title}</div>
        <div style={{ fontSize: 11.5, color: palette.inkSoft, marginTop: 2 }}>{subtitle}</div>
      </div>
      <LineChart series={data} tone={tone} unit={unit} xLabels={labels} width={328} height={140} minY={minY} maxY={maxY} />
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 9, height: 9, borderRadius: 2, background: color, display: 'inline-block' }} />
      {label}
    </span>
  );
}

export default function EvolutionScreen() {
  const { state, palette } = useApp();
  const [range, setRange] = useState('7j');
  const daysCount = range === '7j' ? 7 : range === '14j' ? 14 : 45;

  const days = useMemo(() => {
    const out = [];
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() - i);
      const evs = state.history[dateKey(d)] || [];
      out.push({ date: d, events: evs, stats: statsForDate(evs) });
    }
    return out;
  }, [range, state.history]);

  const avg = useMemo(() => {
    const validDays = days.slice(0, sameDay(days[days.length-1].date, TODAY) ? -1 : days.length);
    const count = validDays.length || 1;
    const avgSleep = validDays.reduce((s, d) => s + d.stats.sleepMin, 0) / count;
    const avgFeed = validDays.reduce((s, d) => s + d.stats.feedCount, 0) / count;
    const avgPump = validDays.reduce((s, d) => s + d.stats.pumpMl, 0) / count;
    const avgDiaper = validDays.reduce((s, d) => s + d.stats.diaperCount, 0) / count;
    return { sleepMin: Math.round(avgSleep), feeds: +avgFeed.toFixed(1), pumpMl: Math.round(avgPump), diaper: +avgDiaper.toFixed(1) };
  }, [days]);

  const hourly = useMemo(() => {
    const bins = Array.from({ length: 24 }, () => ({ sleep: 0, feed: 0, awake: 0, total: 0 }));
    days.forEach(d => {
      const sleeps = d.events.filter(e => e.type === 'sleep' && e.end);
      const feeds = d.events.filter(e => e.type === 'feed');
      for (let h = 0; h < 24; h++) {
        const hourStart = dateAtTime(d.date, h, 0);
        const hourEnd = dateAtTime(d.date, h, 59);
        if (sameDay(d.date, TODAY) && hourStart > TODAY) continue;
        const isSleeping = sleeps.some(s => s.start <= hourEnd && s.end! >= hourStart);
        const isFeeding = feeds.some(f => f.start.getHours() === h);
        bins[h].total += 1;
        if (isSleeping) bins[h].sleep += 1;
        else if (isFeeding) bins[h].feed += 1;
        else bins[h].awake += 1;
      }
    });
    return bins.map(b => ({ sleep: b.total ? b.sleep / b.total : 0, feed: b.total ? b.feed / b.total : 0, awake: b.total ? b.awake / b.total : 0 }));
  }, [days]);

  const sleepSeries = days.map((d, i) => ({ x: i, y: Math.round(d.stats.sleepMin / 60 * 10) / 10 }));
  const feedSeries = days.map((d, i) => ({ x: i, y: d.stats.feedCount }));
  const pumpSeries = days.map((d, i) => ({ x: i, y: d.stats.pumpMl }));
  const tempSeries = days.map((d, i) => ({ x: i, y: d.stats.lastTemp ?? 0 })).filter(p => p.y !== 0);

  const dayLabels: (string|null)[] = days.map((d, i) => {
    if (i === 0 || i === days.length - 1) return d.date.getDate() + '/' + (d.date.getMonth() + 1);
    if (days.length > 14 && i % 5 !== 0) return null;
    if (days.length > 7 && i % 2 !== 0) return null;
    return d.date.getDate() + '/' + (d.date.getMonth() + 1);
  });

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: palette.bg }}>
      <div style={{ padding: '60px 22px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: palette.inkSoft, opacity: 0.7 }}>Évolution</div>
            <div className="serif" style={{ fontSize: 30, lineHeight: 1.15, marginTop: 4 }}>Tendances de Charlie</div>
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          <Segmented value={range} onChange={setRange} options={[{ value: '7j', label: '7 j' }, { value: '14j', label: '14 j' }, { value: 'total', label: 'Total' }]} />
        </div>
      </div>

      <div className="scroll" style={{ flex: 1, overflowY: 'auto', padding: '14px 16px 110px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 18 }}>
          <AvgCard tone={TONES.indigo} label="Sommeil / jour" value={fmtDur(avg.sleepMin)} sub={`moyenne sur ${daysCount} j`} />
          <AvgCard tone={TONES.sand} label="Tétées / jour" value={avg.feeds.toFixed(1)} sub={`moyenne sur ${daysCount} j`} />
          <AvgCard tone={TONES.rose} label="Lait tiré / jour" value={`${avg.pumpMl} ml`} sub={`moyenne sur ${daysCount} j`} />
          <AvgCard tone={TONES.olive} label="Couches / jour" value={avg.diaper.toFixed(1)} sub={`moyenne sur ${daysCount} j`} />
        </div>

        <div style={{ padding: 16, borderRadius: 18, background: palette.surface, border: `0.5px solid ${palette.line}`, marginBottom: 14 }}>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: palette.ink, letterSpacing: '-0.005em' }}>Journée type</div>
            <div style={{ fontSize: 11.5, color: palette.inkSoft, marginTop: 2 }}>probabilité par heure · {daysCount} derniers jours</div>
          </div>
          <BarStack data={hourly} width={328} height={130}
            colors={{ sleep: TONES.indigo.bg, feed: TONES.sand.bg, wake: 'rgba(0,0,0,0.04)' }}
            labels={Array.from({ length: 24 }, (_, h) => (h % 6 === 0 ? pad2(h) + 'h' : null))} />
          <div style={{ display: 'flex', gap: 14, marginTop: 10, fontSize: 11.5, color: palette.inkSoft }}>
            <LegendDot color={TONES.indigo.bg} label="sommeil" />
            <LegendDot color={TONES.sand.bg} label="tétée" />
            <LegendDot color="rgba(0,0,0,0.08)" label="éveillé" />
          </div>
        </div>

        <ChartCard title="Heures de sommeil" subtitle="par jour" unit=" h" tone={TONES.indigo} data={sleepSeries} labels={dayLabels} palette={palette} />
        <ChartCard title="Nombre de tétées" subtitle="par jour" unit="" tone={TONES.sand} data={feedSeries} labels={dayLabels} palette={palette} />
        <ChartCard title="Lait tiré" subtitle="par jour" unit=" ml" tone={TONES.rose} data={pumpSeries} labels={dayLabels} palette={palette} />
        {tempSeries.length > 1 && <ChartCard title="Température" subtitle="dernière du jour" unit=" °" tone={TONES.clay} data={tempSeries} labels={dayLabels} minY={36} maxY={38} palette={palette} />}
      </div>
    </div>
  );
}
