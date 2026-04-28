'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createBooking, getLabs } from '@/lib/firestore';
import { STATIC_TESTS, Test, Lab } from '@/lib/types';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import styles from './page.module.css';

// Client-only Map component
const Map = dynamic(() => import('@/components/Map'), { 
  ssr: false, 
  loading: () => <div style={{ height: '400px', background: 'var(--clr-surface-2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Map...</div> 
});

export default function TestsPage() {
  const { user, signInWithGoogle } = useAuth();
  const router = useRouter();
  
  const [labs, setLabs] = useState<Lab[]>([]);
  const [selected, setSelected] = useState<Test | null>(null);
  const [date, setDate] = useState('');
  const [collectionMethod, setCollectionMethod] = useState<'lab' | 'home' | null>(null);
  const [homeLocation, setHomeLocation] = useState<{ lat: number; lng: number; address?: string } | null>(null);
  const [selectedLab, setSelectedLab] = useState<Lab | null>(null);
  const [txCode, setTxCode] = useState('');
  const [step, setStep] = useState<'browse' | 'book' | 'collection' | 'pay' | 'done'>('browse');
  const [loading, setLoading] = useState(false);
  const [bookingId, setBookingId] = useState('');

  useEffect(() => {
    if (step === 'collection') {
      getLabs().then(setLabs);
    }
  }, [step]);

  const handleSelect = (test: Test) => {
    if (!user) {
      signInWithGoogle();
      return;
    }
    setSelected(test);
    setStep('book');
  };

  const handleBook = async () => {
    if (!user || !selected || !date || !collectionMethod) return;
    if (collectionMethod === 'lab' && !selectedLab) return;
    if (collectionMethod === 'home' && !homeLocation) return;

    setLoading(true);
    try {
      const bookingData: any = {
        userId: user.uid,
        testId: selected.id,
        testName: selected.name,
        date: new Date(date),
        collectionMethod,
        status: 'pending',
        paymentStatus: 'unpaid',
        price: selected.price,
      };

      if (collectionMethod === 'lab' && selectedLab) {
        bookingData.labId = selectedLab.id;
        bookingData.labName = selectedLab.name;
        bookingData.location = { 
          lat: selectedLab.coordinates.lat, 
          lng: selectedLab.coordinates.lng, 
          address: selectedLab.address 
        };
      } else if (collectionMethod === 'home' && homeLocation) {
        bookingData.location = homeLocation;
        bookingData.homeAddress = homeLocation.address;
      }

      const id = await createBooking(bookingData);
      setBookingId(id);
      setStep('pay');
    } catch (e) {
      console.error(e);
      alert('Failed to create booking. Please try again.');
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
    setHomeLocation(null);
    setTxCode('');
  };

  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <div className="container">
          <div className={styles.header}>
            <h1>Choose Your Health Panel</h1>
            <p>Doctor-curated test bundles. Results reviewed and explained in plain language.</p>
          </div>

          <div className={styles.grid}>
            {STATIC_TESTS.map((test) => (
              <div key={test.id} className={`${styles.testCard} ${test.popular ? styles.popular : ''}`}>
                <div className={styles.testIcon}>{test.icon}</div>
                <h3>{test.name}</h3>
                <p className={styles.testDesc}>{test.description}</p>
                <div className={styles.footer}>
                  <div className={styles.price}>KES {test.price.toLocaleString()}</div>
                  <button className="btn btn-primary" onClick={() => handleSelect(test)}>Book Now</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {step !== 'browse' && selected && (
        <div className="overlay" onClick={closeModal}>
          <div className={`${styles.modal} ${step === 'collection' ? styles.largeModal : ''}`} onClick={(e) => e.stopPropagation()}>
            
            {step === 'book' && (
              <div className={styles.modalContent}>
                <h3>Step 1: Select Date</h3>
                <input className="form-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                <div className={styles.modalActions}>
                  <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                  <button className="btn btn-primary" onClick={() => setStep('collection')} disabled={!date}>Next →</button>
                </div>
              </div>
            )}

            {step === 'collection' && (
              <div className={styles.splitLayout}>
                <div className={styles.sidebar}>
                  <h3>Collection Method</h3>
                  <div className={styles.methodToggle}>
                    <button className={collectionMethod === 'lab' ? styles.active : ''} onClick={() => setCollectionMethod('lab')}>🏢 Lab Visit</button>
                    <button className={collectionMethod === 'home' ? styles.active : ''} onClick={() => setCollectionMethod('home')}>🏠 Home</button>
                  </div>

                  {collectionMethod === 'lab' && (
                    <div className={styles.labList}>
                      {labs.map(lab => (
                        <div key={lab.id} className={`${styles.labItem} ${selectedLab?.id === lab.id ? styles.active : ''}`} onClick={() => setSelectedLab(lab)}>
                          <strong>{lab.name}</strong>
                          <span>{lab.neighborhood}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {collectionMethod === 'home' && (
                    <div className={styles.homeInstruction}>
                      <p>Drag the pin to your exact location on the map.</p>
                      {homeLocation && (
                        <div className={styles.selectedAddress}>
                          <strong>Address:</strong>
                          <p>{homeLocation.address}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className={styles.modalActions} style={{ marginTop: 'auto', paddingTop: 20 }}>
                    <button className="btn btn-ghost" onClick={() => setStep('book')}>Back</button>
                    <button className="btn btn-primary" onClick={handleBook} disabled={loading || !collectionMethod || (collectionMethod === 'lab' && !selectedLab) || (collectionMethod === 'home' && !homeLocation)}>
                      {loading ? '...' : 'Confirm →'}
                    </button>
                  </div>
                </div>

                <div className={styles.mapContainer}>
                  <Map 
                    center={[-1.2921, 36.8219]} // Nairobi
                    zoom={12}
                    markers={collectionMethod === 'lab' ? labs.map(l => ({ id: l.id, name: l.name, position: [l.coordinates.lat, l.coordinates.lng] })) : []}
                    onMarkerClick={(id) => setSelectedLab(labs.find(l => l.id === id) || null)}
                    draggable={collectionMethod === 'home'}
                    onLocationSelect={setHomeLocation}
                    height="100%"
                  />
                </div>
              </div>
            )}

            {step === 'pay' && (
              <div className={styles.modalContent}>
                <h3>Complete Checkout</h3>
                <p>Pay <strong>KES {selected.price.toLocaleString()}</strong> via M-Pesa.</p>
                <input className="form-input" placeholder="M-Pesa Code" value={txCode} onChange={(e) => setTxCode(e.target.value.toUpperCase())} />
                <div className={styles.modalActions}>
                  <button className="btn btn-primary" onClick={async () => {
                    const { updateBookingPayment } = await import('@/lib/firestore');
                    await updateBookingPayment(bookingId, txCode);
                    setStep('done');
                  }}>Finish Booking →</button>
                </div>
              </div>
            )}

            {step === 'done' && (
              <div className={styles.modalContent} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3rem' }}>✅</div>
                <h3>Confirmed!</h3>
                <button className="btn btn-primary" onClick={() => router.push('/dashboard')}>Go to Dashboard</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
