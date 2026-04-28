'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { adminGetAllBookings, adminCreateResult, adminUpdateBookingStatus } from '@/lib/admin';
import { Booking } from '@/lib/types';
import styles from '../page.module.css';

export default function MedicalResultsAdmin() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  
  const [form, setForm] = useState({
    doctorNotes: '',
    rawResults: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    const data = await adminGetAllBookings();
    // Only show confirmed bookings that are not yet completed
    setBookings(data.filter(b => b.status === 'confirmed'));
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!user || !selectedBooking || !form.doctorNotes || !form.rawResults) return;
    setSubmitting(true);
    
    try {
      let interpreted: any = {};
      try {
        interpreted = JSON.parse(form.rawResults);
      } catch (e) {
        interpreted = { "Overall Summary": { value: form.rawResults, unit: '', range: '', status: 'normal' } };
      }

      await adminCreateResult({
        userId: selectedBooking.userId,
        bookingId: selectedBooking.id,
        rawResults: interpreted,
        doctorNotes: form.doctorNotes,
        status: 'reviewed'
      }, user.uid, user.email || '');

      await adminUpdateBookingStatus(selectedBooking.id, 'completed', user.uid, user.email || '', selectedBooking.status);
      
      setSelectedBooking(null);
      setForm({ doctorNotes: '', rawResults: '' });
      fetchBookings();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Medical Review</h1>
        <p>Interpret lab data and release results to patients.</p>
      </header>

      {!selectedBooking ? (
        <div className={styles.tableContainer}>
          <table className={styles.adminTable}>
            <thead>
              <tr>
                <th>Patient ID</th>
                <th>Test Panel</th>
                <th>Collection</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--clr-text-dim)' }}>No tests awaiting results.</td></tr>
              )}
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td className={styles.mono}>{b.userId.slice(0, 12)}</td>
                  <td style={{ fontWeight: 600 }}>{b.testName}</td>
                  <td>{b.collectionMethod.toUpperCase()}</td>
                  <td><span className="badge badge-blue">Ready for Review</span></td>
                  <td>
                    <button className="btn btn-sm btn-primary" onClick={() => setSelectedBooking(b)}>Enter Results</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.formCard} style={{ background: 'var(--clr-surface)', padding: 32, borderRadius: 24, border: '1px solid var(--clr-border)' }}>
          <div style={{ marginBottom: 32 }}>
            <button className="btn btn-sm btn-ghost" onClick={() => setSelectedBooking(null)}>← Back to List</button>
            <h2 style={{ marginTop: 16 }}>Entering Results for {selectedBooking.testName}</h2>
            <p className={styles.mono}>Patient: {selectedBooking.userId}</p>
          </div>

          <div className="form-group" style={{ marginBottom: 24 }}>
            <label className="form-label">Raw Lab Values (JSON Preferred)</label>
            <textarea 
              className="form-input" 
              rows={8}
              placeholder='e.g. {"Glucose": {"value": "5.4", "unit": "mmol/L", "range": "3.9 - 6.1", "status": "normal"}}'
              value={form.rawResults}
              onChange={e => setForm({...form, rawResults: e.target.value})}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 32 }}>
            <label className="form-label">Doctor&apos;s Professional Interpretation</label>
            <textarea 
              className="form-input" 
              rows={6}
              placeholder="Explain the results in simple terms for the patient..."
              value={form.doctorNotes}
              onChange={e => setForm({...form, doctorNotes: e.target.value})}
            />
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Finalizing...' : 'Approve & Release Results →'}
            </button>
            <button className="btn btn-outline" onClick={() => setSelectedBooking(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
