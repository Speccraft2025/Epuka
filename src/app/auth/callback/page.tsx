'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { homeFor, useAuth } from '@/contexts/AuthContext';

/**
 * Landing page for the Google / magic-link round trip. The Supabase browser
 * client exchanges the ?code= for a session on load; once AuthContext sees the
 * user and their profile, send them where they belong.
 */
export default function AuthCallbackPage() {
  const { user, loading, role, profileComplete } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const err = params.get('error_description') || hash.get('error_description');
    if (err) setError(err);
  }, []);

  useEffect(() => {
    if (loading || error) return;
    if (user) {
      router.replace(homeFor(role, profileComplete));
      return;
    }
    // Give the code exchange a moment before declaring failure.
    const t = setTimeout(() => setError('Sign-in link is invalid or has expired.'), 8000);
    return () => clearTimeout(t);
  }, [user, loading, role, profileComplete, error, router]);

  if (error) {
    return (
      <div className="loading-screen">
        <p>{error}</p>
        <button className="btn btn-primary" onClick={() => router.replace('/login')}>Try again</button>
      </div>
    );
  }

  return (
    <div className="loading-screen">
      <div className="spinner" />
      <p>Signing you in…</p>
    </div>
  );
}
