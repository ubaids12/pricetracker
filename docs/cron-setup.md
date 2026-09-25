# Cron setup

1. Create a cron-job.org request using `POST`.
2. Point it at `https://YOUR-RENDER-SERVICE/api/scrape/run`.
3. Add the header `x-cron-secret` with the backend `CRON_SECRET` value.
4. Choose the desired interval and inspect the response history.

Use a two-hour schedule (`0 */2 * * *`). The request must include the exact `CRON_SECRET` configured on Render. Do not place the secret in the URL.
