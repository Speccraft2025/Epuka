-- Immutable audit ledger.
--
-- Two changes from the Firestore model, both deliberate:
--
-- 1. Clients cannot write here. firestore.rules allowed `create: if isSignedIn()`,
--    which let any patient forge entries into the "immutable" ledger. Rows are
--    now produced solely by SECURITY DEFINER triggers on the audited tables.
--
-- 2. Logging is no longer best-effort. createAuditLog() in src/lib/admin.ts
--    swallows failures in a try/catch, so an admin action could succeed while
--    its audit record silently vanished. Writing from a trigger puts the log in
--    the same transaction as the change: if the log fails, the change rolls back.

create table public.audit_logs (
  id             uuid primary key default gen_random_uuid(),

  -- SET NULL, never CASCADE: deleting a user must not erase the history of
  -- what they did. actor_email preserves the identity as a snapshot.
  actor_id       uuid references public.profiles(id) on delete set null,
  actor_email    text,
  actor_role     public.user_role,

  action         text not null,
  entity_type    public.audit_entity not null,
  entity_id      text not null,
  previous_value jsonb,
  new_value      jsonb,
  created_at     timestamptz not null default now()
);

create index audit_logs_created_idx on public.audit_logs (created_at desc);
create index audit_logs_entity_idx  on public.audit_logs (entity_type, entity_id, created_at desc);
create index audit_logs_actor_idx   on public.audit_logs (actor_id, created_at desc);

alter table public.audit_logs enable row level security;

-- Only SUPER_ADMIN may read the ledger. There is deliberately no INSERT,
-- UPDATE, or DELETE policy for any client role.
create policy "super admin reads audit log"
  on public.audit_logs for select to authenticated
  using ( private.is_super_admin() );

-- Belt and braces: RLS governs rows, grants govern the operation. Append-only
-- is enforced by the absence of the privilege, not just a missing policy.
revoke insert, update, delete, truncate on public.audit_logs from anon, authenticated, service_role;
revoke update, delete, truncate on public.audit_logs from public;

-- Shared writer. SECURITY DEFINER, so it runs as the table owner and is the
-- only path that can insert.
create function private.write_audit(
  p_action      text,
  p_entity_type public.audit_entity,
  p_entity_id   text,
  p_previous    jsonb,
  p_new         jsonb
) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid   uuid := (select auth.uid());
  v_email text;
  v_role  public.user_role;
begin
  select email, role into v_email, v_role from public.profiles where id = v_uid;

  insert into public.audit_logs
    (actor_id, actor_email, actor_role, action, entity_type, entity_id, previous_value, new_value)
  values
    (v_uid, v_email, v_role, p_action, p_entity_type, p_entity_id, p_previous, p_new);
end;
$$;

-- Booking lifecycle auditing, including flagging SUPER_ADMIN overrides that
-- stepped outside the documented state graph.
create function private.audit_booking()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  v_action text;
begin
  if new.status is distinct from old.status then
    if not exists (
      select 1 from private.booking_transitions
      where from_status = old.status and to_status = new.status
    ) then
      v_action := 'SUPER_ADMIN_OVERRIDE_TRANSITION';
    else
      v_action := 'TRANSITION_BOOKING_STATE';
    end if;

    perform private.write_audit(
      v_action, 'booking', new.id::text,
      to_jsonb(old.status), to_jsonb(new.status)
    );
  end if;

  if new.payment_status is distinct from old.payment_status
     or new.transaction_code is distinct from old.transaction_code then
    perform private.write_audit(
      'VERIFIED_PAYMENT', 'payment', new.id::text,
      jsonb_build_object('payment_status', old.payment_status, 'transaction_code', old.transaction_code),
      jsonb_build_object('payment_status', new.payment_status, 'transaction_code', new.transaction_code)
    );
  end if;

  return null; -- AFTER trigger; return value is ignored
end;
$$;

create trigger bookings_audit
  after update on public.bookings
  for each row execute function private.audit_booking();

create function private.audit_result()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    perform private.write_audit(
      'CREATED_MEDICAL_RESULT', 'result', new.id::text, null,
      jsonb_build_object('booking_id', new.booking_id, 'flag', new.flag)
    );
  elsif new.medical_approval_status is distinct from old.medical_approval_status then
    perform private.write_audit(
      'MEDICAL_APPROVAL_CHANGED', 'result', new.id::text,
      to_jsonb(old.medical_approval_status),
      jsonb_build_object(
        'status', new.medical_approval_status,
        'flag', new.flag,
        'follow_up_action', new.follow_up_action
      )
    );
  end if;
  return null;
end;
$$;

create trigger results_audit
  after insert or update on public.results
  for each row execute function private.audit_result();

create function private.audit_profile_role()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if new.role is distinct from old.role then
    perform private.write_audit(
      'UPDATED_USER_ROLE', 'user', new.id::text,
      to_jsonb(old.role), to_jsonb(new.role)
    );
  end if;
  return null;
end;
$$;

create trigger profiles_audit_role
  after update on public.profiles
  for each row execute function private.audit_profile_role();
