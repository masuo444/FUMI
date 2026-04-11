-- オーナーにプラン管理カラムを追加
alter table owners
  add column if not exists plan text not null default 'free' check (plan in ('free', 'pro')),
  add column if not exists stripe_customer_id text default null,
  add column if not exists stripe_subscription_id text default null,
  add column if not exists pro_expires_at timestamptz default null;

-- オーナーのStripe Webhook連携テーブル
create table if not exists owner_stripe_webhooks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references owners(id) on delete cascade,
  salon_id uuid not null references salons(id) on delete cascade,
  webhook_token text not null unique default encode(gen_random_bytes(32), 'hex'),
  stripe_webhook_secret text not null,
  created_at timestamptz not null default now()
);
