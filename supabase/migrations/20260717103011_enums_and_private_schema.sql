-- Core enums for the Epuka domain, ported from src/lib/types.ts.
-- Postgres enums are ordered; booking_status is declared in lifecycle order
-- so ORDER BY status sorts a queue the way the workflow actually runs.

create type public.user_role as enum ('SUPER_ADMIN', 'MEDICAL_ADMIN', 'OPS', 'PATIENT');

create type public.booking_status as enum (
  'BOOKED',
  'PAYMENT_PENDING',
  'PAYMENT_CONFIRMED',
  'ASSIGNED_TO_LAB',
  'SAMPLE_COLLECTED',
  'IN_ANALYSIS',
  'VERIFIED',
  'DELIVERED',
  'CLOSED'
);

create type public.collection_method as enum ('lab', 'home');
create type public.payment_status as enum ('unpaid', 'paid');
create type public.medical_flag as enum ('NORMAL', 'ATTENTION', 'URGENT');
create type public.approval_status as enum ('PENDING', 'APPROVED', 'REJECTED');
create type public.audit_entity as enum ('booking', 'result', 'user', 'payment');
create type public.metric_status as enum ('normal', 'attention', 'critical');

-- Unexposed schema for SECURITY DEFINER helpers. Nothing here is reachable
-- through the Data API: the API only serves exposed schemas, and we revoke
-- USAGE from the client roles regardless.
create schema if not exists private;

revoke all on schema private from public;
revoke usage on schema private from anon, authenticated;
