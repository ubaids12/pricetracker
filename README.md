# Price Tracker

A React frontend and Express backend for tracking product price and stock history.

## Setup

1. Copy `.env.example` to the relevant frontend and backend `.env` files.
2. Install dependencies in `frontend/` and `backend/` with `npm install`.
3. Apply `db/schema.sql` to Supabase.
4. Start the backend, then the frontend.

After applying the schema, set the server-only `SUPABASE_SERVICE_ROLE_KEY` in `backend/.env` and run `npm run db:verify --prefix backend`. The verification command inserts and removes test rows.

## Scrape schedule

Configure cron-job.org to call `POST /api/scrape/run` with the `x-cron-secret` header. See `docs/cron-setup.md`.

## Environment variables

See `.env.example`, `frontend/.env.example`, and `backend/.env.example`.
