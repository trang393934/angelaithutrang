-- Create public bucket for community post images
insert into storage.buckets (id, name, public)
values ('community', 'community', true)
on conflict (id) do nothing;

-- Public read access to community images
create policy "Community images are publicly accessible"
on storage.objects
for select
using (bucket_id = 'community');

-- Authenticated users can upload community images (owner-based)
create policy "Users can upload community images"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'community' and auth.uid() = owner);

-- Authenticated users can update their own community images
create policy "Users can update own community images"
on storage.objects
for update
to authenticated
using (bucket_id = 'community' and auth.uid() = owner);

-- Authenticated users can delete their own community images
create policy "Users can delete own community images"
on storage.objects
for delete
to authenticated
using (bucket_id = 'community' and auth.uid() = owner);
