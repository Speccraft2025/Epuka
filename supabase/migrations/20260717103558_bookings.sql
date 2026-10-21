-- Bookings: the 9-state lifecycle, enforced in the database.
--
-- Previously ALLOWED_TRANSITIONS in src/lib/admin.ts was the only thing
-- enforcing sequence, and it ran client-side. firestore.rules only checked
-- status != 'CLOSED', so the "no step can be skipped" guarantee in the brief
-- was not actually enforced anywhere a client couldn't bypass.

create table public.bookings (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade,

  test_id           text references public.tests(id),
  -- test_name/price/lab_name are point-in-time snapshots of what the patient
  -- booked and agreed to pay. They must NOT follow later edits to the
  -- reference tables, so they are stored rather than joined.
  test_name         text not null,
  price             integer not null check (price >= 0),

  booking_date      timestamptz not null,
  collection_method public.collection_method not null,

  lab_id            text references public.labs(id),
  lab_name          text,
  home_address      text,

  status            public.booking_status not null default 'BOOKED',
  payment_status    public.payment_status not null default 'unpaid',
  transaction_code  text,

  location_lat      numeric(9,6) check (location_lat is null or location_lat between -90 and 90),
  location_lng      numeric(9,6) check (location_lng is null or location_lng between -180 and 180),
  location_address  text,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  -- A home collection needs somewhere to collect from.
  constraint home_collection_needs_location check (
    collection_method <> 'home' or (location_lat is not null and location_lng is not null)
  )
);

create index bookings_user_idx    on public.bookings (user_id, created_at desc);
create index bookings_status_idx  on public.bookings (status, created_at desc);
create index bookings_lab_idx     on public.bookings (lab_id) where lab_id is not null;

-- The state machine as data, mirroring ALLOWED_TRANSITIONS exactly.
create table private.booking_transitions (
  from_status public.booking_status not null,
  to_status   public.booking_status not null,
  primary key (from_status, to_status)
);

insert into private.booking_transitions (from_status, to_status) values
  ('BOOKED',            'PAYMENT_PENDING'),
  ('BOOKED',            'CLOSED'),
  ('PAYMENT_PENDING',   'PAYMENT_CONFIRMED'),
  ('PAYMENT_PENDING',   'CLOSED'),
  ('PAYMENT_CONFIRMED', 'ASSIGNED_TO_LAB'),
  ('ASSIGNED_TO_LAB',   'SAMPLE_COLLECTED'),
  ('SAMPLE_COLLECTED',  'IN_ANALYSIS'),
  ('IN_ANALYSIS',       'VERIFIED'),
  ('VERIFIED',          'DELIVERED'),
  ('DELIVERED',         'CLOSED');

create function private.guard_booking_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role public.user_role := private.auth_role();
begin
  new.updated_at := now();

  -- CLOSED is terminal and archival. Only a SUPER_ADMIN may reopen it,
  -- and migration 20260717000006 records that override in the audit log.
  if old.status = 'CLOSED' and v_role is distinct from 'SUPER_ADMIN' then
    raise exception 'Booking % is CLOSED and cannot be modified', old.id
      using errcode = 'insufficient_privilege';
  end if;

  -- Patients may only attach an M-Pesa code and move BOOKED -> PAYMENT_PENDING.
  -- Comparing the row minus the permitted columns is how we keep this honest
  -- as columns are added later: a new column is locked down by default.
  if v_role = 'PATIENT' then
    if (to_jsonb(new) - 'transaction_code' - 'status' - 'updated_at')
       is distinct from
       (to_jsonb(old) - 'transaction_code' - 'status' - 'updated_at') then
      raise exception 'Patients may only submit a payment transaction code'
        using errcode = 'insufficient_privilege';
    end if;

    if new.status is distinct from old.status
       and not (old.status = 'BOOKED' and new.status = 'PAYMENT_PENDING') then
      raise exception 'Patients may only move a booking from BOOKED to PAYMENT_PENDING'
        using errcode = 'insufficient_privilege';
    end if;
  end if;

  -- SUPER_ADMIN retains the documented override; everyone else walks the graph.
  if new.status is distinct from old.status
     and v_role is distinct from 'SUPER_ADMIN'
     and not exists (
       select 1 from private.booking_transitions
       where from_status = old.status and to_status = new.status
     ) then
    raise exception 'Invalid state transition: % -> %', old.status, new.status
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger bookings_guard_update
  before update on public.bookings
  for each row execute function private.guard_booking_update();

alter table public.bookings enable row level security;

create policy "patient reads own bookings"
  on public.bookings for select to authenticated
  using ( (select auth.uid()) = user_id );

create policy "staff read all bookings"
  on public.bookings for select to authenticated
  using ( private.is_staff() );

-- A patient may only create a booking for themselves, and only at the start
-- of the lifecycle: WITH CHECK stops a client POSTing status='DELIVERED'.
create policy "patient creates own booking"
  on public.bookings for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and status = 'BOOKED'
    and payment_status = 'unpaid'
  );

-- UPDATE needs a matching SELECT policy to see the row first; the read
-- policies above cover that. Column-level limits live in the trigger.
create policy "patient updates own booking"
  on public.bookings for update to authenticated
  using ( (select auth.uid()) = user_id )
  with check ( (select auth.uid()) = user_id );

create policy "ops updates bookings"
  on public.bookings for update to authenticated
  using ( private.is_ops() ) with check ( private.is_ops() );

create policy "medical updates bookings"
  on public.bookings for update to authenticated
  using ( private.is_medical_admin() ) with check ( private.is_medical_admin() );

-- No DELETE policy for anyone: bookings are closed, never deleted.
