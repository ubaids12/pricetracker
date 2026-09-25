create unique index if not exists tracked_products_option_unique_idx
on tracked_products (store_product_id, coalesce(selected_option_id, selected_option));

alter table price_history
  add constraint price_history_price_nonnegative check (price is null or price >= 0);

alter table scrape_logs
  add constraint scrape_logs_attempt_positive check (attempt_number > 0);