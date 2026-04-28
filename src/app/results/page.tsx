'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserResults } from '@/lib/firestore';
import { Result } from '@/lib/types';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

const HELP_TEXT: Record<string, string> = {
  'Blood Sugar (Glucose)': 'Measures the amount of sugar in your blood. Primary indicator for diabetes and metabolic health.',
  'Total Cholesterol': 'Total amount of cholesterol in your blood. High levels can increase heart disease risk.',
  'LDL (Bad Cholesterol)': 'Can build up in artery walls. Lower is generally better for heart health.',
  'HDL (Good Cholesterol)': 'The "good" cholesterol that helps remove other fats from your bloodstream.',
  'Triglycerides': 'A type of fat used for energy. High levels often correlate with metabolic issues.',
  'Kidney Function (Creatinine)': 'A waste product filtered by kidneys. High levels may indicate reduced kidney function.',
  'Liver Function (ALT/AST)': 'Enzymes that indicate liver health. Elevation can suggest liver stress.',
  'Thyroid (TSH)': 'Thyroid Stimulating Hormone. Regulates your metabolism and energy levels.',
};

const CATEGORIES: Record<string, string[]> = {
  'Metabolic & Diabetes': ['Blood Sugar (Glucose)', 'HbA1c (Diabetes Risk)'],
  'Heart & Lipids': ['Total Cholesterol', 'LDL (Bad Cholesterol)', 'HDL (Good Cholesterol)', 'Triglycerides'],
  'Organ Function': ['Kidney Function (Creatinine)', 'Liver Function (ALT/AST)', 'Thyroid (TSH)', 'Urine Analysis'],
  'Vitamins & Minerals': ['Vitamin D & B12'],
  'Blood Composition': ['Complete Blood Count (CBC)'],
};

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

  const latest = results[0];

  function getMarkerPosition(value: string, range: string) {
    const numVal = parseFloat(value);
    const matches = range.match(/(\d+\.?\d*)\s*-\s*(\d+\.?\d*)/);
    if (!matches) return 50;
    const min = parseFloat(matches[1]);
    const max = parseFloat(matches[2]);
    const spread = max - min;
    const padding = spread * 0.4;
    const totalMin = min - padding;
    const totalMax = max + padding;
    const pos = ((numVal - totalMin) / (totalMax - totalMin)) * 100;
    return Math.min(Math.max(pos, 5), 95);
  }

  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <div className="container">
          <div className={styles.header}>
            <div>
              <h1>Health Insights</h1>
              <p>Detailed analysis of your latest laboratory markers.</p>
            </div>
            {latest && (
              <span className={styles.date}>Report Date: {new Date((latest.createdAt as any).seconds * 1000).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            )}
          </div>

          {!latest ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>📋</div>
              <h3>No reports found</h3>
              <p>Once your samples are processed, your digital health panel will appear here.</p>
              <button onClick={() => router.push('/tests')} className="btn btn-primary" style={{ marginTop: 24 }}>Book a Test</button>
            </div>
          ) : (
            <div className={styles.resultsGrid}>
              
              {/* Summary Section */}
              <div className={styles.reportSummary}>
                <div className={styles.summaryCard}>
                  <span className={styles.summaryLabel}>Total Markers</span>
                  <div className={styles.summaryValue}>{latest.rawResults ? Object.keys(latest.rawResults).length : 0}</div>
                  <span className={styles.summarySub}>Analyzed by Lab</span>
                </div>
                <div className={styles.summaryCard}>
                  <span className={styles.summaryLabel}>Attention Needed</span>
                  <div className={styles.summaryValue} style={{ color: 'var(--clr-warning)' }}>
                    {latest.rawResults ? Object.values(latest.rawResults).filter(v => v.status !== 'normal').length : 0}
                  </div>
                  <span className={styles.summarySub}>Markers outside ideal range</span>
                </div>
                <div className={styles.summaryCard}>
                  <span className={styles.summaryLabel}>Report Status</span>
                  <div className={styles.summaryValue} style={{ color: 'var(--clr-green)', fontSize: '1.5rem' }}>DOCTOR REVIEWED</div>
                  <span className={styles.summarySub}>Final interpretation complete</span>
                </div>
              </div>

              {/* Categorized Markers */}
              {Object.entries(CATEGORIES).map(([catName, markers]) => {
                const catResults = Object.entries(latest.rawResults || {}).filter(([key]) => markers.includes(key));
                if (catResults.length === 0) return null;

                return (
                  <div key={catName} className={styles.categorySection}>
                    <h2 className={styles.categoryTitle}>{catName}</h2>
                    <div className={styles.metricGrid}>
                      {catResults.map(([name, val]) => (
                        <div key={name} className={styles.metricCard}>
                          <div className={styles.metricHeader}>
                            <div className={styles.metricInfo}>
                              <span className={styles.metricName}>
                                {name}
                                <span className={styles.helpIcon}>ⓘ</span>
                                <div className={styles.tooltip}>{HELP_TEXT[name] || 'Clinical marker for health monitoring.'}</div>
                              </span>
                              <div className={styles.metricValue}>
                                <span className={styles.valLarge}>{val.value}</span>
                                <span className={styles.unit}>{val.unit}</span>
                              </div>
                            </div>
                            <span className={`badge ${val.status === 'normal' ? 'badge-green' : val.status === 'attention' ? 'badge-yellow' : 'badge-red'}`}>
                              {val.status.toUpperCase()}
                            </span>
                          </div>

                          <div className={styles.rangeContainer}>
                            <div className={styles.rangeBar}>
                              <div className={styles.idealZone} style={{ left: '25%', width: '50%' }} />
                              <div 
                                className={`${styles.marker} ${styles[val.status]}`} 
                                style={{ left: `${getMarkerPosition(val.value, val.range)}%` }} 
                              />
                            </div>
                            <div className={styles.rangeLabels}>
                              <span>{val.range.split('-')[0]} Low</span>
                              <span>Reference Range: {val.range}</span>
                              <span>{val.range.split('-')[1]} High</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Doctor's Interpretation */}
              {latest.doctorNotes && (
                <div className={styles.doctorSection}>
                  <div className={styles.doctorHeader}>
                    <div className={styles.doctorAvatar}>👨‍⚕️</div>
                    <div>
                      <div className={styles.doctorLabel}>Clinical Interpretation</div>
                      <div className={styles.doctorName}>Dr. Reviewing Officer</div>
                    </div>
                  </div>
                  <div className={styles.doctorContent}>
                    <p>{latest.doctorNotes}</p>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 24 }}>
                <button className="btn btn-primary">Download Official PDF</button>
                <button className="btn btn-outline" onClick={() => window.print()}>Print Report</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
