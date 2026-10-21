'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { homeFor, useAuth } from '@/contexts/AuthContext';
import shell from '../onboarding/page.module.css';
import styles from './page.module.css';

export default function LoginPage() {
  const { user, loading, role, profileComplete, signInWithGoogle, signInWithEmail } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState<'google' | 'email' | null>(null);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && user) router.replace(homeFor(role, profileComplete));
  }, [user, loading, role, profileComplete, router]);

  const google = async () => {
    setError('');
    setBusy('google');
    try {
      await signInWithGoogle(); // navigates away on success
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Google sign-in failed.');
      setBusy(null);
    }
  };

  const magicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError('');
    setBusy('email');
    try {
      await signInWithEmail(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the sign-in link.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className={shell.wrapper}>
      <div className={`${shell.card} ${styles.card}`}>
        <div className={shell.logo}>epuka</div>
        <h1>Sign in</h1>
        <p className={styles.lede}>Book tests, track your sample and read your doctor-reviewed results.</p>

        <button className={`btn btn-primary btn-lg ${styles.full}`} onClick={google} disabled={busy !== null}>
          {busy === 'google' ? 'Redirecting…' : 'Continue with Google'}
        </button>

        <div className={styles.divider}>or</div>

        <form onSubmit={magicLink}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" className={`btn btn-outline btn-lg ${styles.full}`} style={{ marginTop: 16 }} disabled={busy !== null}>
            {busy === 'email' ? 'Sending…' : 'Email me a sign-in link'}
          </button>
        </form>

        {sent && (
          <p className={styles.note} role="status">
            Check your inbox — we sent a sign-in link to {email}.
          </p>
        )}
        {error && <p className={styles.error} role="alert">{error}</p>}
      </div>
    </div>
  );
}
