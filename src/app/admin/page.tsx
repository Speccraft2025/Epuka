'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { adminGetAllBookings, adminGetAllResults } from '@/lib/admin';
import { Booking, Result } from '@/lib/types';
import Link from 'next/link';
import styles from './page.module.css';

export default function AdminDashboard() {
  const { role } = useAuth();
  const [data, setData] = useState<{ bookings: Booking[], results: Result[] }>({ bookings: [], results: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [bookings, results] = await Promise.all([adminGetAllBookings(), adminGetAllResults()]);
      setData({ bookings, results });
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  const renderQueueItem = (title: string, count: number, path: string, color?: string) => (
    <Link href={path} className={styles.queueCard}>
      <div className={styles.queueHeader}>
        <span className={styles.queueTitle}>{title}</span>
        <span className={styles.queueCount} style={color ? { backgroundColor: color, color: 'white' } : {}}>{count}</span>
      </div>
      <div className={styles.queueAction}>View Queue →</div>
    </Link>
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Operations Dashboard</h1>
        <p>Prioritized work queues by role.</p>
      </header>

      {(role === 'SUPER_ADMIN' || role === 'OPS') && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Logistics Queue (OPS)</h2>
          <div className={styles.queueGrid}>
            {renderQueueItem("New Bookings", data.bookings.filter(b => b.status === 'BOOKED').length, "/admin/bookings", "var(--clr-blue)")}
            {renderQueueItem("Pending Payment", data.bookings.filter(b => b.status === 'PAYMENT_PENDING').length, "/admin/bookings", "var(--clr-warning)")}
            {renderQueueItem("Ready for Collection", data.bookings.filter(b => b.status === 'PAYMENT_CONFIRMED').length, "/admin/bookings", "var(--clr-green)")}
            {renderQueueItem("Active Logistics", data.bookings.filter(b => ['ASSIGNED_TO_LAB', 'SAMPLE_COLLECTED'].includes(b.status)).length, "/admin/logistics")}
          </div>
        </section>
      )}

      {(role === 'SUPER_ADMIN' || role === 'MEDICAL_ADMIN') && (
        <section className={styles.section} style={{ marginTop: 48 }}>
          <h2 className={styles.sectionTitle}>Clinical Queue (Medical)</h2>
          <div className={styles.queueGrid}>
            {renderQueueItem("Urgent Analysis", data.results.filter(r => r.flag === 'URGENT' && r.medicalApprovalStatus === 'PENDING').length, "/admin/results", "var(--clr-red)")}
            {renderQueueItem("Pending Approval", data.results.filter(r => r.medicalApprovalStatus === 'PENDING').length, "/admin/results", "var(--clr-blue)")}
            {renderQueueItem("Verified Today", data.results.filter(r => r.medicalApprovalStatus === 'APPROVED').length, "/admin/results")}
          </div>
        </section>
      )}
    </div>
  );
}
