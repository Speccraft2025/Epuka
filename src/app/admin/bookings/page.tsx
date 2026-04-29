'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { adminGetAllBookings, adminTransitionBookingState } from '@/lib/admin';
import { Booking } from '@/lib/types';
import dynamic from 'next/dynamic';
import styles from '../page.module.css';

const Map = dynamic(() => import('@/components/Map'), { ssr: false });

export default function BookingsAdmin() {
  const { user, role } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

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
    try {
      await adminTransitionBookingState(
        booking.id, 
        newStatus, 
        { uid: user.uid, email: user.email || '', role: role as any }, 
        booking.status
      );
      fetchBookings();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Transition failed');
    }
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

      <div className={styles.filters} style={{ marginBottom: 24, display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
        {['all', 'BOOKED', 'PAYMENT_PENDING', 'PAYMENT_CONFIRMED', 'SAMPLE_COLLECTED', 'IN_ANALYSIS', 'VERIFIED', 'CLOSED'].map(f => (
          <button 
            key={f}
            className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline'}`}
            style={{ whiteSpace: 'nowrap' }}
            onClick={() => setFilter(f)}
          >
            {f.replace('_', ' ')}
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
                  <button className={styles.badge} style={{ background: 'var(--clr-surface-2)', border: 'none', cursor: 'pointer' }} onClick={() => setSelectedBooking(b)}>
                    {b.collectionMethod} 📍
                  </button>
                </td>
                <td>
                  <span className={`badge ${b.status === 'CLOSED' ? 'badge-green' : b.status.includes('PAYMENT') ? 'badge-yellow' : 'badge-blue'}`}>
                    {b.status.replace('_', ' ')}
                  </span>
                </td>
                <td>
                  {(b.status === 'BOOKED' || b.status === 'PAYMENT_PENDING') && (
                    <button className="btn btn-sm btn-outline" onClick={() => handleStatusChange(b, 'PAYMENT_CONFIRMED')}>Confirm</button>
                  )}
                  {b.status === 'PAYMENT_CONFIRMED' && (
                    <button className="btn btn-sm btn-primary" onClick={() => handleStatusChange(b, 'ASSIGNED_TO_LAB')}>Assign Lab</button>
                  )}
                  <button className="btn btn-sm btn-ghost" onClick={() => setSelectedBooking(b)}>Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedBooking && (
        <div className="overlay" onClick={() => setSelectedBooking(null)}>
          <div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <h3>Booking Details</h3>
            <p className={styles.mono}>{selectedBooking.id}</p>
            
            <div style={{ marginTop: 24, padding: 20, background: 'var(--clr-surface-2)', borderRadius: 12 }}>
              <p><strong>Patient ID:</strong> {selectedBooking.userId}</p>
              <p><strong>Test:</strong> {selectedBooking.testName}</p>
              <p><strong>Method:</strong> {selectedBooking.collectionMethod.toUpperCase()}</p>
              {selectedBooking.location && (
                <p><strong>Address:</strong> {selectedBooking.location.address}</p>
              )}
            </div>

            {selectedBooking.location && (
              <div style={{ marginTop: 20, height: 250 }}>
                <Map 
                  center={[selectedBooking.location.lat, selectedBooking.location.lng]} 
                  zoom={15} 
                  markers={[{ id: '1', name: 'Collection Location', position: [selectedBooking.location.lat, selectedBooking.location.lng] }]}
                  height="100%"
                />
              </div>
            )}

            <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={() => setSelectedBooking(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
