-- Addresses the performance advisors from the initial schema build.
--
-- 1. Index the two foreign keys that lacked covering indexes.
-- 2. Collapse overlapping permissive policies into one policy per
--    (table, action). Postgres evaluates every permissive policy for every
--    candidate row and ORs the results, so N policies cost N predicate
--    evaluations. One OR'd predicate is equivalent and cheaper.
--
-- Access semantics are unchanged: each merged policy is the disjunction of
-- the policies it replaces.

create index bookings_test_idx      on public.bookings (test_id) where test_id is not null;
create index results_approved_by_idx on public.results (approved_by) where approved_by is not null;

-- profiles ------------------------------------------------------------------
drop policy "read own profile"              on public.profiles;
drop policy "staff read all profiles"       on public.profiles;
drop policy "update own profile"            on public.profiles;
drop policy "super admin updates any profile" on public.profiles;

create policy "read own profile or staff reads all"
  on public.profiles for select to authenticated
  using ( (select auth.uid()) = id or private.is_staff() );

-- Role escalation is still blocked by the profiles_guard_role trigger, which
-- is what actually distinguishes a self-edit from a SUPER_ADMIN role change.
create policy "update own profile or super admin updates any"
  on public.profiles for update to authenticated
  using ( (select auth.uid()) = id or private.is_super_admin() )
  with check ( (select auth.uid()) = id or private.is_super_admin() );

-- bookings ------------------------------------------------------------------
drop policy "patient reads own bookings"   on public.bookings;
drop policy "staff read all bookings"      on public.bookings;
drop policy "patient updates own booking"  on public.bookings;
drop policy "ops updates bookings"         on public.bookings;
drop policy "medical updates bookings"     on public.bookings;

create policy "read own bookings or staff reads all"
  on public.bookings for select to authenticated
  using ( (select auth.uid()) = user_id or private.is_staff() );

-- Column- and transition-level limits live in guard_booking_update; this
-- policy only decides who may attempt an update at all.
create policy "owner or staff updates bookings"
  on public.bookings for update to authenticated
  using ( (select auth.uid()) = user_id or private.is_staff() )
  with check ( (select auth.uid()) = user_id or private.is_staff() );

-- results -------------------------------------------------------------------
drop policy "patient reads own approved results" on public.results;
drop policy "medical reads all results"          on public.results;

create policy "patient reads approved results or medical reads all"
  on public.results for select to authenticated
  using (
    private.is_medical_admin()
    or (
      (select auth.uid()) = user_id
      and medical_approval_status = 'APPROVED'
      and exists (
        select 1 from public.bookings b
        where b.id = results.booking_id and b.status in ('DELIVERED', 'CLOSED')
      )
    )
  );

-- labs / tests --------------------------------------------------------------
-- `for all` added a redundant permissive SELECT branch on top of the public
-- read policy. Scope the admin policies to the write actions only.
drop policy "super admin writes labs"  on public.labs;
drop policy "super admin writes tests" on public.tests;

create policy "super admin inserts labs" on public.labs for insert to authenticated
  with check ( private.is_super_admin() );
create policy "super admin updates labs" on public.labs for update to authenticated
  using ( private.is_super_admin() ) with check ( private.is_super_admin() );
create policy "super admin deletes labs" on public.labs for delete to authenticated
  using ( private.is_super_admin() );

create policy "super admin inserts tests" on public.tests for insert to authenticated
  with check ( private.is_super_admin() );
create policy "super admin updates tests" on public.tests for update to authenticated
  using ( private.is_super_admin() ) with check ( private.is_super_admin() );
create policy "super admin deletes tests" on public.tests for delete to authenticated
  using ( private.is_super_admin() );
