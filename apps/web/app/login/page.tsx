'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Globe, UserX, ChevronRight, Droplets } from 'lucide-react';
import { signInWithEmail, signInWithGoogle, signInAsGuest } from '@/lib/auth';
import { isFirstTimeUser } from '@/lib/storage';
import { useRouter } from 'next/navigation';

type Mode = 'idle' | 'email' | 'loading' | 'sent';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('idle');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleEmail = async () => {
    if (!email.trim()) return;
    setMode('loading');
    setError(null);
    const { error: err } = await signInWithEmail(email.trim());
    if (err) {
      setError(err);
      setMode('email');
    } else {
      setMode('sent');
    }
  };

  const handleGoogle = async () => {
    setMode('loading');
    setError(null);
    const { error: err } = await signInWithGoogle();
    if (err) {
      setError(err);
      setMode('idle');
    }
    // Google OAuth redirects, so we don't need to do anything on success
  };

  const handleGuest = async () => {
    setMode('loading');
    setError(null);
    const { error: err } = await signInAsGuest();
    if (err) {
      setError(err);
      setMode('idle');
    } else {
      sessionStorage.setItem('guestActive', '1');
      router.replace(isFirstTimeUser() ? '/onboarding' : '/hydration');
    }
  };

  return (
    <div
      className="flex flex-col h-svh max-w-[480px] mx-auto px-6"
      style={{ background: '#0f172a' }}
    >
      {/* Logo + headline */}
      <div className="flex flex-col items-center pt-20 pb-12">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
          style={{ background: 'rgba(0,150,255,0.12)', border: '1.5px solid rgba(0,150,255,0.3)' }}
        >
          <Droplets size={32} color="#0096FF" strokeWidth={1.75} />
        </div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#f1f5f9' }}>
          strHONG
        </h1>
        <p className="text-sm text-center" style={{ color: '#64748b' }}>
          Track your hydration. Hit your goals.
        </p>
      </div>

      {/* Auth options */}
      <div className="flex flex-col gap-3">
        <AnimatePresence mode="wait">
          {mode === 'sent' ? (
            <motion.div
              key="sent"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl px-5 py-6 text-center"
              style={{ background: 'rgba(0,150,255,0.08)', border: '1.5px solid rgba(0,150,255,0.25)' }}
            >
              <p className="text-base font-semibold mb-1" style={{ color: '#f1f5f9' }}>
                Check your inbox
              </p>
              <p className="text-sm" style={{ color: '#64748b' }}>
                Magic link sent to{' '}
                <span style={{ color: '#0096FF' }}>{email}</span>
              </p>
            </motion.div>
          ) : mode === 'email' ? (
            <motion.div
              key="emailForm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-3"
            >
              <div
                className="flex items-center rounded-xl px-4 gap-2"
                style={{
                  background: '#1e293b',
                  border: `1px solid ${email ? '#0096FF' : '#263347'}`,
                }}
              >
                <Mail size={18} color="#475569" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleEmail()}
                  placeholder="you@example.com"
                  autoFocus
                  className="flex-1 py-4 bg-transparent text-base outline-none"
                  style={{ color: '#f1f5f9' }}
                  inputMode="email"
                  autoComplete="email"
                />
              </div>

              {error && (
                <p className="text-sm px-1" style={{ color: '#ef4444' }}>
                  {error}
                </p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => { setMode('idle'); setError(null); }}
                  className="px-5 py-4 rounded-2xl text-sm font-medium"
                  style={{ background: '#1e293b', color: '#64748b' }}
                >
                  Back
                </button>
                <motion.button
                  onClick={handleEmail}
                  whileTap={{ scale: 0.97 }}
                  disabled={!email.trim()}
                  className="flex-1 py-4 rounded-2xl font-semibold flex items-center justify-center gap-2"
                  style={{
                    background: email.trim() ? '#0096FF' : '#1e293b',
                    color: email.trim() ? 'white' : '#475569',
                  }}
                >
                  Send magic link
                  <ChevronRight size={18} strokeWidth={2} />
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="options"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-3"
            >
              {/* Google */}
              <motion.button
                onClick={handleGoogle}
                whileTap={{ scale: 0.97 }}
                disabled={mode === 'loading'}
                className="w-full py-4 rounded-2xl font-semibold flex items-center justify-center gap-3"
                style={{ background: '#1e293b', color: '#f1f5f9' }}
              >
                <Globe size={20} strokeWidth={1.75} />
                Continue with Google
              </motion.button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px" style={{ background: '#1e293b' }} />
                <span className="text-xs" style={{ color: '#334155' }}>or</span>
                <div className="flex-1 h-px" style={{ background: '#1e293b' }} />
              </div>

              {/* Email */}
              <motion.button
                onClick={() => setMode('email')}
                whileTap={{ scale: 0.97 }}
                disabled={mode === 'loading'}
                className="w-full py-4 rounded-2xl font-semibold flex items-center justify-center gap-3"
                style={{
                  background: '#1e293b',
                  color: '#f1f5f9',
                  border: '1px solid #263347',
                }}
              >
                <Mail size={20} strokeWidth={1.75} />
                Continue with Email
              </motion.button>

              {error && (
                <p className="text-sm px-1 text-center" style={{ color: '#ef4444' }}>
                  {error}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Guest / loading states */}
        {mode !== 'sent' && mode !== 'email' && (
          <motion.button
            onClick={handleGuest}
            whileTap={{ scale: 0.97 }}
            disabled={mode === 'loading'}
            className="w-full py-4 rounded-2xl font-medium flex items-center justify-center gap-2 mt-1"
            style={{ color: '#475569' }}
          >
            {mode === 'loading' ? (
              <div className="h-5 w-5 rounded-full border-2 border-[#475569] border-t-transparent animate-spin" />
            ) : (
              <>
                <UserX size={18} strokeWidth={1.75} />
                Continue as guest
              </>
            )}
          </motion.button>
        )}
      </div>

      {/* Footer note */}
      <p className="mt-auto pb-10 text-xs text-center" style={{ color: '#334155' }}>
        By continuing, you agree to our Terms &amp; Privacy Policy.
      </p>
    </div>
  );
}
