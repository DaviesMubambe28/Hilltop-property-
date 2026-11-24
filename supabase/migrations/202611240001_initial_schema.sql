begin;

create extension if not exists pgcrypto;
create extension if not exists citext;

create type public.app_role as enum ('customer','editor','admin');
create type public.property_status as enum ('draft','published','sold','rented','archived');
create type public.listing_type as enum ('sale','rent','investment');
create type public.enquiry_type as enum ('property','general','viewing','valuation');
create type public.enquiry_status as enum ('new','contacted','qualified','closed','spam');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  role public.app_role not null default 'customer',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.branches (
  id uuid primary key default gen_random_uuid(), name text not null unique, slug text not null unique,
  email citext, phone text, whatsapp_number text, address text, latitude numeric(9,6), longitude numeric(9,6),
  is_active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.locations (
  id uuid primary key default gen_random_uuid(), parent_id uuid references public.locations(id) on delete set null,
  name text not null, slug text not null unique, province text, description text, latitude numeric(9,6), longitude numeric(9,6),
  is_published boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.property_categories (id uuid primary key default gen_random_uuid(), name text not null unique, slug text not null unique, created_at timestamptz not null default now());
create table public.property_types (id uuid primary key default gen_random_uuid(), name text not null unique, slug text not null unique, created_at timestamptz not null default now());
create table public.amenities (id uuid primary key default gen_random_uuid(), name text not null unique, slug text not null unique, icon text, created_at timestamptz not null default now());

create table public.agents (
  id uuid primary key default gen_random_uuid(), profile_id uuid unique references public.profiles(id) on delete set null,
  branch_id uuid references public.branches(id) on delete set null, name text not null, slug text not null unique,
  title text, email citext, phone text, bio text, photo_path text, is_published boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.properties (
  id uuid primary key default gen_random_uuid(), reference text not null unique, slug text not null unique, title text not null,
  summary text not null default '', description text not null default '', listing_type public.listing_type not null,
  status public.property_status not null default 'draft', category_id uuid references public.property_categories(id),
  property_type_id uuid references public.property_types(id), location_id uuid references public.locations(id),
  branch_id uuid references public.branches(id), agent_id uuid references public.agents(id) on delete set null,
  price numeric(14,2) check (price is null or price >= 0), price_period text check (price_period in ('once','month','week') or price_period is null),
  currency char(3) not null default 'ZMW', bedrooms smallint check (bedrooms >= 0), bathrooms smallint check (bathrooms >= 0),
  parking_spaces smallint check (parking_spaces >= 0), land_size numeric(14,2) check (land_size >= 0), land_unit text,
  floor_size numeric(14,2) check (floor_size >= 0), latitude numeric(9,6), longitude numeric(9,6),
  address text, is_featured boolean not null default false, is_available boolean not null default true,
  published_at timestamptz, created_by uuid references public.profiles(id), updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  search_document tsvector generated always as (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(summary,'') || ' ' || coalesce(description,''))) stored
);

create table public.property_images (
  id uuid primary key default gen_random_uuid(), property_id uuid not null references public.properties(id) on delete cascade,
  storage_path text not null, alt_text text not null, position integer not null default 0, is_primary boolean not null default false,
  created_at timestamptz not null default now(), unique(property_id, storage_path)
);
create unique index property_one_primary_image on public.property_images(property_id) where is_primary;
create table public.property_amenities (property_id uuid references public.properties(id) on delete cascade, amenity_id uuid references public.amenities(id) on delete cascade, primary key(property_id, amenity_id));
create table public.property_features (id uuid primary key default gen_random_uuid(), property_id uuid not null references public.properties(id) on delete cascade, name text not null, value text, position integer not null default 0);

create table public.saved_properties (user_id uuid references public.profiles(id) on delete cascade, property_id uuid references public.properties(id) on delete cascade, created_at timestamptz not null default now(), primary key(user_id, property_id));
create table public.saved_searches (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, name text not null, filters jsonb not null default '{}', alert_enabled boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.property_views (id bigint generated always as identity primary key, property_id uuid not null references public.properties(id) on delete cascade, user_id uuid references public.profiles(id) on delete set null, session_hash text, viewed_at timestamptz not null default now());

create table public.enquiries (
  id uuid primary key default gen_random_uuid(), type public.enquiry_type not null, property_id uuid references public.properties(id) on delete set null,
  customer_id uuid references public.profiles(id) on delete set null, assigned_to uuid references public.profiles(id) on delete set null,
  name text not null check (char_length(name) between 2 and 120), email citext not null, phone text,
  message text not null check (char_length(message) between 10 and 4000), status public.enquiry_status not null default 'new',
  preferred_date timestamptz, consent boolean not null check (consent), idempotency_key uuid not null unique,
  source text not null default 'website', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.enquiry_notes (id uuid primary key default gen_random_uuid(), enquiry_id uuid not null references public.enquiries(id) on delete cascade, author_id uuid not null references public.profiles(id), body text not null check (char_length(body) between 1 and 4000), is_internal boolean not null default true, created_at timestamptz not null default now());
create table public.follow_ups (id uuid primary key default gen_random_uuid(), enquiry_id uuid not null references public.enquiries(id) on delete cascade, staff_id uuid not null references public.profiles(id), due_at timestamptz not null, completed_at timestamptz, outcome text, created_at timestamptz not null default now());

create table public.pages (id uuid primary key default gen_random_uuid(), slug text not null unique, title text not null, body text not null default '', is_published boolean not null default false, meta_title text, meta_description text, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.article_categories (id uuid primary key default gen_random_uuid(), name text not null unique, slug text not null unique);
create table public.articles (id uuid primary key default gen_random_uuid(), category_id uuid references public.article_categories(id), author_id uuid references public.profiles(id), slug text not null unique, title text not null, excerpt text not null default '', body text not null default '', cover_path text, is_published boolean not null default false, published_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.testimonials (id uuid primary key default gen_random_uuid(), name text not null, quote text not null, role text, is_published boolean not null default false, position integer not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.faqs (id uuid primary key default gen_random_uuid(), question text not null, answer text not null, is_published boolean not null default false, position integer not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.partners (id uuid primary key default gen_random_uuid(), name text not null, website_url text, logo_path text, is_published boolean not null default false, position integer not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.projects (id uuid primary key default gen_random_uuid(), slug text not null unique, title text not null, description text not null default '', location_id uuid references public.locations(id), status text not null default 'planned', is_published boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.site_settings (key text primary key, value jsonb not null, is_public boolean not null default false, updated_by uuid references public.profiles(id), updated_at timestamptz not null default now());
create table public.navigation_items (id uuid primary key default gen_random_uuid(), label text not null, url text not null, location text not null default 'header', parent_id uuid references public.navigation_items(id) on delete cascade, position integer not null default 0, is_published boolean not null default true);
create table public.system_notifications (id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id) on delete cascade, title text not null, body text not null, read_at timestamptz, created_at timestamptz not null default now());
create table public.audit_logs (id bigint generated always as identity primary key, actor_id uuid references public.profiles(id) on delete set null, action text not null, table_name text not null, record_id uuid, old_data jsonb, new_data jsonb, created_at timestamptz not null default now());

create index properties_public_query on public.properties(status, listing_type, is_available, is_featured, published_at desc);
create index properties_location on public.properties(location_id);
create index properties_price on public.properties(price);
create index properties_search on public.properties using gin(search_document);
create index property_images_order on public.property_images(property_id, position);
create index enquiries_staff_queue on public.enquiries(status, assigned_to, created_at desc);
create index enquiries_customer on public.enquiries(customer_id, created_at desc);
create index property_views_property_date on public.property_views(property_id, viewed_at desc);

create function public.set_updated_at() returns trigger language plpgsql set search_path = '' as $$ begin new.updated_at = now(); return new; end $$;
do $$ declare t text; begin foreach t in array array['profiles','branches','locations','agents','properties','saved_searches','enquiries','pages','articles','testimonials','faqs','partners','projects'] loop execute format('create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()', t, t); end loop; end $$;

create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$ begin insert into public.profiles(id,full_name) values(new.id,coalesce(new.raw_user_meta_data->>'full_name','')); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create function public.is_staff() returns boolean language sql stable security definer set search_path = '' as $$ select exists(select 1 from public.profiles where id=auth.uid() and role in ('editor','admin') and is_active) $$;
create function public.is_admin() returns boolean language sql stable security definer set search_path = '' as $$ select exists(select 1 from public.profiles where id=auth.uid() and role='admin' and is_active) $$;

do $$ declare t text; begin foreach t in array array['profiles','branches','locations','property_categories','property_types','amenities','agents','properties','property_images','property_amenities','property_features','saved_properties','saved_searches','property_views','enquiries','enquiry_notes','follow_ups','pages','article_categories','articles','testimonials','faqs','partners','projects','site_settings','navigation_items','system_notifications','audit_logs'] loop execute format('alter table public.%I enable row level security',t); end loop; end $$;

create policy profiles_self_read on public.profiles for select using (id=auth.uid() or public.is_staff());
create policy profiles_self_update on public.profiles for update using (id=auth.uid()) with check (id=auth.uid() and role=(select role from public.profiles where id=auth.uid()));
create policy profiles_admin_all on public.profiles for all using (public.is_admin()) with check (public.is_admin());

do $$ declare t text; begin foreach t in array array['branches','locations','property_categories','property_types','amenities','agents'] loop execute format('create policy %I_public_read on public.%I for select using (true)',t,t); execute format('create policy %I_staff_write on public.%I for all using (public.is_staff()) with check (public.is_staff())',t,t); end loop; end $$;
create policy properties_public_read on public.properties for select using (status='published');
create policy properties_staff_all on public.properties for all using (public.is_staff()) with check (public.is_staff());
create policy property_images_public_read on public.property_images for select using (exists(select 1 from public.properties p where p.id=property_id and p.status='published'));
create policy property_images_staff_all on public.property_images for all using (public.is_staff()) with check (public.is_staff());
do $$ declare t text; begin foreach t in array array['property_amenities','property_features'] loop execute format('create policy %I_public_read on public.%I for select using (exists(select 1 from public.properties p where p.id=property_id and p.status=''published''))',t,t); execute format('create policy %I_staff_all on public.%I for all using (public.is_staff()) with check (public.is_staff())',t,t); end loop; end $$;

create policy saved_properties_owner on public.saved_properties for all using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy saved_searches_owner on public.saved_searches for all using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy property_views_insert on public.property_views for insert with check (user_id is null or user_id=auth.uid());
create policy property_views_staff_read on public.property_views for select using (public.is_staff());
create policy enquiries_customer_read on public.enquiries for select using (customer_id=auth.uid() or public.is_staff());
create policy enquiries_staff_write on public.enquiries for all using (public.is_staff()) with check (public.is_staff());
create policy enquiry_notes_staff on public.enquiry_notes for all using (public.is_staff()) with check (public.is_staff());
create policy follow_ups_staff on public.follow_ups for all using (public.is_staff()) with check (public.is_staff());

do $$ declare t text; begin foreach t in array array['pages','articles','testimonials','faqs','partners','projects','navigation_items'] loop execute format('create policy %I_public_read on public.%I for select using (is_published)',t,t); execute format('create policy %I_staff_all on public.%I for all using (public.is_staff()) with check (public.is_staff())',t,t); end loop; end $$;
create policy article_categories_public_read on public.article_categories for select using (true);
create policy article_categories_staff_all on public.article_categories for all using (public.is_staff()) with check (public.is_staff());
create policy settings_public_read on public.site_settings for select using (is_public or public.is_staff());
create policy settings_admin_all on public.site_settings for all using (public.is_admin()) with check (public.is_admin());
create policy notifications_owner on public.system_notifications for select using (user_id=auth.uid());
create policy notifications_owner_update on public.system_notifications for update using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy notifications_staff_insert on public.system_notifications for insert with check (public.is_staff());
create policy audit_admin_read on public.audit_logs for select using (public.is_admin());

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('property-media','property-media',true,10485760,array['image/jpeg','image/png','image/webp','image/avif']) on conflict(id) do nothing;
create policy property_media_public_read on storage.objects for select using (bucket_id='property-media');
create policy property_media_staff_insert on storage.objects for insert with check (bucket_id='property-media' and public.is_staff());
create policy property_media_staff_update on storage.objects for update using (bucket_id='property-media' and public.is_staff());
create policy property_media_staff_delete on storage.objects for delete using (bucket_id='property-media' and public.is_staff());

commit;
