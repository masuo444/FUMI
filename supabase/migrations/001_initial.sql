-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- owners
-- ============================================================
create table owners (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text not null unique,
  created_at timestamptz not null default now()
);

-- ============================================================
-- salons
-- ============================================================
create table salons (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references owners(id) on delete cascade,
  name text not null,
  description text,
  payment_url text,
  created_at timestamptz not null default now()
);
create index idx_salons_owner_id on salons(owner_id);

-- ============================================================
-- members
-- ============================================================
create type member_status as enum ('active', 'inactive');
create type preferred_language as enum ('ja', 'en');

create table members (
  id uuid primary key default uuid_generate_v4(),
  salon_id uuid not null references salons(id) on delete cascade,
  email text not null,
  name text,
  preferred_language preferred_language not null default 'ja',
  status member_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(salon_id, email)
);
create index idx_members_salon_id on members(salon_id);
create index idx_members_status on members(status);

-- ============================================================
-- posts
-- ============================================================
create type post_status as enum ('draft', 'published');
create type language_code as enum ('ja', 'en');

create table posts (
  id uuid primary key default uuid_generate_v4(),
  salon_id uuid not null references salons(id) on delete cascade,
  owner_id uuid not null references owners(id) on delete cascade,
  original_language language_code not null default 'ja',
  cover_image_url text,
  status post_status not null default 'draft',
  send_notification boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_posts_salon_id on posts(salon_id);
create index idx_posts_owner_id on posts(owner_id);
create index idx_posts_status on posts(status);

-- ============================================================
-- post_translations
-- ============================================================
create type translation_status as enum ('completed', 'pending_insufficient_balance', 'failed');

create table post_translations (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references posts(id) on delete cascade,
  language_code language_code not null,
  title text not null,
  body text not null,
  status translation_status not null default 'completed',
  generated_at timestamptz not null default now(),
  unique(post_id, language_code)
);
create index idx_post_translations_post_id on post_translations(post_id);

-- ============================================================
-- post_images
-- ============================================================
create table post_images (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references posts(id) on delete cascade,
  image_url text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index idx_post_images_post_id on post_images(post_id);

-- ============================================================
-- notifications
-- ============================================================
create type notification_status as enum ('pending', 'sent', 'failed');

create table notifications (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references posts(id) on delete cascade,
  salon_id uuid not null references salons(id) on delete cascade,
  status notification_status not null default 'pending',
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_notifications_post_id on notifications(post_id);

-- ============================================================
-- owner_wallets
-- ============================================================
create table owner_wallets (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null unique references owners(id) on delete cascade,
  balance integer not null default 0, -- in JPY (yen)
  updated_at timestamptz not null default now()
);

-- ============================================================
-- wallet_transactions
-- ============================================================
create type transaction_type as enum ('charge', 'consume', 'refund');
create type reference_type as enum ('translation', 'manual_adjust', 'stripe_charge');

create table wallet_transactions (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references owners(id) on delete cascade,
  type transaction_type not null,
  amount integer not null, -- positive for charge/refund, negative for consume
  reference_type reference_type not null,
  reference_id text,
  note text,
  created_at timestamptz not null default now()
);
create index idx_wallet_transactions_owner_id on wallet_transactions(owner_id);

-- ============================================================
-- owner_sender_domains
-- ============================================================
create type domain_verification_status as enum ('pending', 'verified', 'failed');

create table owner_sender_domains (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references owners(id) on delete cascade,
  domain text not null,
  resend_domain_id text, -- Resend domain ID for verification
  verification_status domain_verification_status not null default 'pending',
  dkim_status boolean not null default false,
  spf_status boolean not null default false,
  dmarc_status boolean not null default false,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  verified_at timestamptz
);
create index idx_owner_sender_domains_owner_id on owner_sender_domains(owner_id);

-- ============================================================
-- owner_sender_addresses
-- ============================================================
create table owner_sender_addresses (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references owners(id) on delete cascade,
  sender_domain_id uuid references owner_sender_domains(id) on delete set null,
  from_name text not null,
  from_email text not null,
  reply_to_email text,
  is_default boolean not null default false
);
create index idx_owner_sender_addresses_owner_id on owner_sender_addresses(owner_id);

-- ============================================================
-- RLS Policies
-- ============================================================

-- Enable RLS on all tables
alter table owners enable row level security;
alter table salons enable row level security;
alter table members enable row level security;
alter table posts enable row level security;
alter table post_translations enable row level security;
alter table post_images enable row level security;
alter table notifications enable row level security;
alter table owner_wallets enable row level security;
alter table wallet_transactions enable row level security;
alter table owner_sender_domains enable row level security;
alter table owner_sender_addresses enable row level security;

-- owners: can read/update own row (auth.uid() maps to owners.id via email)
create policy "owners_self" on owners
  for all using (id = (
    select id from owners where email = auth.jwt() ->> 'email' limit 1
  ));

-- helper function: get owner_id from auth session
create or replace function get_owner_id()
returns uuid language sql stable security definer as $$
  select id from owners where email = auth.jwt() ->> 'email' limit 1;
$$;

-- salons
create policy "salons_owner" on salons
  for all using (owner_id = get_owner_id());

-- members
create policy "members_owner" on members
  for all using (
    salon_id in (select id from salons where owner_id = get_owner_id())
  );

-- posts
create policy "posts_owner" on posts
  for all using (owner_id = get_owner_id());

-- post_translations: owner can manage; public can read published
create policy "translations_owner" on post_translations
  for all using (
    post_id in (select id from posts where owner_id = get_owner_id())
  );
create policy "translations_public_read" on post_translations
  for select using (
    post_id in (select id from posts where status = 'published')
  );

-- post_images
create policy "post_images_owner" on post_images
  for all using (
    post_id in (select id from posts where owner_id = get_owner_id())
  );
create policy "post_images_public_read" on post_images
  for select using (
    post_id in (select id from posts where status = 'published')
  );

-- notifications
create policy "notifications_owner" on notifications
  for all using (
    salon_id in (select id from salons where owner_id = get_owner_id())
  );

-- owner_wallets
create policy "wallets_owner" on owner_wallets
  for all using (owner_id = get_owner_id());

-- wallet_transactions
create policy "wallet_transactions_owner" on wallet_transactions
  for all using (owner_id = get_owner_id());

-- owner_sender_domains
create policy "sender_domains_owner" on owner_sender_domains
  for all using (owner_id = get_owner_id());

-- owner_sender_addresses
create policy "sender_addresses_owner" on owner_sender_addresses
  for all using (owner_id = get_owner_id());

-- Public read for published posts
create policy "posts_public_read" on posts
  for select using (status = 'published');

-- ============================================================
-- Triggers: updated_at auto-update
-- ============================================================
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger members_updated_at before update on members
  for each row execute function update_updated_at();
create trigger posts_updated_at before update on posts
  for each row execute function update_updated_at();

-- ============================================================
-- Auto-create wallet on owner insert
-- ============================================================
create or replace function create_owner_wallet()
returns trigger language plpgsql security definer as $$
begin
  insert into owner_wallets (owner_id, balance) values (new.id, 0);
  return new;
end;
$$;

create trigger on_owner_created after insert on owners
  for each row execute function create_owner_wallet();
