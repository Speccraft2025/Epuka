'use client';

import { useEffect, useState } from 'react';
import { adminGetAuditLogs } from '@/lib/admin';
import { AuditLog } from '@/lib/types';
import styles from '../page.module.css';

export default function AuditLogsAdmin() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const data = await adminGetAuditLogs();
      setLogs(data);
      setLoading(false);
    })();
  }, []);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>System Audit Logs</h1>
        <p>Immutable record of all administrative actions.</p>
      </header>

      <div className={styles.tableContainer}>
        <table className={styles.adminTable}>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Admin</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td className={styles.mono} style={{ fontSize: '0.75rem' }}>
                  {log.timestamp ? new Date((log.timestamp as any).seconds * 1000).toLocaleString() : '—'}
                </td>
                <td>
                  <div style={{ fontWeight: 600 }}>{log.userEmail}</div>
                  <div className={styles.mono} style={{ fontSize: '0.7rem' }}>{log.userId.slice(0, 8)}</div>
                </td>
                <td>
                  <span className={styles.badge} style={{ background: 'var(--clr-surface-2)', color: 'var(--clr-green)' }}>
                    {log.action}
                  </span>
                </td>
                <td>
                  <div style={{ fontWeight: 500 }}>{log.entityType.toUpperCase()}</div>
                  <div className={styles.mono} style={{ fontSize: '0.7rem' }}>{log.entityId.slice(0, 8)}</div>
                </td>
                <td style={{ fontSize: '0.8rem', color: 'var(--clr-text-dim)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {log.previousValue ? `From ${JSON.stringify(log.previousValue)} ` : ''}
                  To {JSON.stringify(log.newValue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
