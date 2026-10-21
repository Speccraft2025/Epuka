import { getSupabase } from './supabase';
import { toBooking, toLab, toResult, toUserProfile, unwrap, unwrapOne } from './data';
import { AuditLog, Booking, BookingStatus, Lab, Result, UserProfile, UserRole } from './types';

/**
 * The lifecycle graph, mirrored from private.booking_transitions. The
 * database is what enforces it (bookings_guard_update trigger); this copy is
 * only used to render the "next step" buttons and to walk a booking forward.
 */
export const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  BOOKED: ['PAYMENT_PENDING', 'CLOSED'],
  PAYMENT_PENDING: ['PAYMENT_CONFIRMED', 'CLOSED'],
  PAYMENT_CONFIRMED: ['ASSIGNED_TO_LAB'],
  ASSIGNED_TO_LAB: ['SAMPLE_COLLECTED'],
  SAMPLE_COLLECTED: ['IN_ANALYSIS'],
  IN_ANALYSIS: ['VERIFIED'],
  VERIFIED: ['DELIVERED'],
  DELIVERED: ['CLOSED'],
  CLOSED: [],
};

const LIFECYCLE: BookingStatus[] = [
  'BOOKED',
  'PAYMENT_PENDING',
  'PAYMENT_CONFIRMED',
  'ASSIGNED_TO_LAB',
  'SAMPLE_COLLECTED',
  'IN_ANALYSIS',
  'VERIFIED',
  'DELIVERED',
  'CLOSED',
];

// Audit logging is no longer done from the browser. Triggers in
// supabase/migrations/*_audit_logs.sql write every booking transition,
// payment change, result creation/approval and role change in the same
// transaction as the change itself.

/* ------------------------------------------------------------------------ */
/* BOOKINGS (all staff)                                                      */
/* ------------------------------------------------------------------------ */

export async function adminGetAllBookings(): Promise<Booking[]> {
  const rows = unwrapOne(
    await getSupabase()
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
  );
  return rows.map(toBooking);
}

/** Moves a booking one step. Invalid jumps are rejected by the database. */
export async function adminTransitionBookingState(bookingId: string, newState: BookingStatus) {
  unwrapOne(
    await getSupabase()
      .from('bookings')
      .update({ status: newState })
      .eq('id', bookingId)
      .select('id')
      .single()
  );
}

/** Walks a booking forward one valid step at a time until it reaches `target`. */
async function walkBookingTo(bookingId: string, from: BookingStatus, target: BookingStatus) {
  let current = from;
  while (LIFECYCLE.indexOf(current) < LIFECYCLE.indexOf(target)) {
    const next = LIFECYCLE[LIFECYCLE.indexOf(current) + 1];
    if (!ALLOWED_TRANSITIONS[current].includes(next)) {
      throw new Error(`Cannot move booking from ${current} to ${next}`);
    }
    await adminTransitionBookingState(bookingId, next);
    current = next;
  }
}

/* ------------------------------------------------------------------------ */
/* PAYMENTS (OPS + SUPER_ADMIN)                                              */
/* ------------------------------------------------------------------------ */

export async function adminVerifyPayment(
  bookingId: string,
  transactionCode: string,
  status: 'paid' | 'unpaid',
  currentStatus: BookingStatus
) {
  const nextStatus: BookingStatus = status === 'paid' ? 'PAYMENT_CONFIRMED' : 'PAYMENT_PENDING';
  // A code taken over the phone for a BOOKED order still has to pass through
  // PAYMENT_PENDING: the database rejects BOOKED -> PAYMENT_CONFIRMED.
  if (currentStatus === 'BOOKED') {
    await adminTransitionBookingState(bookingId, 'PAYMENT_PENDING');
  }
  unwrapOne(
    await getSupabase()
      .from('bookings')
      .update({ payment_status: status, transaction_code: transactionCode, status: nextStatus })
      .eq('id', bookingId)
      .select('id')
      .single()
  );
}

/* ------------------------------------------------------------------------ */
/* RESULTS (MEDICAL_ADMIN + SUPER_ADMIN)                                     */
/* ------------------------------------------------------------------------ */

export async function adminGetAllResults(): Promise<Result[]> {
  const rows = unwrapOne(
    await getSupabase().from('results').select('*').order('created_at', { ascending: false })
  );
  return rows.map(toResult);
}

export interface ReleaseResultInput {
  booking: Booking;
  rawResults: Result['rawResults'];
  doctorNotes: string;
  flag: Result['flag'];
  followUpAction?: string;
  approverId: string;
}

/**
 * Records a medical result, signs it off and releases it to the patient:
 * booking -> VERIFIED, result inserted as APPROVED, booking -> DELIVERED.
 * The patient can only see a result once both are true (results RLS policy).
 * An URGENT result without a follow-up action is rejected by the
 * urgent_requires_follow_up constraint.
 */
export async function adminReleaseResult(input: ReleaseResultInput): Promise<string> {
  const { booking } = input;
  if (LIFECYCLE.indexOf(booking.status) < LIFECYCLE.indexOf('SAMPLE_COLLECTED')) {
    throw new Error('Results can only be entered once the sample has been collected.');
  }

  await walkBookingTo(booking.id, booking.status, 'VERIFIED');

  const row = unwrapOne(
    await getSupabase()
      .from('results')
      .insert({
        booking_id: booking.id,
        user_id: booking.userId,
        raw_results: input.rawResults,
        doctor_notes: input.doctorNotes,
        flag: input.flag,
        follow_up_action: input.followUpAction?.trim() || null,
        status: 'reviewed',
        medical_approval_status: 'APPROVED',
        approved_by: input.approverId,
        approved_at: new Date().toISOString(),
      })
      .select('id')
      .single()
  );

  await adminTransitionBookingState(booking.id, 'DELIVERED');
  return row.id;
}

/* ------------------------------------------------------------------------ */
/* USER MANAGEMENT (SUPER_ADMIN only)                                        */
/* ------------------------------------------------------------------------ */

export async function adminGetAllUsers(): Promise<UserProfile[]> {
  const rows = unwrapOne(
    await getSupabase().from('profiles').select('*').order('created_at', { ascending: false })
  );
  return rows.map(toUserProfile);
}

/** Role changes are guarded (SUPER_ADMIN only) and audited by database triggers. */
export async function adminUpdateUserRole(targetUserId: string, newRole: UserRole) {
  unwrapOne(
    await getSupabase()
      .from('profiles')
      .update({ role: newRole })
      .eq('id', targetUserId)
      .select('id')
      .single()
  );
}

/* ------------------------------------------------------------------------ */
/* AUDIT LOG (SUPER_ADMIN only, read-only)                                   */
/* ------------------------------------------------------------------------ */

export async function adminGetAuditLogs(): Promise<AuditLog[]> {
  const rows = unwrapOne(
    await getSupabase()
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
  );
  return rows.map((r) => ({
    id: r.id,
    userId: r.actor_id,
    userEmail: r.actor_email,
    userRole: r.actor_role,
    action: r.action,
    entityId: r.entity_id,
    entityType: r.entity_type,
    previousValue: r.previous_value,
    newValue: r.new_value,
    timestamp: new Date(r.created_at),
  }));
}

/* ------------------------------------------------------------------------ */
/* LABS                                                                      */
/* ------------------------------------------------------------------------ */

export async function adminGetLabs(): Promise<Lab[]> {
  const rows = unwrapOne(await getSupabase().from('labs').select('*').order('name'));
  return rows.map(toLab);
}
