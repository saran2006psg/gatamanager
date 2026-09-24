create extension if not exists "uuid-ossp";

create table if not exists public.products (
  id uuid primary key default uuid_generate_v4(),
  product_id text not null unique,
  product_name text,
  ornament_type text not null,
  original_image_path text not null,
  created_at timestamp with time zone default now()
);

create table if not exists public.test_images (
  id uuid primary key default uuid_generate_v4(),
  product_id text not null references public.products(product_id) on delete cascade,
  image_path text not null,
  failure_condition text not null,
  notes text,
  created_at timestamp with time zone default now(),
  constraint test_images_unique_record unique (product_id, image_path, failure_condition)
);

create index if not exists idx_products_product_id on public.products(product_id);
create index if not exists idx_test_images_product_id on public.test_images(product_id);
create index if not exists idx_test_images_failure_condition on public.test_images(failure_condition);

create policy "Allow public reads on products" on public.products for select using (true);
create policy "Allow public inserts on products" on public.products for insert with check (true);
create policy "Allow public updates on products" on public.products for update using (true) with check (true);
create policy "Allow public deletes on products" on public.products for delete using (true);

create policy "Allow public reads on test_images" on public.test_images for select using (true);
create policy "Allow public inserts on test_images" on public.test_images for insert with check (true);
create policy "Allow public updates on test_images" on public.test_images for update using (true) with check (true);
create policy "Allow public deletes on test_images" on public.test_images for delete using (true);

create policy "Allow public upload to catalogue-images" on storage.objects for insert with check (bucket_id = 'catalogue-images');
create policy "Allow public upload to stumper-images" on storage.objects for insert with check (bucket_id = 'stumper-images');
create policy "Allow public read to catalogue-images" on storage.objects for select using (bucket_id = 'catalogue-images');
create policy "Allow public read to stumper-images" on storage.objects for select using (bucket_id = 'stumper-images');
create policy "Allow public update to catalogue-images" on storage.objects for update using (bucket_id = 'catalogue-images');
create policy "Allow public update to stumper-images" on storage.objects for update using (bucket_id = 'stumper-images');
create policy "Allow public delete to catalogue-images" on storage.objects for delete using (bucket_id = 'catalogue-images');
create policy "Allow public delete to stumper-images" on storage.objects for delete using (bucket_id = 'stumper-images');

insert into storage.buckets (id, name, public)
values ('catalogue-images', 'catalogue-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('stumper-images', 'stumper-images', true)
on conflict (id) do nothing;
