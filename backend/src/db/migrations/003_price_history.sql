create table if not exists price_history (
	id bigint generated always as identity primary key,
	product_id uuid not null references tracked_products(id) on delete cascade,
	selected_option text not null,
	price numeric,
	in_stock boolean,
	observed_at timestamptz not null default now()
);
