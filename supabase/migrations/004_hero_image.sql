-- Add hero_image_url to salons table
alter table salons add column if not exists hero_image_url text default null;
