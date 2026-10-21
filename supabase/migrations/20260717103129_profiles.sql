-- Profiles: one row per auth.users entry, created automatically on signup.
-- Flattens the nested Firestore `profile` object into real columns.

create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null,
  display_name text,
  photo_url    text,
  role         public.user_role not null default 'PATIENT',

  -- Onboarding fields: null until /onboarding is completed.
  age          integer check (age is null or age between 0 and 130),
  gender       text,
  height_cm    numeric(5,2) check (height_cm is null or height_cm between 30 and 280),
  weight_kg    numeric(5,2) check (weight_kg is null or weight_kg between 1 and 500),
  smoker       boolean,
  alcohol      boolean,
  exercise     text check (exercise is null or exercise in ('none', 'light', 'moderate', 'heavy')),

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index profiles_role_idx on public.profiles (role);

-- Role lookup used by every RLS policy. SECURITY DEFINER so it can read
-- profiles without re-entering profiles' own RLS policies, which would
-- recurse infinitely. Lives in `private` so it is not a callable API endpoint.
create function private.auth_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = (select auth.uid());
$$;

-- Mirrors the Firestore helpers: SUPER_ADMIN satisfies every staff check.
create function private.is_super_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select private.auth_role() = 'SUPER_ADMIN';
$$;

create function private.is_ops() returns boolean
language sql stable security definer set search_path = '' as $$
  select private.auth_role() in ('OPS', 'SUPER_ADMIN');
$$;

create function private.is_medical_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select private.auth_role() in ('MEDICAL_ADMIN', 'SUPER_ADMIN');
$$;

create function private.is_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select private.auth_role() in ('OPS', 'MEDICAL_ADMIN', 'SUPER_ADMIN');
$$;

-- Populate a profile whenever a user signs up, so no authenticated session
-- can exist without a corresponding profile row.
create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name, photo_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Guards privilege escalation. A user may edit their own demographics, but
-- only a SUPER_ADMIN may change a role. RLS WITH CHECK cannot see OLD, so
-- this has to be a trigger rather than a policy predicate.
create function private.guard_profile_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role and not private.is_super_admin() then
    raise exception 'Only a SUPER_ADMIN may change a user role'
      using errcode = 'insufficient_privilege';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_guard_role
  before update on public.profiles
  for each row execute function private.guard_profile_role();

alter table public.profiles enable row level security;

-- anon gets no policies at all, so it sees nothing despite holding table grants.
create policy "read own profile"
  on public.profiles for select to authenticated
  using ( (select auth.uid()) = id );

create policy "staff read all profiles"
  on public.profiles for select to authenticated
  using ( private.is_staff() );

-- Both USING and WITH CHECK, so a user cannot re-point a row at another id.
create policy "update own profile"
  on public.profiles for update to authenticated
  using ( (select auth.uid()) = id )
  with check ( (select auth.uid()) = id );

create policy "super admin updates any profile"
  on public.profiles for update to authenticated
  using ( private.is_super_admin() )
  with check ( private.is_super_admin() );

-- No INSERT policy: rows come exclusively from the signup trigger.
-- No DELETE policy: profiles are removed by cascade from auth.users.
