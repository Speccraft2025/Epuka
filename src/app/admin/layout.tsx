'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import styles from './layout.module.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, role } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user || role === 'PATIENT') {
        router.push('/');
      }
    }
  }, [user, loading, role, router]);

  if (loading || !user || role === 'PATIENT') {
    return <div className="loading-screen"><div className="spinner" /></div>;
  }

  const menuItems = [
    { label: 'Dashboard', path: '/admin', roles: ['SUPER_ADMIN', 'MEDICAL_ADMIN', 'OPS'] },
    { label: 'Bookings', path: '/admin/bookings', roles: ['SUPER_ADMIN', 'MEDICAL_ADMIN', 'OPS'] },
    { label: 'Payments', path: '/admin/payments', roles: ['SUPER_ADMIN', 'OPS'] },
    { label: 'Results', path: '/admin/results', roles: ['SUPER_ADMIN', 'MEDICAL_ADMIN'] },
    { label: 'Users', path: '/admin/users', roles: ['SUPER_ADMIN'] },
    { label: 'Audit Logs', path: '/admin/audit', roles: ['SUPER_ADMIN'] },
  ];

  return (
    <div className={styles.adminContainer}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <Link href="/">epuka<span>admin</span></Link>
        </div>
        
        <nav className={styles.nav}>
          {menuItems.map((item) => {
            if (!item.roles.includes(role)) return null;
            const isActive = pathname === item.path;
            return (
              <Link 
                key={item.path} 
                href={item.path} 
                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className={styles.userSection}>
          <div className={styles.userInfo}>
            <p className={styles.userName}>{user.displayName}</p>
            <p className={styles.userRole}>{role.replace('_', ' ')}</p>
          </div>
          <Link href="/" className={styles.exitBtn}>Exit Admin</Link>
        </div>
      </aside>

      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}
