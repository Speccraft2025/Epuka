'use client';

import { useEffect, useState } from 'react';
import { adminGetAllBookings, adminGetLabs } from '@/lib/admin';
import { Booking, Lab } from '@/lib/types';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import styles from '../page.module.css';

const Map = dynamic(() => import('@/components/Map'), { ssr: false });

export default function LogisticsDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [bData, lData] = await Promise.all([
        adminGetAllBookings(),
        adminGetLabs()
      ]);
      setBookings(bData.filter(b => ['PAYMENT_CONFIRMED', 'ASSIGNED_TO_LAB', 'SAMPLE_COLLECTED'].includes(b.status)));
      setLabs(lData);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="loading-screen">Loading Logistics Map...</div>;

  const markers = [
    ...labs.map(l => ({ id: l.id, name: `LAB: ${l.name}`, position: [l.coordinates.lat, l.coordinates.lng] as [number, number] })),
    ...bookings.filter(b => b.location).map(b => ({ id: b.id, name: `COLLECTION: ${b.testName} (${b.status})`, position: [b.location!.lat, b.location!.lng] as [number, number] }))
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Logistics Command Center</h1>
        <p>Real-time view of active collection points and destination labs.</p>
      </header>

      <div style={{ height: '70vh', borderRadius: 24, overflow: 'hidden', border: '1px solid var(--clr-border)' }}>
        <Map 
          center={[-1.2921, 36.8219]} // Nairobi
          zoom={12}
          markers={markers}
          height="100%"
        />
      </div>

      <div style={{ marginTop: 32 }}>
        <h3>Active Tasks</h3>
        <div className={styles.tableContainer}>
          <table className={styles.adminTable}>
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Status</th>
                <th>Location</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b.id}>
                  <td className={styles.mono}>{b.id.slice(0, 8)}</td>
                  <td><span className="badge badge-yellow">{b.status}</span></td>
                  <td>{b.location?.address.slice(0, 40)}...</td>
                  <td>
                    <Link href={`/admin/bookings?id=${b.id}`} className="btn btn-sm btn-outline">Update State</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
