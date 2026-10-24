-- Karak Station application schema.
-- Run this file in the Supabase SQL Editor. Create admin users in Supabase Auth,
-- then insert each user's Auth UUID into public.admin_profiles.

create table if not exists public.admin_profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    username text not null unique,
    role text not null default 'admin',
    active boolean not null default true,
    created_at timestamptz not null default now()
);

alter table public.admin_profiles add column if not exists active boolean not null default true;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1
        from public.admin_profiles profile
        where profile.id = (select auth.uid())
          and profile.active = true
    );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create table if not exists public.app_store (
    key text primary key,
    value jsonb not null,
    updated_at timestamptz not null default now()
);

create table if not exists public.categories (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    sort_order integer not null default 0,
    created_at timestamptz not null default now()
);

create table if not exists public.foods (
    id uuid primary key default gen_random_uuid(),
    legacy_id text,
    name text not null default '',
    arabic_name text not null default '',
    arabic_confirmed boolean not null default false,
    amount text not null default '',
    image text not null default '',
    image_url text not null default '',
    category text not null default '',
    description text not null default '',
    status text not null default 'available',
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.special_foods (
    id uuid primary key default gen_random_uuid(),
    legacy_id text,
    name text not null default '',
    arabic_name text not null default '',
    description text not null default '',
    price text not null default '',
    image text not null default '',
    image_url text not null default '',
    status text not null default 'available',
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.blog_categories (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    sort_order integer not null default 0,
    created_at timestamptz not null default now()
);

create table if not exists public.blog_posts (
    id uuid primary key default gen_random_uuid(),
    legacy_id text,
    title text not null default '',
    post_date date,
    category text not null default '',
    image text not null default '',
    image_url text not null default '',
    likes integer not null default 0,
    comments integer not null default 0,
    comment_list jsonb not null default '[]'::jsonb,
    link text not null default '',
    excerpt text not null default '',
    content text not null default '',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.blog_likes (
    post_legacy_id text not null,
    visitor_id uuid not null,
    created_at timestamptz not null default now(),
    primary key (post_legacy_id, visitor_id)
);

create table if not exists public.blog_comments (
    id uuid primary key default gen_random_uuid(),
    legacy_id text,
    post_legacy_id text not null,
    commenter_name text not null,
    comment_text text not null,
    status text not null default 'published',
    created_at timestamptz not null default now(),
    constraint blog_comments_name_length check (char_length(btrim(commenter_name)) between 1 and 100),
    constraint blog_comments_text_length check (char_length(btrim(comment_text)) between 1 and 2000),
    constraint blog_comments_status check (status in ('published', 'hidden'))
);

create table if not exists public.site_settings (
    key text primary key,
    value jsonb not null,
    updated_at timestamptz not null default now()
);

create table if not exists public.orders (
    id uuid primary key default gen_random_uuid(),
    legacy_id text,
    customer_name text not null default '',
    customer_country_code text not null default '+974',
    customer_phone_number text not null default '',
    order_type text not null default 'whatsapp',
    items jsonb not null default '[]'::jsonb,
    total text not null default '',
    message text not null default '',
    status text not null default 'pending',
    source text not null default 'website',
    special_poster boolean not null default false,
    device text not null default '',
    delivered_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.blog_comments add column if not exists legacy_id text;
alter table public.orders add column if not exists device text not null default '';
alter table public.orders add column if not exists delivered_at timestamptz;
alter table public.foods add column if not exists legacy_id text;
alter table public.foods add column if not exists arabic_name text not null default '';
alter table public.foods add column if not exists arabic_confirmed boolean not null default false;
alter table public.foods add column if not exists amount text not null default '';
alter table public.foods add column if not exists image text not null default '';
alter table public.foods add column if not exists image_url text not null default '';
alter table public.foods add column if not exists category text not null default '';
alter table public.foods add column if not exists description text not null default '';
alter table public.foods add column if not exists status text not null default 'available';
alter table public.foods add column if not exists sort_order integer not null default 0;
alter table public.special_foods add column if not exists legacy_id text;
alter table public.special_foods add column if not exists arabic_name text not null default '';
alter table public.special_foods add column if not exists description text not null default '';
alter table public.special_foods add column if not exists price text not null default '';
alter table public.special_foods add column if not exists image text not null default '';
alter table public.special_foods add column if not exists image_url text not null default '';
alter table public.special_foods add column if not exists status text not null default 'available';
alter table public.special_foods add column if not exists sort_order integer not null default 0;
alter table public.blog_posts add column if not exists legacy_id text;
alter table public.blog_posts add column if not exists post_date date;
alter table public.blog_posts add column if not exists category text not null default '';
alter table public.blog_posts add column if not exists image text not null default '';
alter table public.blog_posts add column if not exists image_url text not null default '';
alter table public.blog_posts add column if not exists likes integer not null default 0;
alter table public.blog_posts add column if not exists comments integer not null default 0;
alter table public.blog_posts add column if not exists comment_list jsonb not null default '[]'::jsonb;
alter table public.blog_posts add column if not exists link text not null default '';
alter table public.blog_posts add column if not exists excerpt text not null default '';
alter table public.blog_posts add column if not exists content text not null default '';
alter table public.orders add column if not exists legacy_id text;
alter table public.orders add column if not exists customer_name text not null default '';
alter table public.orders add column if not exists customer_country_code text not null default '+974';
alter table public.orders add column if not exists customer_phone_number text not null default '';
alter table public.orders add column if not exists order_type text not null default 'whatsapp';
alter table public.orders add column if not exists items jsonb not null default '[]'::jsonb;
alter table public.orders add column if not exists total text not null default '';
alter table public.orders add column if not exists message text not null default '';
alter table public.orders add column if not exists status text not null default 'pending';
alter table public.orders add column if not exists source text not null default 'website';
alter table public.orders add column if not exists special_poster boolean not null default false;

create unique index if not exists foods_legacy_id_unique
    on public.foods (legacy_id) where legacy_id is not null and legacy_id <> '';
create unique index if not exists special_foods_legacy_id_unique
    on public.special_foods (legacy_id) where legacy_id is not null and legacy_id <> '';
create unique index if not exists blog_posts_legacy_id_unique
    on public.blog_posts (legacy_id) where legacy_id is not null and legacy_id <> '';
create unique index if not exists orders_legacy_id_unique
    on public.orders (legacy_id);
create unique index if not exists blog_comments_legacy_id_unique
    on public.blog_comments (legacy_id);
create index if not exists foods_category_sort_idx on public.foods (category, sort_order);
create index if not exists special_foods_sort_idx on public.special_foods (sort_order);
create index if not exists blog_posts_date_idx on public.blog_posts (post_date desc, created_at desc);
create index if not exists blog_comments_post_date_idx on public.blog_comments (post_legacy_id, created_at desc);
create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_source_created_at_idx on public.orders (source, created_at desc);

-- Only the currency is public; payment account and UPI details remain admin-only.
insert into public.site_settings (key, value)
select 'payment_currency', jsonb_build_object(
    'currencyCountry',
    coalesce(value -> 'currencyCountry', to_jsonb('QA'::text))
)
from public.site_settings
where key = 'payment_details'
on conflict (key) do nothing;

alter table public.admin_profiles enable row level security;
alter table public.app_store enable row level security;
alter table public.categories enable row level security;
alter table public.foods enable row level security;
alter table public.special_foods enable row level security;
alter table public.blog_categories enable row level security;
alter table public.blog_posts enable row level security;
alter table public.blog_likes enable row level security;
alter table public.blog_comments enable row level security;
alter table public.site_settings enable row level security;
alter table public.orders enable row level security;

grant select on public.admin_profiles to authenticated;
grant select, insert, update, delete on public.app_store to authenticated;
grant select, insert, update, delete on public.categories, public.foods,
    public.special_foods, public.blog_categories, public.blog_posts to authenticated;
grant select, insert, update, delete on public.blog_likes, public.blog_comments to authenticated;
grant select, insert, update, delete on public.site_settings to authenticated;
grant select, insert, update, delete on public.orders to authenticated;
grant select on public.categories, public.foods, public.special_foods,
    public.blog_categories, public.blog_posts to anon, authenticated;
grant select on public.site_settings to anon;
grant insert on public.orders to anon;

drop policy if exists admin_profiles_read_self_or_admin on public.admin_profiles;
create policy admin_profiles_read_self_or_admin on public.admin_profiles
    for select to authenticated
    using (id = (select auth.uid()) or (select public.is_admin()));
drop policy if exists admin_profiles_admin_write on public.admin_profiles;
create policy admin_profiles_admin_write on public.admin_profiles
    for all to authenticated
    using ((select public.is_admin()))
    with check ((select public.is_admin()));

drop policy if exists app_store_admin_access on public.app_store;
create policy app_store_admin_access on public.app_store
    for all to authenticated
    using ((select public.is_admin()))
    with check ((select public.is_admin()));

drop policy if exists categories_public_read on public.categories;
create policy categories_public_read on public.categories
    for select to anon, authenticated using (true);
drop policy if exists categories_admin_write on public.categories;
create policy categories_admin_write on public.categories
    for all to authenticated
    using ((select public.is_admin()))
    with check ((select public.is_admin()));

drop policy if exists foods_public_read_available on public.foods;
create policy foods_public_read_available on public.foods
    for select to anon using (status <> 'unavailable');
drop policy if exists foods_authenticated_read on public.foods;
create policy foods_authenticated_read on public.foods
    for select to authenticated using (status <> 'unavailable' or (select public.is_admin()));
drop policy if exists foods_admin_write on public.foods;
create policy foods_admin_write on public.foods
    for all to authenticated
    using ((select public.is_admin()))
    with check ((select public.is_admin()));

drop policy if exists special_foods_public_read_available on public.special_foods;
create policy special_foods_public_read_available on public.special_foods
    for select to anon using (status <> 'unavailable');
drop policy if exists special_foods_authenticated_read on public.special_foods;
create policy special_foods_authenticated_read on public.special_foods
    for select to authenticated using (status <> 'unavailable' or (select public.is_admin()));
drop policy if exists special_foods_admin_write on public.special_foods;
create policy special_foods_admin_write on public.special_foods
    for all to authenticated
    using ((select public.is_admin()))
    with check ((select public.is_admin()));

drop policy if exists blog_categories_public_read on public.blog_categories;
create policy blog_categories_public_read on public.blog_categories
    for select to anon, authenticated using (true);
drop policy if exists blog_categories_admin_write on public.blog_categories;
create policy blog_categories_admin_write on public.blog_categories
    for all to authenticated
    using ((select public.is_admin()))
    with check ((select public.is_admin()));

drop policy if exists blog_posts_public_read on public.blog_posts;
create policy blog_posts_public_read on public.blog_posts
    for select to anon, authenticated using (true);
drop policy if exists blog_posts_admin_write on public.blog_posts;
create policy blog_posts_admin_write on public.blog_posts
    for all to authenticated
    using ((select public.is_admin()))
    with check ((select public.is_admin()));

drop policy if exists blog_comments_public_read on public.blog_comments;
create policy blog_comments_public_read on public.blog_comments
    for select to anon, authenticated using (status = 'published');
drop policy if exists blog_comments_public_insert on public.blog_comments;
create policy blog_comments_public_insert on public.blog_comments
    for insert to anon, authenticated
    with check (
        status = 'published'
        and char_length(btrim(commenter_name)) between 1 and 100
        and char_length(btrim(comment_text)) between 1 and 2000
    );
drop policy if exists blog_comments_admin_write on public.blog_comments;
create policy blog_comments_admin_write on public.blog_comments
    for all to authenticated
    using ((select public.is_admin()))
    with check ((select public.is_admin()));

drop policy if exists blog_likes_admin_access on public.blog_likes;
create policy blog_likes_admin_access on public.blog_likes
    for all to authenticated
    using ((select public.is_admin()))
    with check ((select public.is_admin()));

drop policy if exists site_settings_public_safe_read on public.site_settings;
create policy site_settings_public_safe_read on public.site_settings
    for select to anon, authenticated
    using (key in ('shop_details', 'whatsapp_order', 'whatsapp_booking', 'payment_currency'));
drop policy if exists site_settings_admin_access on public.site_settings;
create policy site_settings_admin_access on public.site_settings
    for all to authenticated
    using ((select public.is_admin()))
    with check ((select public.is_admin()));

drop policy if exists orders_public_insert on public.orders;
create policy orders_public_insert on public.orders
    for insert to anon, authenticated
    with check (
        status in ('pending', 'new')
        and char_length(customer_name) <= 200
        and char_length(customer_phone_number) <= 80
        and char_length(message) <= 10000
    );
drop policy if exists orders_admin_access on public.orders;
create policy orders_admin_access on public.orders
    for all to authenticated
    using ((select public.is_admin()))
    with check ((select public.is_admin()));

create or replace function public.get_public_blog_engagement()
returns table (post_legacy_id text, likes bigint, comment_list jsonb)
language sql
stable
security definer
set search_path = ''
as $$
    select
        post.legacy_id,
        (select count(*) from public.blog_likes as liked where liked.post_legacy_id = post.legacy_id),
        coalesce((
            select jsonb_agg(jsonb_build_object(
                'id', comment.id::text,
                'name', comment.commenter_name,
                'text', comment.comment_text,
                'date', comment.created_at
            ) order by comment.created_at desc)
            from public.blog_comments as comment
            where comment.post_legacy_id = post.legacy_id
              and comment.status = 'published'
        ), '[]'::jsonb)
    from public.blog_posts as post
    where post.legacy_id is not null and post.legacy_id <> '';
$$;

create or replace function public.like_blog_post(p_post_legacy_id text, p_visitor_id uuid)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
    total_likes bigint;
begin
    if p_visitor_id is null or not exists (
        select 1 from public.blog_posts
        where legacy_id = p_post_legacy_id and legacy_id <> ''
    ) then
        raise exception 'Blog post or visitor ID is invalid.';
    end if;

    insert into public.blog_likes (post_legacy_id, visitor_id)
    values (p_post_legacy_id, p_visitor_id)
    on conflict (post_legacy_id, visitor_id) do nothing;

    select count(*) into total_likes
    from public.blog_likes
    where post_legacy_id = p_post_legacy_id;
    return total_likes;
end;
$$;

revoke all on function public.get_public_blog_engagement() from public;
revoke all on function public.like_blog_post(text, uuid) from public;
grant execute on function public.get_public_blog_engagement() to anon, authenticated;
grant execute on function public.like_blog_post(text, uuid) to anon, authenticated;

insert into storage.buckets (id, name, public)
values ('karak-images', 'karak-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists karak_images_public_read on storage.objects;
create policy karak_images_public_read on storage.objects
    for select to anon, authenticated
    using (bucket_id = 'karak-images');
drop policy if exists karak_images_admin_insert on storage.objects;
create policy karak_images_admin_insert on storage.objects
    for insert to authenticated
    with check (bucket_id = 'karak-images' and (select public.is_admin()));
drop policy if exists karak_images_admin_update on storage.objects;
create policy karak_images_admin_update on storage.objects
    for update to authenticated
    using (bucket_id = 'karak-images' and (select public.is_admin()))
    with check (bucket_id = 'karak-images' and (select public.is_admin()));
drop policy if exists karak_images_admin_delete on storage.objects;
create policy karak_images_admin_delete on storage.objects
    for delete to authenticated
    using (bucket_id = 'karak-images' and (select public.is_admin()));
