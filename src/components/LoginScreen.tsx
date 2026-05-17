"use client";

import React, { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { CharlieAvatar } from './ui/Primitives';

const BG = '#EFEDE8';
const SURFACE = '#FFFFFF';
const INK = '#2A2620';
const INK_SOFT = '#6B6358';
const LINE = '#DAD4C8';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setError(null);
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setError('Email ou mot de passe incorrect.');
      } else if (code === 'auth/too-many-requests') {
        setError('Trop de tentatives. Réessaie dans quelques minutes.');
      } else if (code === 'auth/network-request-failed') {
        setError('Erreur réseau. Vérifie ta connexion.');
      } else {
        setError('Connexion impossible. Réessaie.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      height: '100dvh', background: BG, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '0 28px',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <CharlieAvatar size={72} />
        </div>
        <div className="serif" style={{ fontSize: 44, lineHeight: 1, color: INK, letterSpacing: '-0.01em' }}>
          Charlie
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: INK_SOFT, opacity: 0.7, marginTop: 10 }}>
          Accès réservé
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ background: SURFACE, borderRadius: 18, border: `0.5px solid ${LINE}`, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: `0.5px solid ${LINE}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: INK_SOFT, marginBottom: 6 }}>
              Email
            </div>
            <input
              type="email"
              autoComplete="email"
              autoCapitalize="none"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && passwordRef.current?.focus()}
              placeholder="toi@exemple.com"
              disabled={loading}
              style={{
                width: '100%', fontSize: 16, color: INK, background: 'transparent',
                border: 'none', outline: 'none', fontFamily: 'var(--font-manrope)',
              }}
            />
          </div>
          <div style={{ padding: '14px 18px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: INK_SOFT, marginBottom: 6 }}>
              Mot de passe
            </div>
            <input
              ref={passwordRef}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              style={{
                width: '100%', fontSize: 16, color: INK, background: 'transparent',
                border: 'none', outline: 'none', fontFamily: 'var(--font-manrope)',
              }}
            />
          </div>
        </div>

        {error && (
          <div style={{
            padding: '11px 16px', borderRadius: 12, background: '#F2E0D6',
            color: '#5C3E33', fontSize: 13, fontWeight: 500, lineHeight: 1.4,
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !email || !password}
          style={{
            marginTop: 6, width: '100%', padding: '15px 16px',
            borderRadius: 16, background: loading || !email || !password ? '#C6BFAE' : INK,
            color: '#FAF9F5', fontWeight: 600, fontSize: 15,
            fontFamily: 'var(--font-manrope)',
            transition: 'background 200ms ease',
            cursor: loading || !email || !password ? 'default' : 'pointer',
          }}
        >
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </div>
  );
}
