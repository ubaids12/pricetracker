# Architecture

The Vercel-hosted React frontend calls the Render-hosted Express API. The API persists tracked products, observations, and scrape logs in Supabase. A scheduled request invokes the secured scrape runner.
