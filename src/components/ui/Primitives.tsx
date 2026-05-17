"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Palette } from '@/context/AppContext';
import { TONES, Tone } from '@/lib/sampleData';
import { IconMoonFilled, IconStop } from './Icons';
import { fmtTime, fmtDur } from '@/lib/sampleData';

// ─── Comparison chip ──────────────────────────────────────────────────────────
export function ComparisonChip({ delta, unit = '', invert = false }: { delta: number|null; unit?: string; invert?: boolean }) {
  if (delta == null || delta === 0 || !isFinite(delta)) {
    return <span style={{ fontSize: 10.5, color: 'rgba(0,0,0,0.4)', fontWeight: 500, letterSpacing: 0 }}>= hier</span>;
  }
  const up = delta > 0;
  const positive = invert ? !up : up;
  const color = positive ? '#5A7A4F' : '#9A6B5D';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 10.5, color, fontWeight: 600, letterSpacing: 0 }}>
      <span style={{ fontSize: 11, lineHeight: 1 }}>{up ? '↑' : '↓'}</span>
      <span className="num">{Math.abs(delta)}{unit}</span>
      <span style={{ color: 'rgba(0,0,0,0.35)', fontWeight: 500 }}>vs hier</span>
    </span>
  );
}

// ─── Segmented control ────────────────────────────────────────────────────────
export function Segmented({ value, options, onChange, dense = false }: {
  value: string;
  options: Array<string | { value: string; label: string }>;
  onChange: (v: string) => void;
  dense?: boolean;
}) {
  return (
    <div style={{ display: 'inline-flex', padding: 3, background: 'rgba(0,0,0,0.05)', borderRadius: 999, gap: 0 }}>
      {options.map(opt => {
        const v = typeof opt === 'string' ? opt : opt.value;
        const l = typeof opt === 'string' ? opt : opt.label;
        const active = v === value;
        return (
          <button key={v} onClick={() => onChange(v)} style={{
            padding: dense ? '5px 11px' : '7px 14px', borderRadius: 999,
            fontSize: dense ? 12 : 13, fontWeight: 600,
            background: active ? '#fff' : 'transparent',
            color: active ? '#2A2620' : 'rgba(42,38,32,0.55)',
            boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08), 0 0.5px 0 rgba(0,0,0,0.04)' : 'none',
            transition: 'all 180ms ease', letterSpacing: '-0.005em',
          }}>{l}</button>
        );
      })}
    </div>
  );
}

// ─── Bottom Sheet ─────────────────────────────────────────────────────────────
export function Sheet({ open, onClose, children, height = 'auto', dark = false }: {
  open: boolean; onClose: () => void; children: React.ReactNode; height?: string | number; dark?: boolean;
}) {
  const [mounted, setMounted] = useState(open);
  useEffect(() => {
    if (open) setMounted(true);
    else { const t = setTimeout(() => setMounted(false), 240); return () => clearTimeout(t); }
  }, [open]);
  if (!mounted) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 60, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', pointerEvents: open ? 'auto' : 'none' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: dark ? 'rgba(0,0,0,0.5)' : 'rgba(20,18,15,0.32)', opacity: open ? 1 : 0, transition: 'opacity 240ms ease', backdropFilter: 'blur(2px)' }} />
      <div style={{
        position: 'relative', background: dark ? '#1A1F2E' : '#FAF9F5',
        color: dark ? '#F0EEE7' : '#2A2620',
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        boxShadow: '0 -10px 40px rgba(0,0,0,0.18)', height, maxHeight: '88%',
        transform: open ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 280ms cubic-bezier(0.32, 0.72, 0.25, 1)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: dark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.18)' }} />
        </div>
        <div style={{ overflow: 'auto', flex: 1 }} className="scroll">{children}</div>
      </div>
    </div>
  );
}

// ─── Sleep Overlay ────────────────────────────────────────────────────────────
export function StarField({ count = 80, seed = 1 }: { count?: number; seed?: number }) {
  const stars = useMemo(() => {
    let s = seed;
    const r = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    return Array.from({ length: count }, (_, i) => ({
      id: i, x: r() * 100, y: r() * 100, size: 0.6 + r() * 2.2,
      dur: 2 + r() * 4, delay: r() * 4, bright: r() > 0.7,
    }));
  }, [count, seed]);
  return (
    <>
      {stars.map(s => (
        <div key={s.id} style={{
          position: 'absolute', left: `${s.x}%`, top: `${s.y}%`,
          width: s.size, height: s.size, borderRadius: '50%',
          background: s.bright ? '#FFF8E0' : '#E8EAFF',
          boxShadow: s.bright ? '0 0 6px rgba(255,248,224,0.6)' : '0 0 3px rgba(232,234,255,0.4)',
          animation: `twinkle ${s.dur}s ease-in-out infinite`, animationDelay: `${s.delay}s`,
        }} />
      ))}
    </>
  );
}

export function FloatingMoon({ size = 92, top = '14%', left = '62%' }: { size?: number; top?: string; left?: string }) {
  return (
    <div style={{
      position: 'absolute', left, top, width: size, height: size, borderRadius: '50%',
      background: 'radial-gradient(circle at 35% 35%, #FFF6D8 0%, #F5E4B8 40%, #D8C490 100%)',
      animation: 'moonglow 5s ease-in-out infinite, breathe 8s ease-in-out infinite',
    }}>
      <div style={{ position: 'absolute', top: '32%', left: '42%', width: 12, height: 12, borderRadius: '50%', background: 'rgba(180,160,110,0.25)' }} />
      <div style={{ position: 'absolute', top: '55%', left: '28%', width: 8, height: 8, borderRadius: '50%', background: 'rgba(180,160,110,0.22)' }} />
      <div style={{ position: 'absolute', top: '20%', left: '60%', width: 6, height: 6, borderRadius: '50%', background: 'rgba(180,160,110,0.2)' }} />
    </div>
  );
}

export function SleepOverlay({ active, intensity = 'immersive', startTime, onStop }: {
  active: boolean; intensity?: 'subtle' | 'marked' | 'immersive'; startTime?: Date; onStop: () => void;
}) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    if (!active) return;
    const i = setInterval(() => setNow(n => new Date(n.getTime() + 60000)), 1500);
    return () => clearInterval(i);
  }, [active]);
  const elapsed = startTime ? Math.max(1, Math.round((now.getTime() - startTime.getTime()) / 60000)) : 0;

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: intensity === 'immersive'
        ? 'radial-gradient(ellipse at 60% 20%, #2B2F4A 0%, #1A1F2E 50%, #0F1320 100%)'
        : 'linear-gradient(180deg, #2A2E47 0%, #181B2A 100%)',
      overflow: 'hidden', color: '#F0EEE7', animation: 'fadeIn 400ms ease',
    }}>
      {intensity === 'immersive' && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 20% 70%, rgba(140,180,220,0.18) 0%, transparent 50%), radial-gradient(ellipse at 80% 90%, rgba(180,140,200,0.14) 0%, transparent 55%)',
          pointerEvents: 'none',
        }} />
      )}
      <StarField count={intensity === 'immersive' ? 90 : 50} />
      <FloatingMoon size={intensity === 'immersive' ? 96 : 70} top={intensity === 'immersive' ? '12%' : '15%'} left={intensity === 'immersive' ? '62%' : '68%'} />
      <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', padding: '90px 28px 40px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(240,238,231,0.5)' }}>
          Sommeil en cours
        </div>
        <div className="serif" style={{ fontSize: 56, lineHeight: 1, marginTop: 14, color: '#F8F5E8', fontWeight: 400 }}>
          Charlie dort
        </div>
        <div style={{ marginTop: 12, fontSize: 14, color: 'rgba(240,238,231,0.6)' }}>
          depuis <span className="num" style={{ color: '#F8F5E8', fontWeight: 600 }}>{startTime ? fmtTime(startTime) : '—'}</span>
        </div>
        <div style={{ marginTop: 48 }}>
          <div className="num serif" style={{ fontSize: 88, lineHeight: 1, color: '#FFF6D8', fontWeight: 400, textShadow: '0 0 30px rgba(255,238,200,0.25)' }}>
            {fmtDur(elapsed)}
          </div>
          <div style={{ marginTop: 8, fontSize: 13, color: 'rgba(240,238,231,0.55)' }}>écoulé</div>
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={onStop} style={{
          marginTop: 32, padding: '18px 24px', borderRadius: 20,
          background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)',
          border: '0.5px solid rgba(255,255,255,0.18)',
          color: '#F0EEE7', fontSize: 15, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}>
          <IconStop size={16} />
          Réveil de Charlie
        </button>
        <div style={{ marginTop: 14, fontSize: 11, textAlign: 'center', color: 'rgba(240,238,231,0.35)' }}>
          appuyez quand Charlie se réveille
        </div>
      </div>
    </div>
  );
}

// ─── Sleeping pill (for non-tracker tabs) ─────────────────────────────────────
export function SleepingPill({ startTime, onTap }: { startTime: Date; onTap: () => void }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const i = setInterval(() => setNow(n => new Date(n.getTime() + 60000)), 1500);
    return () => clearInterval(i);
  }, []);
  const elapsed = Math.max(1, Math.round((now.getTime() - startTime.getTime()) / 60000));
  return (
    <button onClick={onTap} style={{
      position: 'absolute', top: 56, right: 16, zIndex: 65,
      display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px 8px 11px', borderRadius: 999,
      background: '#2A2E47', color: '#F0EEE7', fontSize: 12, fontWeight: 600, letterSpacing: '-0.005em',
      boxShadow: '0 8px 22px rgba(20,20,40,0.32), 0 0 0 0.5px rgba(255,255,255,0.06) inset',
      animation: 'fadeIn 320ms ease',
    }}>
      <span style={{ display: 'grid', placeItems: 'center', width: 18, height: 18, borderRadius: 999, background: 'rgba(255,246,216,0.18)', color: '#FFF6D8', animation: 'breathe 3s ease-in-out infinite' }}>
        <IconMoonFilled size={11} />
      </span>
      <span>Charlie dort</span>
      <span className="num" style={{ opacity: 0.65, fontWeight: 500 }}>· {fmtDur(elapsed)}</span>
    </button>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, style = {}, onClick }: { children: React.ReactNode; style?: React.CSSProperties; onClick?: () => void }) {
  return (
    <div onClick={onClick} style={{
      background: '#FFFFFF', borderRadius: 18,
      border: '0.5px solid rgba(0,0,0,0.05)',
      boxShadow: '0 1px 0 rgba(255,255,255,0.7) inset, 0 1px 3px rgba(40,38,32,0.04)',
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─── Charlie avatar ───────────────────────────────────────────────────────────
export function CharlieAvatar({ size = 44 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `linear-gradient(135deg, ${TONES.sand.bg} 0%, ${TONES.clay.bg} 100%)`,
      display: 'grid', placeItems: 'center',
      color: TONES.clay.ink, fontWeight: 700, fontSize: size * 0.36,
      letterSpacing: '-0.01em',
      boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.5), 0 1px 3px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.04)',
      fontFamily: 'var(--font-instrument-serif), serif',
      flexShrink: 0,
    }}>
      C
    </div>
  );
}

// ─── Stepper ──────────────────────────────────────────────────────────────────
export function Stepper({ value, onChange, min = 0, max = 999, step = 1, unit = '' }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; unit?: string;
}) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 0, background: 'rgba(0,0,0,0.05)', borderRadius: 999, padding: 3 }}>
      <button onClick={() => onChange(Math.max(min, value - step))} style={{ width: 32, height: 32, borderRadius: 999, background: '#fff', display: 'grid', placeItems: 'center', fontSize: 18, fontWeight: 500, color: '#2A2620', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>−</button>
      <span className="num" style={{ minWidth: 56, textAlign: 'center', fontSize: 16, fontWeight: 600 }}>{value}{unit}</span>
      <button onClick={() => onChange(Math.min(max, value + step))} style={{ width: 32, height: 32, borderRadius: 999, background: '#fff', display: 'grid', placeItems: 'center', fontSize: 18, fontWeight: 500, color: '#2A2620', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>+</button>
    </div>
  );
}

// ─── Form helpers ─────────────────────────────────────────────────────────────
export function FormHeader({ title }: { title: string }) {
  return (
    <div style={{ padding: '10px 24px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div className="serif" style={{ fontSize: 28, lineHeight: 1.15 }}>{title}</div>
    </div>
  );
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(42,38,32,0.55)', marginBottom: 8 }}>{children}</div>;
}

export function SubmitBar({ label = 'Enregistrer', onClick, onDelete }: { label?: string; onClick: () => void; onDelete?: () => void }) {
  return (
    <div style={{ padding: '14px 24px 30px', display: 'flex', gap: 10, borderTop: '0.5px solid rgba(0,0,0,0.06)', marginTop: 10, background: '#FAF9F5' }}>
      {onDelete && (
        <button onClick={onDelete} style={{ padding: '14px 18px', borderRadius: 16, background: 'rgba(154,107,93,0.1)', color: '#7A4D3F', fontWeight: 600, fontSize: 14 }}>Supprimer</button>
      )}
      <button onClick={onClick} style={{ flex: 1, padding: '15px 18px', borderRadius: 16, background: '#2A2620', color: '#FAF9F5', fontWeight: 600, fontSize: 15, letterSpacing: '-0.005em' }}>{label}</button>
    </div>
  );
}

export function TimeField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <IconClock size={16} stroke="rgba(0,0,0,0.5)" />
      <input type="time" value={value} onChange={(e) => onChange(e.target.value)} style={{
        background: 'rgba(0,0,0,0.04)', border: 'none', padding: '8px 12px',
        borderRadius: 10, fontSize: 14, fontWeight: 600, letterSpacing: '-0.005em', fontFamily: 'inherit',
      }} />
    </div>
  );
}

import { IconClock } from './Icons';
