# Deployment checklist

## Supabase

1. Open the Supabase SQL Editor.
2. Run `db/schema.sql` for a new project.
3. For an existing project, run migrations `001` through `005` in order.
4. Keep the Supabase service-role key server-only.

## Render backend

1. Create a Web Service from the GitHub repository.
2. Set the root directory to `backend`.
3. Use `npm install && npx playwright install --with-deps chromium` as the build command.
4. Use `npm start` as the start command.
5. Add `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STORE_BASE_URL`, and a random `CRON_SECRET` as environment variables.
6. Deploy and verify `GET /health`.

## Seed products

After the database and Render variables are ready, run locally with the same private Supabase values:

```powershell
npm.cmd --prefix backend run db:seed
```

This adds three INE products and does not duplicate existing rows.

## Vercel frontend

1. Import the repository into Vercel.
2. Set the root directory to `frontend`.
3. Add `VITE_API_BASE_URL=https://YOUR-RENDER-SERVICE.onrender.com/api`.
4. Deploy and open the generated Vercel URL.

## Cron and headed recording

Configure cron-job.org with `POST https://YOUR-RENDER-SERVICE.onrender.com/api/scrape/run`, the `x-cron-secret` header, and schedule `0 */2 * * *`. For the recording, run `node scripts/runHeadedScrape.js https://demo.inelabteamdev.com/item/2024 Standard` locally and capture the visible browser plus retry/quote output.