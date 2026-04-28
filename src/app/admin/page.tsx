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
      const [bookings, results] = await Promise.all([
        adminGetAllBookings(),
        adminGetAllResults()
      ]);
      setData({ bookings, results });
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  const isToday = (date: any) => {
    if (!date) return false;
    const d = new Date((date as any).seconds * 1000);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  };

  // Queues
  const opsQueues = {
    pendingPayments: data.bookings.filter(b => b.paymentStatus === 'unpaid'),
    scheduledToday: data.bookings.filter(b => isToday(b.date)),
    readyForLab: data.bookings.filter(b => b.paymentStatus === 'paid' && b.status === 'confirmed'),
    completed: data.bookings.filter(b => b.status === 'completed'),
  };

  const medicalQueues = {
    awaitingReview: data.results.filter(r => r.status === 'pending'),
    urgentCases: data.results.filter(r => r.flag === 'URGENT' && r.status === 'pending'),
    approvedToday: data.results.filter(r => r.status === 'reviewed' && isToday(r.createdAt)),
  };

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
        <h1>Today&apos;s Operations</h1>
        <p>Prioritized work queues based on your role.</p>
      </header>

      {(role === 'SUPER_ADMIN' || role === 'OPS') && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Logistics & Payments (OPS)</h2>
          <div className={styles.queueGrid}>
            {renderQueueItem("Pending Payments", opsQueues.pendingPayments.length, "/admin/payments", opsQueues.pendingPayments.length > 0 ? "var(--clr-warning)" : undefined)}
            {renderQueueItem("Scheduled Today", opsQueues.scheduledToday.length, "/admin/bookings")}
            {renderQueueItem("Ready for Lab", opsQueues.readyForLab.length, "/admin/bookings", "var(--clr-blue)")}
            {renderQueueItem("Completed", opsQueues.completed.length, "/admin/bookings")}
          </div>
        </section>
      )}

      {(role === 'SUPER_ADMIN' || role === 'MEDICAL_ADMIN') && (
        <section className={styles.section} style={{ marginTop: 48 }}>
          <h2 className={styles.sectionTitle}>Medical Review (Clinical)</h2>
          <div className={styles.queueGrid}>
            {renderQueueItem("Urgent Cases", medicalQueues.urgentCases.length, "/admin/results", medicalQueues.urgentCases.length > 0 ? "var(--clr-red)" : undefined)}
            {renderQueueItem("Awaiting Review", medicalQueues.awaitingReview.length, "/admin/results", medicalQueues.awaitingReview.length > 0 ? "var(--clr-blue)" : undefined)}
            {renderQueueItem("Approved Today", medicalQueues.approvedToday.length, "/admin/results")}
          </div>
        </section>
      )}
    </div>
  );
}
