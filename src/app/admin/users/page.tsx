'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { adminGetAllUsers, adminUpdateUserRole } from '@/lib/admin';
import { UserProfile, UserRole } from '@/lib/types';
import styles from '../page.module.css';

export default function UsersAdmin() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const data = await adminGetAllUsers();
    setUsers(data);
    setLoading(false);
  };

  const handleRoleChange = async (targetUser: UserProfile, newRole: UserRole) => {
    if (!user) return;
    if (targetUser.uid === user.uid) {
      alert("You cannot change your own role.");
      return;
    }
    await adminUpdateUserRole(targetUser.uid, newRole, user.uid, user.email || '', targetUser.role);
    fetchUsers();
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>User Access Control</h1>
        <p>Manage system permissions and administrative roles.</p>
      </header>

      <div className={styles.tableContainer}>
        <table className={styles.adminTable}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.uid}>
                <td style={{ fontWeight: 600 }}>{u.displayName}</td>
                <td className={styles.mono}>{u.email}</td>
                <td>
                  <span className={`badge ${u.role === 'SUPER_ADMIN' ? 'badge-red' : u.role === 'PATIENT' ? '' : 'badge-blue'}`} style={{ border: u.role === 'PATIENT' ? '1px solid var(--clr-border)' : 'none' }}>
                    {u.role}
                  </span>
                </td>
                <td>{new Date((u.createdAt as any).seconds * 1000).toLocaleDateString()}</td>
                <td>
                  <select 
                    className="form-input" 
                    style={{ padding: '4px 8px', fontSize: '0.8rem', width: 140 }}
                    value={u.role}
                    onChange={(e) => handleRoleChange(u, e.target.value as UserRole)}
                    disabled={u.uid === user?.uid}
                  >
                    <option value="PATIENT">Patient</option>
                    <option value="OPS">Operations</option>
                    <option value="MEDICAL_ADMIN">Medical Admin</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
