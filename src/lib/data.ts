import { getSupabase } from './supabase';
import type { Database } from './database.types';
import { Booking, Lab, Result, Test, UserProfile, STATIC_TESTS } from './types';

type Tables = Database['public']['Tables'];
export type ProfileRow = Tables['profiles']['Row'];
export type BookingRow = Tables['bookings']['Row'];
export type ResultRow = Tables['results']['Row'];
export type LabRow = Tables['labs']['Row'];
export type TestRow = Tables['tests']['Row'];

/**
 * Supabase returns `{ data, error }` rather than throwing. Every call in the
 * data layer goes through this so a failed write can never look like success.
 */
export function unwrap<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

/** Like unwrap, for queries that must return data (lists, .single()). */
export function unwrapOne<T>(res: { data: T; error: { message: string } | null }): NonNullable<T> {
  if (res.error) throw new Error(res.error.message);
  if (res.data === null || res.data === undefined) {
    throw new Error('No data returned (the row may not exist, or you lack access).');
  }
  return res.data as NonNullable<T>;
}

// ---------------------------------------------------------------------------
// Row <-> app-type mappers. The UI keeps its camelCase shapes; the database
// uses snake_case columns. Mapping lives here and nowhere else.
// ---------------------------------------------------------------------------

export function toUserProfile(r: ProfileRow): UserProfile {
  const onboarded = r.age !== null;
  return {
    uid: r.id,
    displayName: r.display_name ?? '',
    email: r.email,
    photoURL: r.photo_url ?? undefined,
    role: r.role,
    createdAt: new Date(r.created_at),
    profile: onboarded
      ? {
          age: r.age!,
          gender: r.gender ?? '',
          height: Number(r.height_cm ?? 0),
          weight: Number(r.weight_kg ?? 0),
          lifestyle: {
            smoker: !!r.smoker,
            alcohol: !!r.alcohol,
            exercise: r.exercise ?? 'none',
          },
        }
      : null,
  };
}

export function toBooking(r: BookingRow): Booking {
  return {
    id: r.id,
    userId: r.user_id,
    testId: r.test_id ?? '',
    testName: r.test_name,
    date: new Date(r.booking_date),
    collectionMethod: r.collection_method,
    labId: r.lab_id ?? undefined,
    labName: r.lab_name ?? undefined,
    homeAddress: r.home_address ?? undefined,
    status: r.status,
    paymentStatus: r.payment_status,
    transactionCode: r.transaction_code ?? undefined,
    price: r.price,
    location:
      r.location_lat !== null && r.location_lng !== null
        ? { lat: Number(r.location_lat), lng: Number(r.location_lng), address: r.location_address ?? '' }
        : undefined,
    createdAt: new Date(r.created_at),
  };
}

export function toResult(r: ResultRow): Result {
  return {
    id: r.id,
    userId: r.user_id,
    bookingId: r.booking_id,
    rawResults: (r.raw_results ?? {}) as Result['rawResults'],
    doctorNotes: r.doctor_notes ?? '',
    flag: r.flag,
    followUpAction: r.follow_up_action ?? undefined,
    status: r.status,
    medicalApprovalStatus: r.medical_approval_status,
    approvedBy: r.approved_by,
    approvedAt: r.approved_at ? new Date(r.approved_at) : null,
    createdAt: new Date(r.created_at),
  };
}

export function toLab(r: LabRow): Lab {
  return {
    id: r.id,
    name: r.name,
    address: r.address,
    neighborhood: r.neighborhood,
    coordinates: { lat: Number(r.lat), lng: Number(r.lng) },
    active: r.active,
  };
}

export function toTest(r: TestRow): Test {
  return {
    id: r.id,
    name: r.name,
    price: r.price,
    description: r.description,
    includedTests: r.included_tests,
    icon: r.icon ?? '🧪',
    popular: r.popular,
  };
}

// ---------------------------------------------------------------------------
// Profiles
// ---------------------------------------------------------------------------

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const row = unwrap(
    await getSupabase().from('profiles').select('*').eq('id', userId).maybeSingle()
  );
  return row ? toUserProfile(row) : null;
}

export async function updateUserProfile(userId: string, profile: NonNullable<UserProfile['profile']>) {
  unwrapOne(
    await getSupabase()
      .from('profiles')
      .update({
        age: profile.age,
        gender: profile.gender,
        height_cm: profile.height,
        weight_kg: profile.weight,
        smoker: profile.lifestyle.smoker,
        alcohol: profile.lifestyle.alcohol,
        exercise: profile.lifestyle.exercise,
      })
      .eq('id', userId)
      .select('id')
      .single()
  );
}

// ---------------------------------------------------------------------------
// Reference data
// ---------------------------------------------------------------------------

export async function getLabs(): Promise<Lab[]> {
  const rows = unwrapOne(
    await getSupabase().from('labs').select('*').eq('active', true).order('name')
  );
  return rows.map(toLab);
}

/** Test panels from the database; falls back to the bundled list if unreachable. */
export async function getTests(): Promise<Test[]> {
  try {
    const rows = unwrapOne(
      await getSupabase().from('tests').select('*').eq('active', true).order('price')
    );
    return rows.length ? rows.map(toTest) : STATIC_TESTS;
  } catch (e) {
    console.error('Falling back to bundled test list:', e);
    return STATIC_TESTS;
  }
}

// ---------------------------------------------------------------------------
// Bookings (patient side)
// ---------------------------------------------------------------------------

export interface NewBooking {
  userId: string;
  testId: string;
  testName: string;
  price: number;
  date: Date;
  collectionMethod: 'lab' | 'home';
  labId?: string;
  labName?: string;
  homeAddress?: string;
  location?: { lat: number; lng: number; address?: string };
}

/** Creates a booking at the start of the lifecycle (BOOKED, unpaid). */
export async function createBooking(b: NewBooking): Promise<string> {
  const row = unwrapOne(
    await getSupabase()
      .from('bookings')
      .insert({
        user_id: b.userId,
        test_id: b.testId,
        test_name: b.testName,
        price: b.price,
        booking_date: b.date.toISOString(),
        collection_method: b.collectionMethod,
        lab_id: b.labId ?? null,
        lab_name: b.labName ?? null,
        home_address: b.homeAddress ?? null,
        location_lat: b.location?.lat ?? null,
        location_lng: b.location?.lng ?? null,
        location_address: b.location?.address ?? null,
      })
      .select('id')
      .single()
  );
  return row.id;
}

/**
 * Patient submits their M-Pesa code. This only moves BOOKED -> PAYMENT_PENDING;
 * OPS confirms the payment against the statement. The database trigger stops a
 * patient marking their own booking as paid.
 */
export async function submitPaymentCode(bookingId: string, transactionCode: string) {
  unwrapOne(
    await getSupabase()
      .from('bookings')
      .update({ transaction_code: transactionCode.trim(), status: 'PAYMENT_PENDING' })
      .eq('id', bookingId)
      .select('id')
      .single()
  );
}

export async function getUserBookings(userId: string): Promise<Booking[]> {
  const rows = unwrapOne(
    await getSupabase()
      .from('bookings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
  );
  return rows.map(toBooking);
}

// ---------------------------------------------------------------------------
// Results (patient side). RLS only returns results that are medically
// APPROVED and whose booking is DELIVERED or CLOSED.
// ---------------------------------------------------------------------------

export async function getUserResults(userId: string): Promise<Result[]> {
  const rows = unwrapOne(
    await getSupabase()
      .from('results')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
  );
  return rows.map(toResult);
}
