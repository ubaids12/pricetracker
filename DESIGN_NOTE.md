# Design Note

## Reliability approach

The scraper prefers a lightweight HTTP path and falls back to a browser path when a page requires JavaScript. Each run records an explicit scrape log, uses bounded retries with backoff, and stores price/stock observations separately from tracked-product configuration.

## Trade-offs

HTTP parsing is cheaper and easier to operate; browser scraping is more compatible but slower and more resource intensive. The initial product search uses a mock store so the application can be demonstrated without third-party API credentials.

## AI-tool corrections

This scaffold keeps deployment boundaries explicit: frontend code is deployable to Vercel, backend code to Render, and database SQL remains the source of truth for Supabase migrations.
