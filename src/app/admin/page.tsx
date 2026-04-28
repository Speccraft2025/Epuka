'use client';

import { useEffect, useState } from 'react';
import { adminGetAllBookings, adminGetAllUsers } from '@/lib/admin';
import { Booking, UserProfile } from '@/lib/types';
import styles from './page.module.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingPayments: 0,
    pendingResults: 0,
    totalUsers: 0
  });

  useEffect(() => {
    (async () => {
      const [bookings, users] = await Promise.all([
        adminGetAllBookings(),
        adminGetAllUsers()
      ]);

      setStats({
        totalBookings: bookings.length,
        pendingPayments: bookings.filter(b => b.paymentStatus === 'unpaid').length,
        pendingResults: bookings.filter(b => b.status === 'confirmed').length,
        totalUsers: users.length
      });
    })();
  }, []);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Operations Overview</h1>
        <p>System status and pending actions.</p>
      </header>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Bookings</span>
          <div className={styles.statValue}>{stats.totalBookings}</div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Pending Payments</span>
          <div className={styles.statValue} style={{ color: 'var(--clr-warning)' }}>{stats.pendingPayments}</div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Awaiting Results</span>
          <div className={styles.statValue} style={{ color: 'var(--clr-blue)' }}>{stats.pendingResults}</div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Registered Users</span>
          <div className={styles.statValue}>{stats.totalUsers}</div>
        </div>
      </div>

      <section className={styles.alertSection}>
        <h3>System Alerts</h3>
        <div className={styles.alertList}>
          {stats.pendingPayments > 0 && (
            <div className={styles.alertItem}>
              <span>⚠️ {stats.pendingPayments} bookings require payment verification.</span>
              <a href="/admin/payments">Verify Now →</a>
            </div>
          )}
          {stats.pendingResults > 0 && (
            <div className={styles.alertItem}>
              <span>🩺 {stats.pendingResults} confirmed tests are ready for medical results.</span>
              <a href="/admin/results">Enter Results →</a>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
