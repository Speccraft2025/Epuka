'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { adminGetAllBookings, adminCreateResult, adminUpdateBookingStatus } from '@/lib/admin';
import { Booking } from '@/lib/types';
import { generateInterpretation, suggestFlag } from '@/lib/medical';
import styles from '../page.module.css';

export default function MedicalResultsAdmin() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  
  const [form, setForm] = useState({
    doctorNotes: '',
    rawResults: '',
    flag: 'NORMAL' as 'NORMAL' | 'ATTENTION' | 'URGENT',
    followUpAction: '',
    urgentConfirmed: false
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    const data = await adminGetAllBookings();
    setBookings(data.filter(b => b.status === 'confirmed'));
    setLoading(false);
  };

  const handleAutoInterpret = () => {
    try {
      const data = JSON.parse(form.rawResults);
      let notes = "";
      for (const [key, val] of Object.entries(data)) {
        const interpretation = generateInterpretation(key, val as any);
        if (interpretation) notes += `• ${key}: ${interpretation}\n`;
      }
      const suggestedFlag = suggestFlag(data);
      setForm({ ...form, doctorNotes: notes || form.doctorNotes, flag: suggestedFlag });
    } catch (e) {
      alert("Please ensure 'Raw Results' is valid JSON before auto-interpreting.");
    }
  };

  const handleSubmit = async () => {
    if (!user || !selectedBooking || !form.doctorNotes || !form.rawResults) return;
    
    // Safety Lock for Urgent Cases
    if (form.flag === 'URGENT' && !form.urgentConfirmed) {
      alert("This is an URGENT case. Please confirm manual review and follow-up before releasing.");
      return;
    }

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
        flag: form.flag,
        followUpAction: form.followUpAction,
        status: 'reviewed'
      }, user.uid, user.email || '');

      await adminUpdateBookingStatus(selectedBooking.id, 'completed', user.uid, user.email || '', selectedBooking.status);
      
      setSelectedBooking(null);
      setForm({ doctorNotes: '', rawResults: '', flag: 'NORMAL', followUpAction: '', urgentConfirmed: false });
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
          </div>

          <div className="form-group" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <label className="form-label">Raw Lab Values (JSON)</label>
              <button className="btn btn-sm btn-outline" style={{ color: 'var(--clr-blue)', borderColor: 'var(--clr-blue)' }} onClick={handleAutoInterpret}>✨ Auto-Interpret</button>
            </div>
            <textarea 
              className="form-input" 
              rows={6}
              placeholder='e.g. {"Glucose": {"value": "5.4", "unit": "mmol/L", "range": "3.9 - 6.1", "status": "normal"}}'
              value={form.rawResults}
              onChange={e => setForm({...form, rawResults: e.target.value})}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 24 }}>
            <label className="form-label">Severity Flag</label>
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              {['NORMAL', 'ATTENTION', 'URGENT'].map(f => (
                <button 
                  key={f}
                  className={`btn btn-sm ${form.flag === f ? (f === 'URGENT' ? 'btn-danger' : 'btn-primary') : 'btn-outline'}`}
                  onClick={() => setForm({...form, flag: f as any})}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {form.flag === 'URGENT' && (
            <div className={styles.urgentAlert} style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--clr-red)', padding: 20, borderRadius: 12, marginBottom: 24 }}>
              <p style={{ color: 'var(--clr-red)', fontWeight: 700, marginBottom: 12 }}>⚠️ URGENT CASE SAFETY LOCK</p>
              <div className="form-group">
                <label className="form-label">Follow-up Action Taken</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Called patient, referred to ER" 
                  value={form.followUpAction}
                  onChange={e => setForm({...form, followUpAction: e.target.value})}
                />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, cursor: 'pointer', fontSize: '0.9rem' }}>
                <input type="checkbox" checked={form.urgentConfirmed} onChange={e => setForm({...form, urgentConfirmed: e.target.checked})} />
                I confirm I have reviewed this urgent case manually.
              </label>
            </div>
          )}

          <div className="form-group" style={{ marginBottom: 32 }}>
            <label className="form-label">Doctor&apos;s Interpretation</label>
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
