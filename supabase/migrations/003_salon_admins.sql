-- サロン共同管理者テーブル（承認済み）
create table salon_admins (
  salon_id uuid not null references salons(id) on delete cascade,
  owner_id uuid not null references owners(id) on delete cascade,
  invited_by uuid references owners(id),
  created_at timestamptz not null default now(),
  primary key (salon_id, owner_id)
);
create index idx_salon_admins_owner_id on salon_admins(owner_id);
create index idx_salon_admins_salon_id on salon_admins(salon_id);

-- 招待中テーブル（まだ owner 登録していないメール向け）
create table salon_admin_invites (
  id uuid primary key default uuid_generate_v4(),
  salon_id uuid not null references salons(id) on delete cascade,
  email text not null,
  invited_by uuid not null references owners(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (salon_id, email)
);
create index idx_salon_admin_invites_email on salon_admin_invites(email);
