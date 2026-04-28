'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { adminGetAllBookings, adminVerifyPayment } from '@/lib/admin';
import { Booking } from '@/lib/types';
import styles from '../page.module.css';

export default function PaymentsAdmin() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [txCode, setTxCode] = useState('');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    const data = await adminGetAllBookings();
    // Only show bookings that have a transaction code or are unpaid
    setBookings(data.filter(b => b.paymentStatus === 'unpaid' || b.transactionCode));
    setLoading(false);
  };

  const handleVerify = async (bookingId: string) => {
    if (!user || !txCode) return;
    await adminVerifyPayment(bookingId, txCode, 'paid', user.uid, user.email || '');
    setVerifyingId(null);
    setTxCode('');
    fetchBookings();
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Payment Verification</h1>
        <p>Confirm M-Pesa transactions and unlock bookings.</p>
      </header>

      <div className={styles.tableContainer}>
        <table className={styles.adminTable}>
          <thead>
            <tr>
              <th>Booking</th>
              <th>Amount</th>
              <th>User Code</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{b.testName}</div>
                  <div className={styles.mono}>{b.id.slice(0, 8)}</div>
                </td>
                <td style={{ fontWeight: 700 }}>KES {b.price.toLocaleString()}</td>
                <td className={styles.mono}>
                  {b.transactionCode || <span style={{ color: 'var(--clr-text-muted)' }}>Not provided</span>}
                </td>
                <td>
                  <span className={`badge ${b.paymentStatus === 'paid' ? 'badge-green' : 'badge-yellow'}`}>
                    {b.paymentStatus}
                  </span>
                </td>
                <td>
                  {b.paymentStatus === 'unpaid' ? (
                    verifyingId === b.id ? (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="Confirm Code"
                          style={{ width: 140, padding: '4px 8px', fontSize: '0.8rem' }}
                          value={txCode}
                          onChange={e => setTxCode(e.target.value)}
                        />
                        <button className="btn btn-sm btn-primary" onClick={() => handleVerify(b.id)}>Approve</button>
                        <button className="btn btn-sm btn-ghost" onClick={() => setVerifyingId(null)}>×</button>
                      </div>
                    ) : (
                      <button className="btn btn-sm btn-primary" onClick={() => {
                        setVerifyingId(b.id);
                        setTxCode(b.transactionCode || '');
                      }}>
                        Verify Payment
                      </button>
                    )
                  ) : (
                    <span style={{ color: 'var(--clr-green)' }}>✓ Verified</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
