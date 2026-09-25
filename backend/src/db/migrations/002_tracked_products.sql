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
