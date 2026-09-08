-- Hub4Buddies admin seed. Keeps the existing RLS model and makes the requested account the initial admin.
insert into public.admins (email)
values ('anishkumar.07wi@gmail.com')
on conflict (email) do nothing;

-- Resource uploads are kept in the existing learning-assets bucket.
-- If your project does not have it yet, create a private or public bucket named learning-assets in Supabase Storage.
