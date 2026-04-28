import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  updateDoc,
  serverTimestamp,
  orderBy,
} from 'firebase/firestore';
import { Booking, Result, UserProfile, Lab } from './types';

// Seed initial tests to Firestore (run once from admin)
export async function seedTests() {
  if (!db) return;
  const { STATIC_TESTS } = await import('./types');
  const testsRef = collection(db, 'tests');
  for (const test of STATIC_TESTS) {
    await addDoc(testsRef, test);
  }
}

// User profile
export async function updateUserProfile(userId: string, profile: UserProfile['profile']) {
  if (!db) return;
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { profile });
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, 'users', userId));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

// Labs
export async function getLabs(): Promise<Lab[]> {
  if (!db) return [];
  const snap = await getDocs(query(collection(db, 'labs'), where('active', '==', true)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Lab));
}

// Bookings
export async function createBooking(booking: Omit<Booking, 'id' | 'createdAt'>): Promise<string> {
  if (!db) throw new Error('Firestore not initialized');
  const ref = await addDoc(collection(db, 'bookings'), {
    ...booking,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getUserBookings(userId: string): Promise<Booking[]> {
  if (!db) return [];
  const q = query(
    collection(db, 'bookings'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking));
}

export async function getAllBookings(): Promise<Booking[]> {
  if (!db) return [];
  const snap = await getDocs(query(collection(db, 'bookings'), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking));
}

export async function updateBookingPayment(bookingId: string, transactionCode: string) {
  if (!db) return;
  const ref = doc(db, 'bookings', bookingId);
  await updateDoc(ref, { paymentStatus: 'paid', transactionCode, status: 'confirmed' });
}

export async function updateBookingStatus(bookingId: string, status: Booking['status']) {
  if (!db) return;
  await updateDoc(doc(db, 'bookings', bookingId), { status });
}

// Results
export async function createResult(result: Omit<Result, 'id' | 'createdAt'>): Promise<string> {
  if (!db) throw new Error('Firestore not initialized');
  const ref = await addDoc(collection(db, 'results'), {
    ...result,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getUserResults(userId: string): Promise<Result[]> {
  if (!db) return [];
  const q = query(
    collection(db, 'results'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Result));
}

export async function updateResult(
  resultId: string,
  data: { doctorNotes: string; status: 'reviewed' }
) {
  if (!db) return;
  await updateDoc(doc(db, 'results', resultId), data);
}

export async function getAllResults(): Promise<Result[]> {
  if (!db) return [];
  const snap = await getDocs(query(collection(db, 'results'), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Result));
}
