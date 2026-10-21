-- Reference data: partner labs and bookable test panels.
-- Both were hardcoded arrays in src/lib/types.ts (STATIC_LABS, STATIC_TESTS).
-- Text slug PKs are carried over from those arrays: stable, readable in the
-- audit log, and they keep the frontend port a direct swap.

create table public.labs (
  id           text primary key,
  name         text not null,
  address      text not null,
  neighborhood text not null,
  lat          numeric(9,6) not null check (lat between -90 and 90),
  lng          numeric(9,6) not null check (lng between -180 and 180),
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

create index labs_active_idx on public.labs (active) where active;

create table public.tests (
  id             text primary key,
  name           text not null,
  -- KES, integer minor-unit-free. Never float for money.
  price          integer not null check (price >= 0),
  description    text not null,
  included_tests text[] not null default '{}',
  icon           text,
  popular        boolean not null default false,
  active         boolean not null default true,
  created_at     timestamptz not null default now()
);

insert into public.labs (id, name, address, neighborhood, lat, lng, active) values
  ('lab-1', 'MediPath Diagnostic Center', '5th Floor, ACK Garden House, 1st Ngong Ave', 'Community, Nairobi', -1.2988, 36.8121, true),
  ('lab-2', 'PathCare Kenya - Main Lab',  'Regal Plaza, Limuru Road',                   'Parklands, Nairobi', -1.2612, 36.8219, true),
  ('lab-3', 'Lancet Kenya - Upper Hill',  '5th Ngong Ave, Upper Hill',                  'Upper Hill, Nairobi', -1.2965, 36.8085, true);

insert into public.tests (id, name, price, description, included_tests, icon, popular) values
  ('basic-health', 'Basic Health Panel', 2500,
   'Your essential health checkup. Covers blood sugar, kidney function, and complete blood count.',
   array['Blood Sugar (Glucose)', 'Kidney Function (Creatinine)', 'Complete Blood Count (CBC)', 'Urine Analysis'],
   '🩺', false),
  ('heart-cholesterol', 'Heart & Cholesterol', 3500,
   'Know your heart risk. Covers all cholesterol types and markers for cardiovascular health.',
   array['Total Cholesterol', 'LDL (Bad Cholesterol)', 'HDL (Good Cholesterol)', 'Triglycerides', 'Blood Pressure Markers'],
   '❤️', true),
  ('full-body', 'Full Body Check', 6000,
   'The complete picture of your health. Covers organs, hormones, blood, and more.',
   array['All Basic Panel Tests', 'All Heart Panel Tests', 'Liver Function (ALT/AST)', 'Thyroid (TSH)', 'Vitamin D & B12', 'HbA1c (Diabetes Risk)'],
   '🔬', false);

alter table public.labs  enable row level security;
alter table public.tests enable row level security;

-- Readable by anon: /tests and the landing page are public marketing surfaces.
create policy "labs are publicly readable"
  on public.labs for select to anon, authenticated using ( true );

create policy "tests are publicly readable"
  on public.tests for select to anon, authenticated using ( true );

-- Writes are SUPER_ADMIN only. Without these, anon's default table grants
-- would allow INSERT/UPDATE/DELETE on reference data.
create policy "super admin writes labs"
  on public.labs for all to authenticated
  using ( private.is_super_admin() ) with check ( private.is_super_admin() );

create policy "super admin writes tests"
  on public.tests for all to authenticated
  using ( private.is_super_admin() ) with check ( private.is_super_admin() );
