"use client";

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { AppProvider } from '@/context/AppContext';
import LoginScreen from './LoginScreen';
import BottomNav from './ui/BottomNav';

const IS_FIREBASE = !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

function Splash() {
  return (
    <div style={{
      height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#EFEDE8',
    }}>
      <div className="serif" style={{ fontSize: 44, color: '#2A2620', opacity: 0.4 }}>Charlie</div>
    </div>
  );
}

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (IS_FIREBASE && loading) return <Splash />;
  if (IS_FIREBASE && !user) return <LoginScreen />;

  return (
    <AppProvider>
      <div style={{
        maxWidth: 430, margin: '0 auto', height: '100dvh',
        display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden',
      }}>
        <main style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {children}
        </main>
        <BottomNav />
      </div>
    </AppProvider>
  );
}
