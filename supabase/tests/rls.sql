begin;
create extension if not exists pgtap with schema extensions;
select plan(15);

insert into public.properties(reference,slug,title,listing_type,status,description,is_available)
values
  ('TEST-DRAFT','test-draft','Private draft','sale','draft','Not public',true),
  ('TEST-PUBLIC','test-public','Published property','sale','published','Visible',true),
  ('TEST-UNAVAILABLE','test-unavailable','Unavailable property','sale','published','Unavailable',false);
insert into public.agents(name,slug,is_published)
values ('Public Agent','public-agent',true),('Private Agent','private-agent',false);
insert into public.enquiries(type,name,email,message,consent,idempotency_key)
values ('general','Policy Test','policy@example.com','A private test enquiry',true,gen_random_uuid());
insert into public.property_amenities(property_id,amenity_id)
select property.id, amenity.id from public.properties property cross join public.amenities amenity
where property.reference='TEST-PUBLIC' and amenity.slug in ('solar','borehole');
insert into public.viewing_appointments(property_id,name,email,mode,preferred_start,consent,idempotency_key)
select id,'Viewing Test','viewing@example.com','physical',now()+interval '2 days',true,gen_random_uuid() from public.properties where reference='TEST-PUBLIC';

set local role anon;
select is((select count(*)::integer from public.properties where reference='TEST-DRAFT'),0,'anonymous users cannot read drafts');
select is((select count(*)::integer from public.properties where reference='TEST-PUBLIC'),1,'anonymous users can read published properties');
select is((select count(*)::integer from public.properties where reference='TEST-UNAVAILABLE'),0,'anonymous users cannot read unavailable properties');
select is((select count(*)::integer from public.agents where slug='public-agent'),1,'anonymous users can read published agents');
select is((select count(*)::integer from public.agents where slug='private-agent'),0,'anonymous users cannot read unpublished agents');
select is((select count(*)::integer from public.enquiries),0,'anonymous users cannot read enquiries');
select throws_ok($$insert into public.properties(reference,slug,title,listing_type,description) values('DENIED','denied','Denied','sale','Denied')$$,'42501',null,'anonymous users cannot create properties');
select throws_ok($$insert into public.audit_logs(action,table_name) values('read','profiles')$$,'42501',null,'anonymous users cannot write audit logs');
select throws_ok($$insert into public.property_views(property_id) select id from public.properties where reference='TEST-PUBLIC'$$,'42501',null,'anonymous users cannot insert property view events directly');
select throws_ok($$select public.consume_rate_limit('test',repeat('a',64),1,60)$$,'42501',null,'anonymous users cannot call the rate limiter');
select is((select count(*)::integer from public.search_property_ids(p_query := 'TEST-PUBLIC')),1,'search finds an available property by exact reference');
select is((select count(*)::integer from public.search_property_ids(p_amenities := array['solar','borehole'])),1,'combined amenity filters require and match every requested feature');
select is((select count(*)::integer from public.search_property_ids(p_amenities := array['solar','swimming-pool'])),0,'combined amenity filters reject partial matches');
select is((select count(*)::integer from public.viewing_appointments),0,'anonymous users cannot read viewing requests');
select throws_ok($$insert into public.viewing_appointments(property_id,name,email,mode,preferred_start,consent,idempotency_key) select id,'Denied','denied@example.com','physical',now()+interval '1 day',true,gen_random_uuid() from public.properties where reference='TEST-PUBLIC'$$,'42501',null,'anonymous users cannot create viewing requests directly');

select * from finish();
rollback;
