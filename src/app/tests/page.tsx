'use client';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createBooking } from '@/lib/firestore';
import { STATIC_TESTS, Test } from '@/lib/types';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function TestsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selected, setSelected] = useState<Test | null>(null);
  const [date, setDate] = useState('');
  const [txCode, setTxCode] = useState('');
  const [step, setStep] = useState<'browse' | 'book' | 'pay' | 'done'>('browse');
  const [loading, setLoading] = useState(false);
  const [bookingId, setBookingId] = useState('');

  const handleSelect = (test: Test) => {
    if (!user) { router.push('/'); return; }
    setSelected(test);
    setStep('book');
  };

  const handleBook = async () => {
    if (!user || !selected || !date) return;
    setLoading(true);
    try {
      const id = await createBooking({
        userId: user.uid,
        testId: selected.id,
        testName: selected.name,
        date: new Date(date),
        status: 'pending',
        paymentStatus: 'unpaid',
        price: selected.price,
      });
      setBookingId(id);
      setStep('pay');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    if (!txCode.trim()) return;
    setLoading(true);
    try {
      const { updateBookingPayment } = await import('@/lib/firestore');
      await updateBookingPayment(bookingId, txCode.trim());
      setStep('done');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setStep('browse');
    setSelected(null);
    setDate('');
    setTxCode('');
  };

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);

  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <div className="container">
          <div className={styles.header}>
            <div>
              <span className={styles.tag}>Lab Tests</span>
              <h1>Choose Your Health Panel</h1>
              <p>Doctor-curated test bundles. Results reviewed and explained in plain language.</p>
            </div>
          </div>

          <div className={styles.grid}>
            {STATIC_TESTS.map((test) => (
              <div key={test.id} className={`${styles.testCard} ${test.popular ? styles.popular : ''}`}>
                {test.popular && <div className={styles.popularBadge}>Most Popular</div>}
                <div className={styles.testIcon}>{test.icon}</div>
                <h3>{test.name}</h3>
                <p className={styles.testDesc}>{test.description}</p>
                <div className={styles.included}>
                  <span className={styles.includedLabel}>What&apos;s included:</span>
                  <ul>
                    {test.includedTests.map((t) => (
                      <li key={t}><span className={styles.checkmark}>✓</span> {t}</li>
                    ))}
                  </ul>
                </div>
                <div className={styles.footer}>
                  <div className={styles.price}>KES {test.price.toLocaleString()}</div>
                  <button className="btn btn-primary" onClick={() => handleSelect(test)}>
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Booking Modal */}
      {step !== 'browse' && selected && (
        <div className="overlay" onClick={step === 'browse' ? closeModal : undefined}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>

            {step === 'book' && (
              <>
                <h3 style={{ marginBottom: 8 }}>Book: {selected.name}</h3>
                <p style={{ fontSize: '0.875rem', marginBottom: 24 }}>Select your preferred date for the test.</p>
                <div className="form-group">
                  <label className="form-label">Preferred Date</label>
                  <input
                    className="form-input"
                    type="date"
                    min={minDate.toISOString().split('T')[0]}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div className={styles.modalPrice}>
                  Total: <strong style={{ color: 'var(--clr-green)' }}>KES {selected.price.toLocaleString()}</strong>
                </div>
                <div className={styles.modalActions}>
                  <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleBook} disabled={!date || loading}>
                    {loading ? 'Booking...' : 'Confirm Booking →'}
                  </button>
                </div>
              </>
            )}

            {step === 'pay' && (
              <>
                <div className={styles.payIcon}>💳</div>
                <h3>Complete Payment</h3>
                <p style={{ fontSize: '0.875rem', marginBottom: 24 }}>
                  Send <strong style={{ color: 'var(--clr-green)' }}>KES {selected.price.toLocaleString()}</strong> via
                  M-Pesa to <strong>0712 345 678</strong>, then enter your transaction code below.
                </p>
                <div className={styles.mpesaInstructions}>
                  <div className={styles.mpesaStep}><span>1</span> Go to M-Pesa → Send Money</div>
                  <div className={styles.mpesaStep}><span>2</span> Enter 0712 345 678</div>
                  <div className={styles.mpesaStep}><span>3</span> Amount: KES {selected.price.toLocaleString()}</div>
                  <div className={styles.mpesaStep}><span>4</span> Enter your M-Pesa PIN</div>
                </div>
                <div className="form-group">
                  <label className="form-label">M-Pesa Transaction Code</label>
                  <input className="form-input" placeholder="e.g. QJH7X8ABC1"
                    value={txCode} onChange={(e) => setTxCode(e.target.value.toUpperCase())} />
                </div>
                <div className={styles.modalActions}>
                  <button className="btn btn-ghost" onClick={closeModal}>Skip for now</button>
                  <button className="btn btn-primary" onClick={handlePay} disabled={!txCode || loading}>
                    {loading ? 'Verifying...' : 'Confirm Payment →'}
                  </button>
                </div>
              </>
            )}

            {step === 'done' && (
              <div className={styles.doneState}>
                <div className={styles.doneIcon}>✅</div>
                <h3>Booking Confirmed!</h3>
                <p>{selected.name} has been booked successfully. You&apos;ll receive a confirmation shortly.</p>
                <p style={{ marginTop: 8 }}>Results will appear in your dashboard once the doctor has reviewed them.</p>
                <button className="btn btn-primary" style={{ marginTop: 24, width: '100%' }}
                  onClick={() => router.push('/dashboard')}>
                  Go to Dashboard →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
