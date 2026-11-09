-- 家庭衣橱 · Supabase 建表 SQL
-- 在 Supabase 控制台 SQL Editor 中整段执行一次即可。
-- 数据表不启用行级安全策略隔离，适合只有两个人的私有项目；
-- 请勿把 anon key 公开到无关场合。

create table if not exists public.categories (
  id text primary key,
  name text not null,
  parent_id text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clothes (
  id text primary key,
  owner text not null,
  category_id text,
  sub_category_id text,
  name text not null default '',
  color text default '',
  seasons jsonb not null default '[]'::jsonb,
  occasions jsonb not null default '[]'::jsonb,
  thickness text default '',
  size text default '',
  location text default '',
  status text default 'active',
  brand text default '',
  price numeric,
  purchase_date date,
  photo text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.categories enable row level security;
alter table public.clothes enable row level security;

drop policy if exists "categories anon access" on public.categories;
create policy "categories anon access" on public.categories
  for all to anon using (true) with check (true);

drop policy if exists "clothes anon access" on public.clothes;
create policy "clothes anon access" on public.clothes
  for all to anon using (true) with check (true);
