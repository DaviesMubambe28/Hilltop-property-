begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

insert into public.properties(reference,slug,title,listing_type,status,description,is_available)
values
  ('TEST-DRAFT','test-draft','Private draft','sale','draft','Not public',true),
  ('TEST-PUBLIC','test-public','Published property','sale','published','Visible',true),
  ('TEST-UNAVAILABLE','test-unavailable','Unavailable property','sale','published','Unavailable',false);
insert into public.agents(name,slug,is_published)
values ('Public Agent','public-agent',true),('Private Agent','private-agent',false);
insert into public.enquiries(type,name,email,message,consent,idempotency_key)
values ('general','Policy Test','policy@example.com','A private test enquiry',true,gen_random_uuid());

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

select * from finish();
rollback;
