'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserResults } from '@/lib/firestore';
import { Result } from '@/lib/types';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function ResultsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [results, setResults] = useState<Result[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const r = await getUserResults(user.uid);
      setResults(r);
      setFetching(false);
    })();
  }, [user]);

  if (loading || fetching) {
    return <div className="loading-screen"><div className="spinner" /></div>;
  }

  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <div className="container">
          <div className={styles.header}>
            <h1>My Lab Results</h1>
            <p>Access your medical reports and simplified doctor interpretations.</p>
          </div>

          {results.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>📋</div>
              <h3>No results yet</h3>
              <p>Your results will appear here as soon as they are reviewed by our doctors.</p>
              <a href="/tests" className="btn btn-primary" style={{ marginTop: 20 }}>Book a Test</a>
            </div>
          ) : (
            <div className={styles.resultsGrid}>
              {results.map((r) => (
                <div key={r.id} className={styles.resultCard}>
                  <div className={styles.resultHeader}>
                    <div className={styles.resultInfo}>
                      <span className={styles.date}>
                        {new Date((r.createdAt as any).seconds * 1000).toLocaleDateString()}
                      </span>
                      <h3>Health Panel Report</h3>
                    </div>
                    <span className={`badge ${r.status === 'reviewed' ? 'badge-green' : 'badge-yellow'}`}>
                      {r.status === 'reviewed' ? 'Reviewed' : 'Processing'}
                    </span>
                  </div>

                  <div className={styles.reportContent}>
                    {r.rawResults && Object.entries(r.rawResults).map(([key, val]: [string, any]) => (
                      <div key={key} className={styles.indicatorRow}>
                        <div className={styles.indicatorMain}>
                          <span className={styles.indicatorName}>{key}</span>
                          <span className={styles.indicatorRange}>Ref: {val.range}</span>
                        </div>
                        <div className={styles.indicatorValue}>
                          <span className={styles.val}>{val.value} {val.unit}</span>
                          <span className={`badge ${val.status === 'normal' ? 'badge-green' : val.status === 'attention' ? 'badge-yellow' : 'badge-red'}`}>
                            {val.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {r.doctorNotes && (
                    <div className={styles.doctorInterpretation}>
                      <h4>🩺 Doctor&apos;s Interpretation</h4>
                      <p>{r.doctorNotes}</p>
                    </div>
                  )}

                  <div className={styles.footer}>
                    <button className="btn btn-outline btn-sm">Download PDF</button>
                    <button className="btn btn-ghost btn-sm">Share with Doctor</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
