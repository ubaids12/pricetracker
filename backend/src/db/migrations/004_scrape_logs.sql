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
