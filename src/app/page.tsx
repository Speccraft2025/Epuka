'use client';
import Navbar from '@/components/Navbar';
import BmiCalculator from '@/components/BmiCalculator';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import styles from './page.module.css';

const STATS = [
  { value: '10K+', label: 'Kenyans tested' },
  { value: '98%', label: 'Satisfaction rate' },
  { value: '48hr', label: 'Results turnaround' },
  { value: '50+', label: 'Tests available' },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Book a Test', desc: 'Choose from our curated health panels and pick a date that works for you.' },
  { step: '02', title: 'Get Tested', desc: 'Visit our partner labs or get a home collection — fast and comfortable.' },
  { step: '03', title: 'Understand Results', desc: 'A doctor reviews your results in plain language. No medical jargon.' },
];

export default function HomePage() {
  const { user, signInWithGoogle } = useAuth();

  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className={styles.hero}>
          <div className="container">
            <div className={styles.heroContent}>
              <div className={styles.heroCopy}>
                <div className={styles.heroTag}>Preventive Healthcare, Reinvented</div>
                <h1>
                  Know Your Health.
                  <br />
                  <span className={styles.greenText}>Act Before It&apos;s Late.</span>
                </h1>
                <p className={styles.heroSubtitle}>
                  Book a lab test, get doctor-reviewed results in plain language, and take control of your health journey — all from one dashboard.
                </p>
                <div className={styles.heroCtas}>
                  {user ? (
                    <Link href="/tests" className="btn btn-primary btn-lg">Book a Test →</Link>
                  ) : (
                    <>
                      <button className="btn btn-primary btn-lg" onClick={signInWithGoogle}>
                        Sign in with Google
                      </button>
                      <Link href="#how" className="btn btn-outline btn-lg">How it works</Link>
                    </>
                  )}
                </div>
                <div className={styles.statsRow}>
                  {STATS.map((s) => (
                    <div key={s.label} className={styles.statItem}>
                      <span className={styles.statVal}>{s.value}</span>
                      <span className={styles.statLbl}>{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className={styles.heroCalc} id="bmi">
                <BmiCalculator />
              </div>
            </div>
          </div>
          <div className={styles.heroBg} />
        </section>

        {/* How it works */}
        <section className={styles.howSection} id="how">
          <div className="container">
            <div className={styles.sectionHead}>
              <span className={styles.sectionTag}>Simple Process</span>
              <h2>From booking to clarity in 48 hours</h2>
              <p>We handle the complexity. You get the answers.</p>
            </div>
            <div className={styles.steps}>
              {HOW_IT_WORKS.map((item) => (
                <div key={item.step} className={styles.stepCard}>
                  <div className={styles.stepNum}>{item.step}</div>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className={styles.ctaBanner}>
          <div className="container">
            <div className={styles.bannerInner}>
              <div>
                <h2>Ready to know your numbers?</h2>
                <p>Join thousands of Kenyans making smarter health decisions with Epuka.</p>
              </div>
              {user ? (
                <Link href="/tests" className="btn btn-primary btn-lg">Browse Tests</Link>
              ) : (
                <button className="btn btn-primary btn-lg" onClick={signInWithGoogle}>
                  Get Started Free
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className={styles.footer}>
          <div className="container">
            <div className={styles.footerInner}>
              <span className="nav-logo">epu<span style={{ color: 'var(--clr-text-muted)' }}>ka</span></span>
              <p style={{ fontSize: '0.8rem' }}>© 2026 Epuka Health. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
