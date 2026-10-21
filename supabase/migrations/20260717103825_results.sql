-- Results: lab values, clinical guidance output, and the medical Safety Lock.
--
-- OPS has no policy on this table at all. Per the brief, OPS reads bookings
-- but must not touch medical records; absence of a policy is what enforces it.

create type public.result_review_status as enum ('pending', 'reviewed');

create table public.results (
  id                      uuid primary key default gen_random_uuid(),
  -- One result per booking. The app already assumes this; make it true.
  booking_id              uuid not null unique references public.bookings(id) on delete cascade,
  user_id                 uuid not null references public.profiles(id) on delete cascade,

  -- Genuinely schemaless: the metric set differs per panel.
  -- Shape: { "Glucose": { value, unit, range, status }, ... }
  raw_results             jsonb not null default '{}'::jsonb,

  doctor_notes            text,
  flag                    public.medical_flag not null default 'NORMAL',
  follow_up_action        text,
  status                  public.result_review_status not null default 'pending',
  medical_approval_status public.approval_status not null default 'PENDING',

  approved_by             uuid references public.profiles(id),
  approved_at             timestamptz,

  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),

  -- SAFETY LOCK, as a constraint rather than a UI convention:
  -- an URGENT result cannot reach APPROVED without a documented follow-up.
  constraint urgent_requires_follow_up check (
    medical_approval_status <> 'APPROVED'
    or flag <> 'URGENT'
    or (follow_up_action is not null and length(trim(follow_up_action)) > 0)
  ),

  -- An approval must always name who approved it and when.
  constraint approval_requires_signatory check (
    medical_approval_status <> 'APPROVED'
    or (approved_by is not null and approved_at is not null)
  ),

  constraint raw_results_is_object check ( jsonb_typeof(raw_results) = 'object' )
);

create index results_user_idx    on public.results (user_id, created_at desc);
create index results_booking_idx on public.results (booking_id);
-- Drives the "Urgent - Awaiting Sign-off" and "Pending Review" medical queues.
create index results_triage_idx  on public.results (medical_approval_status, flag, created_at desc);

create function private.touch_result()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger results_touch before update on public.results
  for each row execute function private.touch_result();

alter table public.results enable row level security;

-- The patient-visible gate. Both conditions come from the documented model:
-- medical approval AND the booking having actually been dispatched.
create policy "patient reads own approved results"
  on public.results for select to authenticated
  using (
    (select auth.uid()) = user_id
    and medical_approval_status = 'APPROVED'
    and exists (
      select 1 from public.bookings b
      where b.id = results.booking_id and b.status in ('DELIVERED', 'CLOSED')
    )
  );

create policy "medical reads all results"
  on public.results for select to authenticated
  using ( private.is_medical_admin() );

create policy "medical creates results"
  on public.results for insert to authenticated
  with check ( private.is_medical_admin() );

create policy "medical updates results"
  on public.results for update to authenticated
  using ( private.is_medical_admin() ) with check ( private.is_medical_admin() );

-- No patient INSERT/UPDATE. No OPS access. No DELETE for anyone.
