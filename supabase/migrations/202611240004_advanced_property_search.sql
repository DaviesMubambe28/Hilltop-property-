begin;

alter table public.properties
  add column furnished_status text check (furnished_status in ('furnished','unfurnished','part-furnished')),
  add column condition text check (condition in ('new','excellent','good','renovation')),
  add column verification_status text not null default 'unverified'
    check (verification_status in ('unverified','pending','verified','rejected')),
  add column verified_at timestamptz;

create index properties_bedrooms_bathrooms on public.properties(bedrooms, bathrooms);
create index properties_sizes on public.properties(land_size, floor_size);
create index properties_furnished_condition on public.properties(furnished_status, condition);
create index properties_verification on public.properties(verification_status) where status = 'published' and is_available;
create index properties_reference_lower on public.properties(lower(reference));
create index locations_hierarchy on public.locations(parent_id, province, is_published);
create index property_amenities_reverse on public.property_amenities(amenity_id, property_id);

insert into public.amenities(name, slug) values
  ('Borehole', 'borehole'),
  ('Solar power', 'solar'),
  ('Water tank', 'water-tank'),
  ('Gated community', 'gated-community'),
  ('Road frontage', 'road-frontage'),
  ('Electricity connection', 'electricity'),
  ('Title deeds', 'title-deeds'),
  ('Serviced plot', 'serviced-plot')
on conflict (slug) do nothing;

update public.locations child
set parent_id = parent.id
from public.locations parent
where child.parent_id is null
  and child.slug in ('foxdale','kabulonga','ibex-hill')
  and parent.slug = 'lusaka';

update public.locations child
set parent_id = parent.id
from public.locations parent
where child.parent_id is null
  and child.slug in ('dambwa-north','highlands')
  and parent.slug = 'livingstone';

create function public.search_property_ids(
  p_query text default null,
  p_location_id uuid default null,
  p_province text default null,
  p_city_id uuid default null,
  p_neighborhood_id uuid default null,
  p_property_type_id uuid default null,
  p_listing_type public.listing_type default null,
  p_min_price numeric default null,
  p_max_price numeric default null,
  p_bedrooms integer default null,
  p_bathrooms integer default null,
  p_min_land_size numeric default null,
  p_min_floor_size numeric default null,
  p_furnished_status text default null,
  p_condition text default null,
  p_verification_status text default null,
  p_amenities text[] default '{}',
  p_sort text default 'newest',
  p_limit integer default 8,
  p_offset integer default 0
) returns table(property_id uuid, total_count bigint)
language sql
stable
set search_path = ''
as $$
  select p.id, count(*) over()
  from public.properties p
  left join public.locations location on location.id = p.location_id
  where p.status = 'published'
    and p.is_available
    and (p_query is null or btrim(p_query) = '' or lower(p.reference) = lower(btrim(p_query)) or p.search_document @@ websearch_to_tsquery('english', p_query))
    and (p_location_id is null or p.location_id = p_location_id)
    and (p_province is null or lower(location.province) = lower(p_province))
    and (p_city_id is null or coalesce(location.parent_id, location.id) = p_city_id)
    and (p_neighborhood_id is null or location.id = p_neighborhood_id)
    and (p_property_type_id is null or p.property_type_id = p_property_type_id)
    and (p_listing_type is null or p.listing_type = p_listing_type)
    and (p_min_price is null or p.price >= p_min_price)
    and (p_max_price is null or p.price <= p_max_price)
    and (p_bedrooms is null or p.bedrooms >= p_bedrooms)
    and (p_bathrooms is null or p.bathrooms >= p_bathrooms)
    and (p_min_land_size is null or p.land_size >= p_min_land_size)
    and (p_min_floor_size is null or p.floor_size >= p_min_floor_size)
    and (p_furnished_status is null or p.furnished_status = p_furnished_status)
    and (p_condition is null or p.condition = p_condition)
    and (p_verification_status is null or p.verification_status = p_verification_status)
    and not exists (
      select 1
      from unnest(coalesce(p_amenities, '{}')) required_slug
      where not exists (
        select 1 from public.property_amenities pa
        join public.amenities amenity on amenity.id = pa.amenity_id
        where pa.property_id = p.id and amenity.slug = required_slug
      )
    )
  order by
    case when p_sort = 'priceAsc' then p.price end asc nulls last,
    case when p_sort = 'priceDesc' then p.price end desc nulls last,
    case when p_sort = 'sizeDesc' then coalesce(p.floor_size, p.land_size) end desc nulls last,
    case when p_sort = 'newest' or p_sort not in ('priceAsc','priceDesc','sizeDesc') then p.published_at end desc nulls last,
    p.id
  limit least(greatest(p_limit, 1), 50)
  offset greatest(p_offset, 0)
$$;

revoke all on function public.search_property_ids(text,uuid,text,uuid,uuid,uuid,public.listing_type,numeric,numeric,integer,integer,numeric,numeric,text,text,text,text[],text,integer,integer) from public;
grant execute on function public.search_property_ids(text,uuid,text,uuid,uuid,uuid,public.listing_type,numeric,numeric,integer,integer,numeric,numeric,text,text,text,text[],text,integer,integer) to anon, authenticated;

commit;
