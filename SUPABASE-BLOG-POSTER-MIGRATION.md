# Blog + Special Poster Supabase Migration

This version connects Blog Admin and Special Poster Admin to Supabase.

## Tables used
- `blog_categories`
- `blog_posts`
- `special_foods`

The schema file at `supabase/schema.sql` contains these tables, RLS, public read policies, and admin write policies.

## What changed
- Blog Admin reads/writes through `KarakDB.getBlog()` / `KarakDB.saveBlog()`.
- Special Poster Admin reads/writes through `KarakDB.getSpecialFoods()` / `KarakDB.saveSpecialFoods()`.
- `supabase-migration.html` can migrate the current browser's legacy localStorage data after an active Supabase admin signs in.
- Public Blog page and homepage recent blog section read from Supabase.
- Homepage Special Poster reads `special_foods` from Supabase.
- Admin dashboard Blog/Special Poster counts read from Supabase.

## Important
Keep the working `js/supabase-config.js` values in this project. Use only the public/publishable (anon) key in frontend files; never put a service-role/secret key in the website.

The migration tool can be run separately in each browser profile that contains legacy data. WhatsApp access tokens are intentionally excluded.
