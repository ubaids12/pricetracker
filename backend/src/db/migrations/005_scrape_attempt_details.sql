alter table scrape_logs add column if not exists selected_option text;
alter table scrape_logs add column if not exists attempt_number integer;

update scrape_logs
set selected_option = coalesce(selected_option, ''), attempt_number = coalesce(attempt_number, 1)
where selected_option is null or attempt_number is null;

alter table scrape_logs alter column selected_option set not null;
alter table scrape_logs alter column attempt_number set not null;