begin;

-- PostgreSQL treats timestamptz + interval as stable rather than immutable, so
-- generated appointment ranges fail on fresh databases. Rebuild the derived
-- value as a trigger-maintained column for projects that already applied 005.
drop trigger if exists set_viewing_appointment_slot on public.viewing_appointments;
alter table public.viewing_appointments drop column if exists appointment_slot cascade;
alter table public.viewing_appointments add column appointment_slot tstzrange;

create or replace function public.set_appointment_slot() returns trigger
language plpgsql set search_path = '' as $$
declare
  slot_start timestamptz;
begin
  slot_start := coalesce(new.proposed_start, new.preferred_start);
  new.appointment_slot := tstzrange(slot_start, slot_start + make_interval(mins => new.duration_minutes), '[)');
  return new;
end $$;

update public.viewing_appointments
set appointment_slot = tstzrange(
  coalesce(proposed_start, preferred_start),
  coalesce(proposed_start, preferred_start) + make_interval(mins => duration_minutes),
  '[)'
);
alter table public.viewing_appointments alter column appointment_slot set not null;

create trigger set_viewing_appointment_slot before insert or update of preferred_start,proposed_start,duration_minutes
on public.viewing_appointments for each row execute function public.set_appointment_slot();
alter table public.viewing_appointments add constraint viewing_appointments_no_staff_overlap
exclude using gist (assigned_to with =, appointment_slot with &&)
where (status = 'confirmed' and assigned_to is not null);

commit;
