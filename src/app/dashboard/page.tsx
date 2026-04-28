'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserBookings, getUserProfile, getUserResults } from '@/lib/firestore';
import { Booking, Result, UserProfile } from '@/lib/types';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

function getBmiCategory(bmi: number) {
  if (bmi < 18.5) return { label: 'Underweight', color: 'var(--clr-info)' };
  if (bmi < 25) return { label: 'Healthy', color: 'var(--clr-green)' };
  if (bmi < 30) return { label: 'Overweight', color: 'var(--clr-warning)' };
  return { label: 'Obese', color: 'var(--clr-danger)' };
}

const STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
  pending:   { label: 'Pending',   badge: 'badge-yellow' },
  confirmed: { label: 'Confirmed', badge: 'badge-blue' },
  completed: { label: 'Completed', badge: 'badge-green' },
};

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [p, b, r] = await Promise.all([
        getUserProfile(user.uid),
        getUserBookings(user.uid),
        getUserResults(user.uid),
      ]);
      setProfile(p);
      setBookings(b);
      setResults(r);
      setFetching(false);
    })();
  }, [user]);

  if (loading || fetching) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading your health dashboard…</p>
      </div>
    );
  }

  const bmi = profile?.profile?.height && profile?.profile?.weight
    ? parseFloat((profile.profile.weight / Math.pow(profile.profile.height / 100, 2)).toFixed(1))
    : null;
  const bmiCat = bmi ? getBmiCategory(bmi) : null;
  const latestBooking = bookings[0] || null;
  const latestResult = results[0] || null;

  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <div className="container">
          {/* Header */}
          <div className={styles.header}>
            <div>
              <h1>Your Health Dashboard</h1>
              <p>Welcome back, {user?.displayName?.split(' ')[0]}. Here&apos;s your health snapshot.</p>
            </div>
            <Link href="/tests" className="btn btn-primary">+ Book a Test</Link>
          </div>

          {/* Health Overview */}
          <div className={styles.statsGrid}>
            <div className={styles.bmiCard}>
              <div className="stat-label">Body Mass Index</div>
              {bmi ? (
                <>
                  <div className="stat-value" style={{ color: bmiCat?.color }}>{bmi}</div>
                  <span className="badge badge-green" style={{ background: 'transparent', color: bmiCat?.color, border: `1px solid ${bmiCat?.color}33` }}>
                    {bmiCat?.label}
                  </span>
                  <div className="stat-sub" style={{ marginTop: 4 }}>
                    {profile?.profile?.height}cm · {profile?.profile?.weight}kg
                  </div>
                </>
              ) : (
                <p style={{ fontSize: '0.85rem' }}>Complete your profile to see BMI.</p>
              )}
            </div>

            <div className="stat-card">
              <div className="stat-label">Total Tests Booked</div>
              <div className="stat-value">{bookings.length}</div>
              <div className="stat-sub">{bookings.filter(b => b.status === 'completed').length} completed</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Results Ready</div>
              <div className="stat-value">{results.filter(r => r.status === 'reviewed').length}</div>
              <div className="stat-sub">of {results.length} total results</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Latest Test</div>
              {latestBooking ? (
                <>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--clr-text)', marginTop: 4 }}>{latestBooking.testName}</div>
                  <span className={`badge ${STATUS_CONFIG[latestBooking.status]?.badge}`}>
                    {STATUS_CONFIG[latestBooking.status]?.label}
                  </span>
                </>
              ) : (
                <p style={{ fontSize: '0.85rem' }}>No tests yet.</p>
              )}
            </div>
          </div>

          {/* My Tests */}
          <div className={styles.section}>
            <div className="section-header">
              <span className="section-title">My Tests</span>
              <Link href="/tests" className="btn btn-outline btn-sm">Browse Tests</Link>
            </div>
            {bookings.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🧪</div>
                <h3>No tests booked yet</h3>
                <p>Book your first health panel to start your preventive health journey.</p>
                <Link href="/tests" className="btn btn-primary" style={{ marginTop: 16 }}>Book a Test</Link>
              </div>
            ) : (
              <div className={styles.bookingsList}>
                {bookings.map((b) => (
                  <div key={b.id} className={styles.bookingRow}>
                    <div className={styles.bookingInfo}>
                      <span className={styles.bookingName}>{b.testName}</span>
                      <span className={styles.bookingDate}>
                        {b.date ? new Date((b.date as unknown as { seconds: number }).seconds * 1000).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </span>
                    </div>
                    <div className={styles.bookingMeta}>
                      <span className={`badge ${b.paymentStatus === 'paid' ? 'badge-green' : 'badge-yellow'}`}>
                        {b.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                      </span>
                      <span className={`badge ${STATUS_CONFIG[b.status]?.badge}`}>
                        {STATUS_CONFIG[b.status]?.label}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)' }}>
                        KES {b.price?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Results */}
          <div className={styles.section}>
            <div className="section-header">
              <span className="section-title">My Results</span>
            </div>
            {results.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📋</div>
                <h3>No results yet</h3>
                <p>Your lab results and doctor interpretations will appear here once reviewed.</p>
              </div>
            ) : (
              <div className={styles.resultsList}>
                {results.map((r) => (
                  <div key={r.id} className={styles.resultCard}>
                    <div className={styles.resultHeader}>
                      <span className={styles.resultTitle}>Lab Results</span>
                      <span className={`badge ${r.status === 'reviewed' ? 'badge-green' : 'badge-yellow'}`}>
                        {r.status === 'reviewed' ? 'Doctor Reviewed' : 'Pending Review'}
                      </span>
                    </div>
                    {r.rawResults && Object.entries(r.rawResults).map(([key, val]) => (
                      <div key={key} className={styles.resultRow}>
                        <span className={styles.resultKey}>{key}</span>
                        <span className={styles.resultVal}>{val.value} {val.unit}</span>
                        <span className={`badge ${val.status === 'normal' ? 'badge-green' : val.status === 'attention' ? 'badge-yellow' : 'badge-red'}`}>
                          {val.status === 'normal' ? '✓ Normal' : val.status === 'attention' ? '⚠ Needs Attention' : '🚨 Critical'}
                        </span>
                      </div>
                    ))}
                    {r.doctorNotes && (
                      <div className={styles.doctorNote}>
                        <span className={styles.doctorLabel}>🩺 Doctor&apos;s Note</span>
                        <p>{r.doctorNotes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
