'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { adminGetAllBookings, adminUpdateBookingStatus } from '@/lib/admin';
import { Booking } from '@/lib/types';
import styles from '../page.module.css';

export default function BookingsAdmin() {
  const { user, role } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    const data = await adminGetAllBookings();
    setBookings(data);
    setLoading(false);
  };

  const handleStatusChange = async (booking: Booking, newStatus: Booking['status']) => {
    if (!user) return;
    await adminUpdateBookingStatus(booking.id, newStatus, user.uid, user.email || '', booking.status);
    fetchBookings();
  };

  const filteredBookings = bookings.filter(b => {
    if (filter === 'all') return true;
    return b.status === filter;
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Bookings Management</h1>
        <p>Monitor and update test schedules.</p>
      </header>

      <div className={styles.filters} style={{ marginBottom: 24, display: 'flex', gap: 12 }}>
        {['all', 'pending', 'confirmed', 'completed'].map(f => (
          <button 
            key={f}
            className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilter(f)}
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.adminTable}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Test</th>
              <th>User</th>
              <th>Method</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.map((b) => (
              <tr key={b.id}>
                <td>{new Date((b.createdAt as any).seconds * 1000).toLocaleDateString()}</td>
                <td>
                  <div style={{ fontWeight: 600 }}>{b.testName}</div>
                  <div className={styles.mono} style={{ fontSize: '0.7rem' }}>{b.id.slice(0, 8)}</div>
                </td>
                <td>{b.userId.slice(0, 8)}...</td>
                <td>
                  <span className={styles.badge} style={{ background: 'var(--clr-surface-2)' }}>
                    {b.collectionMethod}
                  </span>
                </td>
                <td>
                  <span className={`badge ${b.status === 'completed' ? 'badge-green' : b.status === 'confirmed' ? 'badge-blue' : 'badge-yellow'}`}>
                    {b.status}
                  </span>
                </td>
                <td>
                  {b.status === 'pending' && (
                    <button 
                      className="btn btn-sm btn-outline" 
                      onClick={() => handleStatusChange(b, 'confirmed')}
                    >
                      Confirm
                    </button>
                  )}
                  {b.status === 'confirmed' && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--clr-text-dim)' }}>Awaiting Medical</span>
                  )}
                  {b.status === 'completed' && (
                    <span style={{ color: 'var(--clr-green)' }}>✓ Done</span>
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
