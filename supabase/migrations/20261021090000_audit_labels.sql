-- Audit ledger accuracy fixes.
--
-- 1. A patient attaching an M-Pesa code was logged as VERIFIED_PAYMENT, which
--    reads as if OPS had confirmed it. Only a change to payment_status is a
--    verification; a code-only change is now SUBMITTED_PAYMENT_CODE.
-- 2. Results are now created already signed off (status APPROVED, with
--    approved_by). The creation entry records the approval, signatory and
--    follow-up so the sign-off is visible in the ledger.

create or replace function private.audit_booking()
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
      case when new.payment_status is distinct from old.payment_status
           then 'VERIFIED_PAYMENT' else 'SUBMITTED_PAYMENT_CODE' end,
      'payment', new.id::text,
      jsonb_build_object('payment_status', old.payment_status, 'transaction_code', old.transaction_code),
      jsonb_build_object('payment_status', new.payment_status, 'transaction_code', new.transaction_code)
    );
  end if;

  return null;
end;
$$;

create or replace function private.audit_result()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    perform private.write_audit(
      'CREATED_MEDICAL_RESULT', 'result', new.id::text, null,
      jsonb_build_object(
        'booking_id', new.booking_id,
        'flag', new.flag,
        'approval', new.medical_approval_status,
        'approved_by', new.approved_by,
        'follow_up_action', new.follow_up_action
      )
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
