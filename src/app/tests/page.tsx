'use client';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createBooking } from '@/lib/firestore';
import { STATIC_TESTS, Test } from '@/lib/types';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function TestsPage() {
  const { user, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [selected, setSelected] = useState<Test | null>(null);
  const [date, setDate] = useState('');
  const [collectionMethod, setCollectionMethod] = useState<'lab' | 'home' | null>(null);
  const [homeAddress, setHomeAddress] = useState('');
  const [selectedLab, setSelectedLab] = useState<Lab | null>(null);
  const [txCode, setTxCode] = useState('');
  const [step, setStep] = useState<'browse' | 'book' | 'collection' | 'pay' | 'done'>('browse');
  const [loading, setLoading] = useState(false);
  const [bookingId, setBookingId] = useState('');

  const handleSelect = (test: Test) => {
    if (!user) {
      signInWithGoogle();
      return;
    }
    setSelected(test);
    setStep('book');
  };

  const handleNextToCollection = () => {
    if (!date) return;
    setStep('collection');
  };

  const handleBook = async () => {
    if (!user || !selected || !date || !collectionMethod) return;
    if (collectionMethod === 'lab' && !selectedLab) return;
    if (collectionMethod === 'home' && !homeAddress) return;

    setLoading(true);
    try {
      const id = await createBooking({
        userId: user.uid,
        testId: selected.id,
        testName: selected.name,
        date: new Date(date),
        collectionMethod,
        labId: selectedLab?.id,
        labName: selectedLab?.name,
        homeAddress: collectionMethod === 'home' ? homeAddress : undefined,
        status: 'pending',
        paymentStatus: 'unpaid',
        price: selected.price,
      });
      setBookingId(id);
      setStep('pay');
    } catch (e) {
      console.error(e);
      alert('Failed to create booking. Please try again.');
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
      alert('Failed to verify payment. Please check your transaction code.');
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setStep('browse');
    setSelected(null);
    setDate('');
    setCollectionMethod(null);
    setSelectedLab(null);
    setHomeAddress('');
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
        <div className="overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>

            {step === 'book' && (
              <>
                <h3 style={{ marginBottom: 8 }}>Step 1: Select Date</h3>
                <p style={{ fontSize: '0.875rem', marginBottom: 24 }}>Choose when you&apos;d like to get tested.</p>
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
                <div className={styles.modalActions} style={{ marginTop: 32 }}>
                  <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleNextToCollection} disabled={!date}>
                    Next: Collection Method →
                  </button>
                </div>
              </>
            )}

            {step === 'collection' && (
              <>
                <h3 style={{ marginBottom: 8 }}>Step 2: How should we collect samples?</h3>
                <p style={{ fontSize: '0.875rem', marginBottom: 24 }}>Visit a lab or let us come to you.</p>
                
                <div className={styles.choiceGrid}>
                  <div 
                    className={`${styles.choiceCard} ${collectionMethod === 'lab' ? styles.active : ''}`}
                    onClick={() => setCollectionMethod('lab')}
                  >
                    <div className={styles.choiceIcon}>🏢</div>
                    <h4>Lab Visit</h4>
                    <p>Visit one of our partner labs</p>
                  </div>
                  <div 
                    className={`${styles.choiceCard} ${collectionMethod === 'home' ? styles.active : ''}`}
                    onClick={() => setCollectionMethod('home')}
                  >
                    <div className={styles.choiceIcon}>🏠</div>
                    <h4>Home Collection</h4>
                    <p>We come to your location</p>
                  </div>
                </div>

                {collectionMethod === 'lab' && (
                  <div className={styles.labList}>
                    <p className="form-label" style={{ marginBottom: 12 }}>Select a nearby lab</p>
                    {STATIC_LABS.map(lab => (
                      <div 
                        key={lab.id} 
                        className={`${styles.labCard} ${selectedLab?.id === lab.id ? styles.active : ''}`}
                        onClick={() => setSelectedLab(lab)}
                      >
                        <div>
                          <span className={styles.labName}>{lab.name}</span>
                          <span className={styles.labAddress}>{lab.neighborhood}</span>
                        </div>
                        <span className={styles.labDist}>{(Math.random() * 5 + 1).toFixed(1)}km</span>
                      </div>
                    ))}
                  </div>
                )}

                {collectionMethod === 'home' && (
                  <div className="form-group">
                    <label className="form-label">Home / Office Address</label>
                    <textarea 
                      className="form-input" 
                      rows={3}
                      placeholder="Enter your detailed location for sample collection..."
                      value={homeAddress}
                      onChange={(e) => setHomeAddress(e.target.value)}
                    />
                  </div>
                )}

                <div className={styles.modalActions}>
                  <button className="btn btn-ghost" onClick={() => setStep('book')}>Back</button>
                  <button 
                    className="btn btn-primary" 
                    onClick={handleBook} 
                    disabled={loading || (collectionMethod === 'lab' && !selectedLab) || (collectionMethod === 'home' && !homeAddress) || !collectionMethod}
                  >
                    {loading ? 'Processing...' : 'Confirm & Pay →'}
                  </button>
                </div>
              </>
            )}

            {step === 'pay' && (
              <>
                <div className={styles.payIcon}>💳</div>
                <h3>Complete Checkout</h3>
                <p style={{ fontSize: '0.875rem', marginBottom: 24 }}>
                  Pay <strong style={{ color: 'var(--clr-green)' }}>KES {selected.price.toLocaleString()}</strong> to finalize your booking.
                </p>
                <div className={styles.mpesaInstructions}>
                  <div className={styles.mpesaStep}><span>1</span> M-Pesa Paybill: <strong>123456</strong></div>
                  <div className={styles.mpesaStep}><span>2</span> Account: <strong>EPUKA-{bookingId.slice(0,4)}</strong></div>
                  <div className={styles.mpesaStep}><span>3</span> Amount: KES {selected.price.toLocaleString()}</div>
                </div>
                <div className="form-group">
                  <label className="form-label">M-Pesa Transaction Code</label>
                  <input className="form-input" placeholder="e.g. QJH7X8ABC1"
                    value={txCode} onChange={(e) => setTxCode(e.target.value.toUpperCase())} />
                </div>
                <div className={styles.modalActions}>
                  <button className="btn btn-ghost" onClick={closeModal}>Pay Later</button>
                  <button className="btn btn-primary" onClick={handlePay} disabled={!txCode || loading}>
                    {loading ? 'Verifying...' : 'Finish Booking →'}
                  </button>
                </div>
              </>
            )}

            {step === 'done' && (
              <div className={styles.doneState}>
                <div className={styles.doneIcon}>✅</div>
                <h3>Booking Confirmed!</h3>
                <p>Your {selected.name} is scheduled for {new Date(date).toLocaleDateString()}.</p>
                <p style={{ marginTop: 8 }}>
                  {collectionMethod === 'lab' 
                    ? `Please visit ${selectedLab?.name} on the selected date.` 
                    : `A professional will visit you at ${homeAddress.split(',')[0]} for sample collection.`
                  }
                </p>
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

