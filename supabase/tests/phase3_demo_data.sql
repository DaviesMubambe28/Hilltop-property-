begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

select is((select count(*)::integer from public.properties where reference like 'DEMO-%'),11,'demo seed contains eleven labelled properties');
select is((select count(distinct listing_type)::integer from public.properties where reference like 'DEMO-%'),3,'demo seed covers sale, rent and investment');
select is((select count(distinct status)::integer from public.properties where reference like 'DEMO-%'),4,'demo seed covers published, draft, sold and rented states');
select is((select count(*)::integer from public.properties where reference='DEMO-RESERVED-001' and status='published' and not is_available),1,'demo seed represents reserved inventory as published but unavailable');
select ok((select bool_and(title like '[DEMO]%') from public.properties where reference like 'DEMO-%'),'every synthetic property is visibly labelled');
select is((select count(*)::integer from public.enquiries where source='demo-seed'),1,'demo seed includes an enquiry workflow record');
select is((select count(*)::integer from public.viewing_appointments where email='demo-customer@example.invalid' and appointment_slot is not null),1,'demo viewing has a derived appointment range');

set local role anon;
select is((select count(*)::integer from public.properties where reference like 'DEMO-%'),7,'anonymous catalogue hides reserved and other unavailable demo listings');
select is((select count(*)::integer from public.enquiries where source='demo-seed'),0,'anonymous visitors cannot read the demo enquiry');

select * from finish();
rollback;
