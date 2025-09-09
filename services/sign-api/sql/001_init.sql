create extension if not exists pgcrypto;

create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  created_at timestamptz not null default now()
);

create type doc_status as enum ('draft','out_for_signature','completed','void');

create table documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references users(id),
  title text,
  pdf_url text not null,
  status doc_status not null default 'draft',
  created_at timestamptz not null default now()
);
create index on documents(owner_id);
create index on documents(status);

create table signers (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  role_index int not null,
  name text not null,
  email text not null,
  status text not null default 'pending',
  viewed_at timestamptz,
  signed_at timestamptz,
  token_hash text not null
);
create unique index on signers(document_id, role_index);
create index on signers(document_id);
create index on signers(email);

create table fields (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  assigned_signer_id uuid references signers(id),
  type text not null,
  page int not null,
  x numeric not null,
  y numeric not null,
  w numeric not null,
  h numeric not null,
  rotate numeric not null default 0,
  required boolean not null default false,
  placeholder text,
  color text,
  font_key text,
  size_pt numeric,
  locked_at_send boolean not null default false
);
create index on fields(document_id);
create index on fields(assigned_signer_id);

create table events (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  signer_id uuid references signers(id),
  type text not null,
  meta_json jsonb,
  created_at timestamptz not null default now()
);
create index on events(document_id, created_at);

create table executions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  final_pdf_url text not null,
  sha256_hash text not null,
  completed_at timestamptz not null default now()
);
create unique index on executions(document_id);

