"use client";

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AppProvider } from '@/context/AppContext';
import LoginScreen from './LoginScreen';
import BottomNav from './ui/BottomNav';
import { isFirebaseConfigured } from '@/lib/firebase';

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

  useEffect(() => {
    console.log(
      '[Charlie] AuthGate —',
      `Firebase configuré: ${isFirebaseConfigured}`,
      `| Auth loading: ${loading}`,
      `| User: ${user?.email ?? 'non connecté'}`,
    );
  }, [user, loading]);

  if (isFirebaseConfigured && loading) return <Splash />;
  if (isFirebaseConfigured && !user) return <LoginScreen />;

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
