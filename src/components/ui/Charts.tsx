"use client";

import React from 'react';
import { Tone } from '@/lib/sampleData';

// ─── Sparkline ────────────────────────────────────────────────────────────────
export function Sparkline({ data, w = 60, h = 18, color = '#928974', strokeW = 1.5 }: {
  data: number[]; w?: number; h?: number; color?: string; strokeW?: number;
}) {
  if (!data || data.length === 0) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = w / (data.length - 1 || 1);
  const pts = data.map((v, i) => [i * stepX, h - ((v - min) / range) * (h - 4) - 2] as [number, number]);
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <path d={path} fill="none" stroke={color} strokeWidth={strokeW} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r={2} fill={color} />
    </svg>
  );
}

// ─── Smooth line chart ────────────────────────────────────────────────────────
function smoothPath(pts: [number, number][]): string {
  if (pts.length < 2) return '';
  let p = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i-1];
    const [x1, y1] = pts[i];
    const cx = (x0 + x1) / 2;
    p += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
  }
  return p;
}

export interface ChartPoint { x: number; y: number; date?: Date }

export function LineChart({
  series, width = 320, height = 160,
  padding = { t: 20, r: 16, b: 28, l: 36 },
  yTicks = 4, xLabels = null, color = '#928744', fillOpacity = 0.12,
  unit = '', minY = null, maxY = null, showDots = true, tone,
  selectedIndex = null, onSelectPoint = null,
}: {
  series: ChartPoint[];
  width?: number; height?: number;
  padding?: { t: number; r: number; b: number; l: number };
  yTicks?: number; xLabels?: (string|null)[] | null;
  color?: string; fillOpacity?: number; unit?: string;
  minY?: number | null; maxY?: number | null;
  showDots?: boolean; tone?: Tone;
  selectedIndex?: number | null;
  onSelectPoint?: ((i: number) => void) | null;
}) {
  const data = series || [];
  if (!data.length) return <div style={{ height, display: 'grid', placeItems: 'center', color: 'rgba(0,0,0,0.4)', fontSize: 12 }}>Pas de données</div>;

  const w = width - padding.l - padding.r;
  const h = height - padding.t - padding.b;
  const ys = data.map(d => d.y);
  const yMin = minY != null ? minY : Math.min(...ys);
  const yMaxRaw = maxY != null ? maxY : Math.max(...ys);
  const yMax = yMaxRaw === yMin ? yMin + 1 : yMaxRaw;
  const stepX = data.length > 1 ? w / (data.length - 1) : w;
  const pts: [number, number][] = data.map((d, i) => [
    padding.l + i * stepX,
    padding.t + h - ((d.y - yMin) / (yMax - yMin)) * h,
  ]);
  const path = smoothPath(pts);
  const area = `${path} L ${pts[pts.length-1][0]} ${padding.t + h} L ${pts[0][0]} ${padding.t + h} Z`;
  const lineColor = tone ? tone.ink : color;
  const fillColor = tone ? tone.bg : color;

  const ticks: { v: number; y: number }[] = [];
  for (let i = 0; i <= yTicks; i++) {
    const v = yMin + (yMax - yMin) * (i / yTicks);
    const y = padding.t + h - (i / yTicks) * h;
    ticks.push({ v, y });
  }

  return (
    <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }}>
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={padding.l} y1={t.y} x2={width - padding.r} y2={t.y} stroke="rgba(0,0,0,0.06)" strokeWidth={0.6} strokeDasharray={i === 0 ? '0' : '2 3'} />
          <text x={padding.l - 8} y={t.y + 3} textAnchor="end" fontSize="9.5" fontFamily="Manrope" fontWeight="500" fill="rgba(0,0,0,0.4)">{t.v.toFixed(t.v % 1 === 0 ? 0 : 1)}{unit}</text>
        </g>
      ))}
      <path d={area} fill={fillColor} fillOpacity={fillOpacity} />
      <path d={path} fill="none" stroke={lineColor} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      {selectedIndex != null && pts[selectedIndex] && (
        <line x1={pts[selectedIndex][0]} y1={padding.t} x2={pts[selectedIndex][0]} y2={padding.t + h} stroke={lineColor} strokeWidth={0.8} strokeDasharray="3 2" opacity={0.5} />
      )}
      {showDots && pts.map(([x, y], i) => {
        const isSelected = i === selectedIndex;
        const isLast = i === pts.length - 1;
        const r = isSelected ? 5 : (isLast ? 3.5 : 2.2);
        return (
          <g key={i}>
            {onSelectPoint && <circle cx={x} cy={y} r={14} fill="transparent" style={{ cursor: 'pointer' }} onClick={() => onSelectPoint(i)} />}
            <circle cx={x} cy={y} r={r} fill={isSelected ? lineColor : '#fff'} stroke={lineColor} strokeWidth={isSelected ? 2 : 1.5} style={{ pointerEvents: 'none' }} />
          </g>
        );
      })}
      {xLabels && xLabels.map((l, i) => l ? (
        <text key={i} x={pts[i] ? pts[i][0] : padding.l + i * stepX} y={height - padding.b + 14}
              textAnchor="middle" fontSize="9.5" fontFamily="Manrope" fontWeight="500" fill="rgba(0,0,0,0.5)">{l}</text>
      ) : null)}
    </svg>
  );
}

// ─── Bar stack (hourly heatmap) ───────────────────────────────────────────────
export function BarStack({ data, width = 320, height = 140, padding = { t: 14, r: 8, b: 22, l: 28 },
  colors = { sleep: '#A4A2B8', feed: '#C9B58A', wake: 'rgba(0,0,0,0.06)' }, labels = null,
}: {
  data: { sleep?: number; feed?: number; awake?: number }[];
  width?: number; height?: number;
  padding?: { t: number; r: number; b: number; l: number };
  colors?: { sleep: string; feed: string; wake: string };
  labels?: (string|null)[] | null;
}) {
  const w = width - padding.l - padding.r;
  const h = height - padding.t - padding.b;
  const barW = w / data.length * 0.78;
  const step = w / data.length;
  return (
    <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }}>
      <line x1={padding.l} y1={padding.t + h} x2={width - padding.r} y2={padding.t + h} stroke="rgba(0,0,0,0.1)" strokeWidth={0.6} />
      {data.map((d, i) => {
        const x = padding.l + i * step + (step - barW) / 2;
        const sH = (d.sleep || 0) * h;
        const fH = (d.feed || 0) * h;
        const aH = (d.awake || 0) * h;
        let y = padding.t + h;
        return (
          <g key={i}>
            {sH > 0 && <rect x={x} y={(y -= sH)} width={barW} height={sH} fill={colors.sleep} rx={1.5} />}
            {fH > 0 && <rect x={x} y={(y -= fH)} width={barW} height={fH} fill={colors.feed} rx={1.5} />}
            {aH > 0 && <rect x={x} y={(y -= aH)} width={barW} height={aH} fill={colors.wake} rx={1.5} />}
            {labels && labels[i] != null && <text x={x + barW/2} y={padding.t + h + 13} textAnchor="middle" fontSize="9" fontFamily="Manrope" fontWeight="500" fill="rgba(0,0,0,0.45)">{labels[i]}</text>}
          </g>
        );
      })}
    </svg>
  );
}
