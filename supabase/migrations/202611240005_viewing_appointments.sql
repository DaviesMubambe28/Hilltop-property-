begin;

create extension if not exists btree_gist;
create type public.viewing_mode as enum ('physical','virtual');
create type public.appointment_status as enum ('requested','confirmed','rejected','proposed','cancelled','completed');

create table public.viewing_appointments (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete restrict,
  customer_id uuid references public.profiles(id) on delete set null,
  assigned_to uuid references public.profiles(id) on delete set null,
  name text not null check (char_length(name) between 2 and 120),
  email citext not null,
  phone text,
  mode public.viewing_mode not null,
  preferred_start timestamptz not null,
  proposed_start timestamptz,
  duration_minutes integer not null default 60 check (duration_minutes between 15 and 240),
  status public.appointment_status not null default 'requested',
  customer_message text,
  staff_notes text,
  consent boolean not null check (consent),
  idempotency_key uuid not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  appointment_slot tstzrange not null,
  exclude using gist (assigned_to with =, appointment_slot with &&) where (status = 'confirmed' and assigned_to is not null)
);

create function public.set_appointment_slot() returns trigger language plpgsql set search_path = '' as $$
declare
  slot_start timestamptz;
begin
  slot_start := coalesce(new.proposed_start, new.preferred_start);
  new.appointment_slot := tstzrange(slot_start, slot_start + make_interval(mins => new.duration_minutes), '[)');
  return new;
end $$;
create trigger set_viewing_appointment_slot before insert or update of preferred_start,proposed_start,duration_minutes
on public.viewing_appointments for each row execute function public.set_appointment_slot();

create table public.appointment_status_history (
  id bigint generated always as identity primary key,
  appointment_id uuid not null references public.viewing_appointments(id) on delete cascade,
  changed_by uuid references public.profiles(id) on delete set null,
  old_status public.appointment_status,
  new_status public.appointment_status not null,
  note text,
  created_at timestamptz not null default now()
);

create index viewing_customer_date on public.viewing_appointments(customer_id, preferred_start desc);
create index viewing_staff_queue on public.viewing_appointments(status, assigned_to, preferred_start);
create index viewing_property_date on public.viewing_appointments(property_id, preferred_start desc);

create trigger set_viewing_appointments_updated_at before update on public.viewing_appointments
for each row execute function public.set_updated_at();

create function public.record_appointment_status() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' or old.status is distinct from new.status then
    insert into public.appointment_status_history(appointment_id,changed_by,old_status,new_status)
    values(new.id,auth.uid(),case when tg_op='UPDATE' then old.status end,new.status);
  end if;
  return new;
end $$;
create trigger appointment_status_audit after insert or update of status on public.viewing_appointments
for each row execute function public.record_appointment_status();

alter table public.viewing_appointments enable row level security;
alter table public.appointment_status_history enable row level security;
create policy viewing_customer_read on public.viewing_appointments for select using (customer_id=auth.uid() or public.is_staff());
create policy viewing_staff_all on public.viewing_appointments for all using (public.is_staff()) with check (public.is_staff());
create policy viewing_history_read on public.appointment_status_history for select using (
  public.is_staff() or exists(select 1 from public.viewing_appointments appointment where appointment.id=appointment_id and appointment.customer_id=auth.uid())
);

commit;
