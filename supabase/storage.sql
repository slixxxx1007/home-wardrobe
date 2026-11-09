-- 家庭衣橱 · 图片存储（Supabase Storage）
-- 在 Supabase 控制台 SQL Editor 中整段执行一次即可（在 schema.sql 之后）。
-- 作用：
--   1. 创建公开读取的 clothes 存储桶（单文件上限 5MB，仅允许图片）
--   2. 给 clothes 表补充 photo_thumb 列（列表用缩略图，省流量）
--   3. 放开 anon 读写该桶的权限，与数据表策略保持一致

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('clothes', 'clothes', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = true,
      file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

alter table public.clothes add column if not exists photo_thumb text default '';

drop policy if exists "clothes photos read" on storage.objects;
create policy "clothes photos read" on storage.objects
  for select to anon using (bucket_id = 'clothes');

drop policy if exists "clothes photos insert" on storage.objects;
create policy "clothes photos insert" on storage.objects
  for insert to anon with check (bucket_id = 'clothes');

drop policy if exists "clothes photos update" on storage.objects;
create policy "clothes photos update" on storage.objects
  for update to anon using (bucket_id = 'clothes') with check (bucket_id = 'clothes');

drop policy if exists "clothes photos delete" on storage.objects;
create policy "clothes photos delete" on storage.objects
  for delete to anon using (bucket_id = 'clothes');
