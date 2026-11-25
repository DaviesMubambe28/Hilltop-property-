begin;

revoke all on function public.can_access_enquiry(public.enquiries) from public;
revoke all on function public.can_access_enquiry(public.enquiries) from anon;
grant execute on function public.can_access_enquiry(public.enquiries) to authenticated;

drop policy if exists enquiries_staff_read on public.enquiries;
drop policy if exists enquiries_staff_update on public.enquiries;
create policy enquiries_staff_read on public.enquiries for select to authenticated using(public.can_access_enquiry(enquiries));
create policy enquiries_staff_update on public.enquiries for update to authenticated using(public.can_access_enquiry(enquiries)) with check(public.can_access_enquiry(enquiries));

drop policy if exists enquiry_notes_staff_read on public.enquiry_notes;
drop policy if exists enquiry_notes_staff_insert on public.enquiry_notes;
create policy enquiry_notes_staff_read on public.enquiry_notes for select to authenticated using(exists(select 1 from public.enquiries e where e.id=enquiry_id and public.can_access_enquiry(e)));
create policy enquiry_notes_staff_insert on public.enquiry_notes for insert to authenticated with check(author_id=auth.uid() and exists(select 1 from public.enquiries e where e.id=enquiry_id and public.can_access_enquiry(e)));

drop policy if exists follow_ups_staff_read on public.follow_ups;
drop policy if exists follow_ups_staff_insert on public.follow_ups;
drop policy if exists follow_ups_staff_update on public.follow_ups;
create policy follow_ups_staff_read on public.follow_ups for select to authenticated using(exists(select 1 from public.enquiries e where e.id=enquiry_id and public.can_access_enquiry(e)));
create policy follow_ups_staff_insert on public.follow_ups for insert to authenticated with check(staff_id=auth.uid() and exists(select 1 from public.enquiries e where e.id=enquiry_id and public.can_access_enquiry(e)));
create policy follow_ups_staff_update on public.follow_ups for update to authenticated using(staff_id=auth.uid() or public.is_admin()) with check(staff_id=auth.uid() or public.is_admin());

commit;
