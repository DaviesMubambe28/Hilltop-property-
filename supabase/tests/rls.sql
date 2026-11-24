begin;
create extension if not exists pgtap with schema extensions;
select plan(5);

insert into public.properties(reference,slug,title,listing_type,status,description)
values ('TEST-DRAFT','test-draft','Private draft','sale','draft','Not public'),('TEST-PUBLIC','test-public','Published property','sale','published','Visible');
insert into public.enquiries(type,name,email,message,consent,idempotency_key)
values ('general','Policy Test','policy@example.com','A private test enquiry',true,gen_random_uuid());

set local role anon;
select is((select count(*)::integer from public.properties where reference='TEST-DRAFT'),0,'anonymous users cannot read drafts');
select is((select count(*)::integer from public.properties where reference='TEST-PUBLIC'),1,'anonymous users can read published properties');
select is((select count(*)::integer from public.enquiries),0,'anonymous users cannot read enquiries');
select throws_ok($$insert into public.properties(reference,slug,title,listing_type,description) values('DENIED','denied','Denied','sale','Denied')$$,'42501',null,'anonymous users cannot create properties');
select throws_ok($$insert into public.audit_logs(action,table_name) values('read','profiles')$$,'42501',null,'anonymous users cannot write audit logs');

select * from finish();
rollback;
