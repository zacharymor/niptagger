create table if not exists public.levels (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  image_url text not null,
  grid_left double precision not null,
  grid_top double precision not null,
  grid_size double precision not null,
  winning_squares integer[] not null
);

alter table public.levels enable row level security;

drop policy if exists "public can read levels" on public.levels;
create policy "public can read levels"
on public.levels
for select
to anon
using (true);

insert into storage.buckets (id, name, public)
values ('level-images', 'level-images', true)
on conflict (id) do update set public = true;

drop policy if exists "public can read level images" on storage.objects;
create policy "public can read level images"
on storage.objects
for select
to anon
using (bucket_id = 'level-images');
