"use client";

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { TONES, fmtDateFull, ageInDays, TODAY, GROWTH as G_DATA } from '@/lib/sampleData';
import { Segmented, FormHeader, FieldLabel, SubmitBar, Sheet } from './ui/Primitives';
import { LineChart, ChartPoint } from './ui/Charts';
import { IconPlus, IconClose } from './ui/Icons';
import { GrowthPoint } from '@/lib/sampleData';

function GrowthStat({ label, value, unit, delta, palette }: { label: string; value: number; unit: string; delta: number; palette: any }) {
  return (
    <div>
      <div style={{ fontSize: 10.5, color: palette.inkSoft, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</div>
      <div className="num serif" style={{ fontSize: 28, marginTop: 2, fontWeight: 400, color: palette.ink, letterSpacing: '-0.01em' }}>
        {value}<span style={{ fontSize: 13, opacity: 0.5, marginLeft: 2 }}>{unit}</span>
      </div>
      {delta > 0 && <div style={{ fontSize: 10.5, color: '#5A7A4F', fontWeight: 600, marginTop: 2 }}>+{delta.toFixed(unit === 'kg' ? 2 : 1)}{unit} depuis naissance</div>}
    </div>
  );
}

function GrowthChart({ title, unit, data, tone, palette, selectedIndex, onSelectPoint }: {
  title: string; unit: string; data: ChartPoint[]; tone: any; palette: any; selectedIndex: number | null; onSelectPoint: (i: number) => void;
}) {
  if (!data || data.length === 0) return (
    <div style={{ marginBottom: 14, padding: 22, background: palette.surface, borderRadius: 18, border: `0.5px solid ${palette.line}`, textAlign: 'center', color: palette.inkSoft, fontSize: 12.5 }}>
      Pas encore de mesure pour {title.toLowerCase()} sur cette période.
    </div>
  );
  const labels: (string|null)[] = data.map((d, i) => {
    if (i === 0 || i === data.length - 1) return `J${d.x}`;
    if (data.length > 5 && i % 2 !== 0) return null;
    return `J${d.x}`;
  });
  const sel = selectedIndex != null ? data[selectedIndex] : null;
  return (
    <div style={{ marginBottom: 14, padding: 16, background: palette.surface, borderRadius: 18, border: `0.5px solid ${palette.line}` }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: palette.ink, letterSpacing: '-0.005em' }}>{title}</div>
        <div className="num" style={{ fontSize: 11.5, color: palette.inkSoft, fontWeight: 500 }}>{data[0].y} → {data[data.length-1].y}{unit}</div>
      </div>
      <div style={{ height: 38, display: 'flex', alignItems: 'center', gap: 12, padding: sel ? '6px 10px' : '6px 0', background: sel ? tone.soft : 'transparent', borderRadius: 10, marginBottom: 4, transition: 'all 220ms ease' }}>
        {sel ? (
          <>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: tone.ink }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="num" style={{ fontSize: 13, fontWeight: 700, color: tone.ink, letterSpacing: '-0.005em' }}>{sel.y}{unit} · {sel.date ? fmtDateFull(sel.date) : ''}</div>
              <div style={{ fontSize: 11, color: tone.ink, opacity: 0.7, marginTop: 1 }}>Charlie avait {sel.x} jours</div>
            </div>
            <button onClick={() => onSelectPoint(selectedIndex!)} style={{ width: 24, height: 24, borderRadius: 999, color: tone.ink, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.04)' }}>
              <IconClose size={12} />
            </button>
          </>
        ) : (
          <div style={{ fontSize: 11.5, color: palette.inkSoft, opacity: 0.65, fontStyle: 'italic', paddingLeft: 4 }}>Touchez un point pour voir la mesure</div>
        )}
      </div>
      <LineChart series={data} width={328} height={150} tone={tone} unit={unit} xLabels={labels} selectedIndex={selectedIndex} onSelectPoint={onSelectPoint} />
    </div>
  );
}

function GrowthForm({ onSubmit, last }: { onSubmit: (d: any) => void; last: GrowthPoint }) {
  const [poids, setPoids] = useState(last.poids);
  const [taille, setTaille] = useState(last.taille);
  const [pc, setPc] = useState(last.pc);
  const fields = [
    { l: 'Poids', v: poids, set: setPoids, step: 0.05, min: 1, max: 20, unit: 'kg' },
    { l: 'Taille', v: taille, set: setTaille, step: 0.5, min: 30, max: 120, unit: 'cm' },
    { l: 'Périmètre crânien', v: pc, set: setPc, step: 0.1, min: 25, max: 60, unit: 'cm' },
  ];
  return (
    <div>
      <FormHeader title="Nouvelle mesure" />
      <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {fields.map(f => (
          <div key={f.l} style={{ padding: 14, background: '#fff', borderRadius: 14, border: '1px solid rgba(0,0,0,0.06)' }}>
            <FieldLabel>{f.l}</FieldLabel>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={() => f.set(+(f.v - f.step).toFixed(2))} style={{ width: 36, height: 36, borderRadius: 999, background: 'rgba(0,0,0,0.05)', fontSize: 18 }}>−</button>
              <div className="num serif" style={{ flex: 1, textAlign: 'center', fontSize: 36 }}>{f.v.toFixed(f.step < 0.1 ? 2 : 1)} <span style={{ fontSize: 16, opacity: 0.5 }}>{f.unit}</span></div>
              <button onClick={() => f.set(+(f.v + f.step).toFixed(2))} style={{ width: 36, height: 36, borderRadius: 999, background: 'rgba(0,0,0,0.05)', fontSize: 18 }}>+</button>
            </div>
          </div>
        ))}
      </div>
      <SubmitBar onClick={() => onSubmit({ poids, taille, pc, date: new Date(TODAY) })} />
    </div>
  );
}

export default function GrowthScreen() {
  const { state, dispatch, palette } = useApp();
  const growth = state.growth;
  const last = growth[growth.length - 1];
  const first = growth[0];
  const [range, setRange] = useState('total');
  const [selected, setSelected] = useState<{ poids: number|null; taille: number|null; pc: number|null; pump: number|null }>({ poids: null, taille: null, pc: null, pump: null });
  const [sheetOpen, setSheetOpen] = useState(false);

  const cutoffDay = range === '7j' ? ageInDays(TODAY) - 7 : range === '14j' ? ageInDays(TODAY) - 14 : -1;
  const filterByRange = (arr: ChartPoint[]) => arr.filter(p => p.x >= cutoffDay);

  const poidsData = filterByRange(growth.map(g => ({ x: g.day, y: g.poids, date: g.date })));
  const tailleData = filterByRange(growth.map(g => ({ x: g.day, y: g.taille, date: g.date })));
  const pcData = filterByRange(growth.map(g => ({ x: g.day, y: g.pc, date: g.date })));

  const pumpByDay = useMemo(() => {
    return Object.entries(state.history).map(([k, evs]) => {
      const total = evs.filter(e => e.type === 'pump').reduce((s, e) => s + (e.data?.ml || 0), 0);
      const d = new Date(k);
      return { x: ageInDays(d), y: total, date: d };
    }).filter(p => p.y > 0).sort((a, b) => a.x - b.x);
  }, [state.history]);
  const pumpData = filterByRange(pumpByDay);

  if (!last || !first) return <div style={{ padding: 40, textAlign: 'center', color: palette.inkSoft }}>Aucune mesure</div>;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: palette.bg }}>
      <div style={{ padding: '60px 22px 12px' }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: palette.inkSoft, opacity: 0.7 }}>Croissance</div>
        <div className="serif" style={{ fontSize: 30, lineHeight: 1.15, marginTop: 4 }}>Suivre l&apos;évolution</div>
        <div style={{ marginTop: 14 }}>
          <Segmented value={range} onChange={(v) => { setRange(v); setSelected({ poids: null, taille: null, pc: null, pump: null }); }}
            options={[{ value: '7j', label: '7 j' }, { value: '14j', label: '14 j' }, { value: 'total', label: 'Total' }]} />
        </div>
      </div>

      <div className="scroll" style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 110px' }}>
        <div style={{ padding: '18px 18px 16px', borderRadius: 20, background: palette.surface, border: `0.5px solid ${palette.line}`, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: palette.inkSoft, opacity: 0.65 }}>Dernière mesure</div>
            <div className="num" style={{ fontSize: 11.5, color: palette.inkSoft }}>il y a {ageInDays(TODAY) - last.day} j</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginTop: 14 }}>
            <GrowthStat label="Poids" value={last.poids} unit="kg" delta={last.poids - first.poids} palette={palette} />
            <GrowthStat label="Taille" value={last.taille} unit="cm" delta={last.taille - first.taille} palette={palette} />
            <GrowthStat label="P.C." value={last.pc} unit="cm" delta={last.pc - first.pc} palette={palette} />
          </div>
        </div>

        <button onClick={() => setSheetOpen(true)} style={{ width: '100%', padding: '14px 16px', borderRadius: 16, background: palette.ink, color: '#FAF9F5', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 18 }}>
          <IconPlus size={16} stroke="#FAF9F5" /> Encoder une mesure
        </button>

        <GrowthChart title="Poids" unit=" kg" data={poidsData} tone={TONES.sand} palette={palette} selectedIndex={selected.poids} onSelectPoint={(i) => setSelected(s => ({ ...s, poids: s.poids === i ? null : i }))} />
        <GrowthChart title="Taille" unit=" cm" data={tailleData} tone={TONES.olive} palette={palette} selectedIndex={selected.taille} onSelectPoint={(i) => setSelected(s => ({ ...s, taille: s.taille === i ? null : i }))} />
        <GrowthChart title="Périmètre crânien" unit=" cm" data={pcData} tone={TONES.sky} palette={palette} selectedIndex={selected.pc} onSelectPoint={(i) => setSelected(s => ({ ...s, pc: s.pc === i ? null : i }))} />
        {pumpData.length > 0 && <GrowthChart title="Lait tiré" unit=" ml" data={pumpData} tone={TONES.rose} palette={palette} selectedIndex={selected.pump} onSelectPoint={(i) => setSelected(s => ({ ...s, pump: s.pump === i ? null : i }))} />}
      </div>

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
        <GrowthForm last={last} onSubmit={(d) => { dispatch({ type: 'ADD_GROWTH', data: d }); setSheetOpen(false); }} />
      </Sheet>
    </div>
  );
}
