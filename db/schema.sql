create table if not exists tracked_products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null,
  store text,
  store_product_id text not null,
  selected_option text not null,
  selected_option_id text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists price_history (
  id bigint generated always as identity primary key,
  product_id uuid not null references tracked_products(id) on delete cascade,
  selected_option text not null,
  price numeric,
  in_stock boolean,
  observed_at timestamptz not null default now()
);

create table if not exists scrape_logs (
  id bigint generated always as identity primary key,
  product_id uuid references tracked_products(id) on delete cascade,
  selected_option text not null,
  attempt_number integer not null,
  strategy text not null,
  status text not null,
  outcome text not null check (outcome in ('success', 'retried', 'failed')),
  error_message text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create unique index if not exists tracked_products_option_unique_idx
on tracked_products (store_product_id, coalesce(selected_option_id, selected_option));
