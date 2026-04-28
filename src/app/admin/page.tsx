'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAllBookings, updateBookingStatus, createResult } from '@/lib/firestore';
import { Booking } from '@/lib/types';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [fetching, setFetching] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [resultsForm, setResultsForm] = useState({
    doctorNotes: '',
    rawResults: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/');
    // In a real app, check for admin role here
  }, [user, loading, router]);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setFetching(true);
    const b = await getAllBookings();
    setBookings(b);
    setFetching(false);
  };

  const handleUpdateStatus = async (id: string, status: Booking['status']) => {
    await updateBookingStatus(id, status);
    fetchBookings();
  };

  const handleAddResults = (booking: Booking) => {
    setSelectedBooking(booking);
    setResultsForm({ doctorNotes: '', rawResults: '' });
  };

  const submitResults = async () => {
    if (!selectedBooking) return;
    setSaving(true);
    try {
      // Very basic interpretation: translate JSON if provided, or use as text
      let interpreted: any = {};
      try {
        interpreted = JSON.parse(resultsForm.rawResults);
      } catch (e) {
        interpreted = { "Overall Summary": { value: resultsForm.rawResults, unit: '', range: '', status: 'normal' } };
      }

      await createResult({
        userId: selectedBooking.userId,
        bookingId: selectedBooking.id,
        rawResults: interpreted,
        doctorNotes: resultsForm.doctorNotes,
        status: 'reviewed',
      });

      await updateBookingStatus(selectedBooking.id, 'completed');
      setSelectedBooking(null);
      fetchBookings();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading || fetching) {
    return <div className="loading-screen"><div className="spinner" /></div>;
  }

  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <div className="container">
          <div className={styles.header}>
            <h1>Admin Panel</h1>
            <p>Manage bookings, upload results, and add doctor notes.</p>
          </div>

          <div className={styles.tableCard}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Test Name</th>
                  <th>Date</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td className={styles.mono}>{b.userId.slice(0, 8)}...</td>
                    <td>{b.testName}</td>
                    <td>{b.date ? new Date((b.date as any).seconds * 1000).toLocaleDateString() : '—'}</td>
                    <td>
                      <span className={`badge ${b.paymentStatus === 'paid' ? 'badge-green' : 'badge-yellow'}`}>
                        {b.paymentStatus}
                      </span>
                      {b.transactionCode && <div className={styles.txCode}>{b.transactionCode}</div>}
                    </td>
                    <td>
                      <span className={`badge ${b.status === 'completed' ? 'badge-green' : b.status === 'confirmed' ? 'badge-blue' : 'badge-yellow'}`}>
                        {b.status}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        {b.status !== 'completed' && (
                          <>
                            <button className="btn btn-outline btn-sm" onClick={() => handleUpdateStatus(b.id, 'confirmed')}>Confirm</button>
                            <button className="btn btn-primary btn-sm" onClick={() => handleAddResults(b)}>Add Results</button>
                          </>
                        )}
                        {b.status === 'completed' && <span className={styles.done}>✓ Finalized</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Add Results Modal */}
      {selectedBooking && (
        <div className="overlay" onClick={() => setSelectedBooking(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Interpret Results for {selectedBooking.testName}</h3>
            <p style={{ fontSize: '0.875rem', marginBottom: 24 }}>Upload raw values and add simplified doctor notes.</p>
            
            <div className="form-group">
              <label className="form-label">Raw Results (JSON or Text)</label>
              <textarea 
                className="form-input" 
                rows={4} 
                placeholder='e.g. {"Glucose": {"value": "5.6", "unit": "mmol/L", "range": "3.9-6.1", "status": "normal"}}'
                value={resultsForm.rawResults}
                onChange={e => setResultsForm({...resultsForm, rawResults: e.target.value})}
              />
              <p className="form-hint">Tip: Use JSON for structured indicators or plain text for a simple summary.</p>
            </div>

            <div className="form-group">
              <label className="form-label">Doctor&apos;s Interpretation (Simple Language)</label>
              <textarea 
                className="form-input" 
                rows={4} 
                placeholder='Translate medical jargon into simple terms...'
                value={resultsForm.doctorNotes}
                onChange={e => setResultsForm({...resultsForm, doctorNotes: e.target.value})}
              />
            </div>

            <div className={styles.modalActions}>
              <button className="btn btn-ghost" onClick={() => setSelectedBooking(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={submitResults} disabled={saving}>
                {saving ? 'Saving...' : 'Finalize & Send to User →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
