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
import { Booking, Result, UserProfile } from './types';

// Seed initial tests to Firestore (run once from admin)
export async function seedTests() {
  const { STATIC_TESTS } = await import('./types');
  const testsRef = collection(db, 'tests');
  for (const test of STATIC_TESTS) {
    await addDoc(testsRef, test);
  }
}

// User profile
export async function updateUserProfile(userId: string, profile: UserProfile['profile']) {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { profile });
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', userId));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

// Bookings
export async function createBooking(booking: Omit<Booking, 'id' | 'createdAt'>): Promise<string> {
  const ref = await addDoc(collection(db, 'bookings'), {
    ...booking,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getUserBookings(userId: string): Promise<Booking[]> {
  const q = query(
    collection(db, 'bookings'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking));
}

export async function getAllBookings(): Promise<Booking[]> {
  const snap = await getDocs(query(collection(db, 'bookings'), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking));
}

export async function updateBookingPayment(bookingId: string, transactionCode: string) {
  const ref = doc(db, 'bookings', bookingId);
  await updateDoc(ref, { paymentStatus: 'paid', transactionCode, status: 'confirmed' });
}

export async function updateBookingStatus(bookingId: string, status: Booking['status']) {
  await updateDoc(doc(db, 'bookings', bookingId), { status });
}

// Results
export async function createResult(result: Omit<Result, 'id' | 'createdAt'>): Promise<string> {
  const ref = await addDoc(collection(db, 'results'), {
    ...result,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getUserResults(userId: string): Promise<Result[]> {
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
  await updateDoc(doc(db, 'results', resultId), data);
}

export async function getAllResults(): Promise<Result[]> {
  const snap = await getDocs(query(collection(db, 'results'), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Result));
}
