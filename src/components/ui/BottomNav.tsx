"use client";

import React from 'react';
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from '@/context/AppContext';
import { IconHome, IconGrowth, IconEvolution } from './Icons';
import { IconSleep } from './Icons';

const TABS = [
  { href: "/tracker", label: "Tracker", icon: (active: boolean, color: string) => <IconHome size={22} stroke={color} /> },
  { href: "/today", label: "Aujourd'hui", icon: (active: boolean, color: string) => <IconSleep size={22} stroke={color} /> },
  { href: "/growth", label: "Croissance", icon: (active: boolean, color: string) => <IconGrowth size={22} stroke={color} /> },
  { href: "/evolution", label: "Évolution", icon: (active: boolean, color: string) => <IconEvolution size={22} stroke={color} /> },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { palette, state } = useApp();
  const sleeping = !!state.activeSleep;

  const bg = sleeping ? '#1F2238' : palette.surface;
  const border = sleeping ? 'rgba(255,255,255,0.07)' : palette.line;
  const inkActive = sleeping ? '#E8E6F3' : palette.ink;
  const inkInactive = sleeping ? 'rgba(232,230,243,0.35)' : palette.inkSoft;

  return (
    <nav style={{
      background: bg,
      borderTop: `0.5px solid ${border}`,
      display: 'flex',
      alignItems: 'stretch',
      padding: '0 4px',
      paddingBottom: 'env(safe-area-inset-bottom)',
      transition: 'background 300ms ease, border-color 300ms ease',
      flexShrink: 0,
    }}>
      {TABS.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(tab.href + '/');
        const color = active ? inkActive : inkInactive;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              padding: '10px 0 12px',
              textDecoration: 'none',
              color,
              transition: 'color 200ms ease',
            }}
          >
            <div style={{ position: 'relative' }}>
              {tab.icon(active, color)}
              {active && (
                <div style={{
                  position: 'absolute',
                  bottom: -6,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  background: color,
                  opacity: 0.7,
                }} />
              )}
            </div>
            <span style={{
              fontSize: 9.5,
              fontWeight: active ? 700 : 500,
              letterSpacing: '0.02em',
              opacity: active ? 1 : 0.7,
            }}>
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
