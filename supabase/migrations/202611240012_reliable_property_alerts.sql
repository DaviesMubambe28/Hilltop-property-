begin;
create function public.create_property_alert_notification(target_search uuid,target_property uuid,target_user uuid,notification_title text,notification_body text)
returns table(match_id uuid,notification_id uuid,created boolean) language plpgsql security definer set search_path='' as $$
declare alert_match public.property_alert_matches;alert_notification uuid;inserted boolean:=false;
begin
  insert into public.property_alert_matches(saved_search_id,property_id) values(target_search,target_property)
  on conflict(saved_search_id,property_id) do nothing returning * into alert_match;
  if alert_match.id is not null then inserted:=true; else select * into alert_match from public.property_alert_matches where saved_search_id=target_search and property_id=target_property for update; end if;
  if alert_match.notification_id is null then
    insert into public.system_notifications(user_id,title,body) values(target_user,notification_title,notification_body) returning id into alert_notification;
    update public.property_alert_matches set notification_id=alert_notification where id=alert_match.id;
  else alert_notification:=alert_match.notification_id; end if;
  return query select alert_match.id,alert_notification,inserted;
end $$;
revoke all on function public.create_property_alert_notification(uuid,uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.create_property_alert_notification(uuid,uuid,uuid,text,text) to service_role;
commit;
