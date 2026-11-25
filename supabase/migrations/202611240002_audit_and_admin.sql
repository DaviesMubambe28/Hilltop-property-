begin;

create function public.audit_row_change() returns trigger language plpgsql security definer set search_path = '' as $$
declare row_id uuid;
begin
  row_id := case when tg_op='DELETE' then old.id else new.id end;
  insert into public.audit_logs(actor_id,action,table_name,record_id,old_data,new_data)
  values(auth.uid(),lower(tg_op),tg_table_name,row_id,case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end,case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end);
  return case when tg_op='DELETE' then old else new end;
end $$;

do $$ declare t text; begin
  foreach t in array array['properties','agents','branches','locations','enquiries','pages','articles','testimonials','faqs','partners','projects'] loop
    execute format('create trigger audit_%I after insert or update or delete on public.%I for each row execute function public.audit_row_change()',t,t);
  end loop;
end $$;

create function public.set_staff_role(target_user uuid, target_role public.app_role, active boolean default true)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'permission denied' using errcode='42501'; end if;
  update public.profiles set role=target_role,is_active=active where id=target_user;
  if not found then raise exception 'profile not found' using errcode='P0002'; end if;
end $$;
revoke all on function public.set_staff_role(uuid,public.app_role,boolean) from public;
grant execute on function public.set_staff_role(uuid,public.app_role,boolean) to authenticated;

commit;
