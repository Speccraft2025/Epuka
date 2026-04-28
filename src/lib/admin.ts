import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  addDoc, 
  orderBy, 
  limit, 
  Timestamp,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Booking, Result, UserProfile, UserRole, AuditLog } from './types';

/**
 * AUDIT LOGGING
 */
export async function createAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>) {
  if (!db) return;
  try {
    await addDoc(collection(db, 'audit_logs'), {
      ...log,
      timestamp: serverTimestamp(),
    });
  } catch (e) {
    console.error('Audit log failed:', e);
  }
}

/**
 * BOOKINGS (ALL ADMINS)
 */
export async function adminGetAllBookings() {
  if (!db) return [];
  const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'), limit(100));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Booking));
}

export async function adminUpdateBookingStatus(
  bookingId: string, 
  status: Booking['status'], 
  adminId: string, 
  adminEmail: string,
  prevStatus: string
) {
  if (!db) return;
  const ref = doc(db, 'bookings', bookingId);
  await updateDoc(ref, { status });
  
  await createAuditLog({
    userId: adminId,
    userEmail: adminEmail,
    action: 'UPDATED_BOOKING_STATUS',
    entityId: bookingId,
    entityType: 'booking',
    previousValue: prevStatus,
    newValue: status
  });
}

/**
 * PAYMENTS (SUPER_ADMIN + OPS)
 */
export async function adminVerifyPayment(
  bookingId: string, 
  transactionCode: string, 
  status: 'paid' | 'unpaid',
  adminId: string,
  adminEmail: string
) {
  if (!db) return;
  const ref = doc(db, 'bookings', bookingId);
  await updateDoc(ref, { 
    paymentStatus: status,
    transactionCode: transactionCode,
    status: status === 'paid' ? 'confirmed' : 'pending'
  });

  await createAuditLog({
    userId: adminId,
    userEmail: adminEmail,
    action: 'VERIFIED_PAYMENT',
    entityId: bookingId,
    entityType: 'payment',
    newValue: { status, transactionCode }
  });
}

/**
 * RESULTS (MEDICAL_ADMIN + SUPER_ADMIN)
 */
export async function adminCreateResult(
  result: Omit<Result, 'id' | 'createdAt'>,
  adminId: string,
  adminEmail: string
) {
  if (!db) return;
  const res = await addDoc(collection(db, 'results'), {
    ...result,
    createdAt: serverTimestamp(),
  });

  await createAuditLog({
    userId: adminId,
    userEmail: adminEmail,
    action: 'CREATED_MEDICAL_RESULT',
    entityId: res.id,
    entityType: 'result',
    newValue: result
  });

  return res.id;
}

/**
 * USER MANAGEMENT (SUPER_ADMIN ONLY)
 */
export async function adminGetAllUsers() {
  if (!db) return [];
  const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile));
}

export async function adminUpdateUserRole(
  targetUserId: string, 
  newRole: UserRole, 
  adminId: string, 
  adminEmail: string,
  prevRole: string
) {
  if (!db) return;
  const ref = doc(db, 'users', targetUserId);
  await updateDoc(ref, { role: newRole });

  await createAuditLog({
    userId: adminId,
    userEmail: adminEmail,
    action: 'UPDATED_USER_ROLE',
    entityId: targetUserId,
    entityType: 'user',
    previousValue: prevRole,
    newValue: newRole
  });
}

/**
 * AUDIT LOGS
 */
export async function adminGetAuditLogs() {
  if (!db) return [];
  const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(50));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as AuditLog));
}
