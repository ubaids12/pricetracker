# Price Tracker
## Full-Stack Product Price & Stock Monitoring — Web Scraping

A full-stack price monitoring application built to track product prices and stock availability over time.

The application allows users to search the INE Store catalog, select a specific product option/edition, track it, scrape its price and stock on a schedule, view history/logs, and export scrape history as CSV.

---

## Live Project

- **Frontend:** https://pricetracker-fztnbuk82-ubaid-f409.vercel.app/
- **Backend:** AWS EC2 (Docker container)
- **Database:** Supabase PostgreSQL
- **Repository:** https://github.com/ubaids12/pricetracker

---

## Tech Stack

```
Layer                 | Technology
-----------------------|-------------------------------
Frontend               | React, Vite
Backend                | Node.js, Express.js
Scraping (light)       | Fetch/HTTP, Cheerio
Scraping (fallback)    | Playwright, Chromium
Database               | Supabase PostgreSQL
Scheduling             | cron-job.org
Containerization       | Docker
CI                     | GitHub Actions
CD                     | Jenkins
Backend Hosting        | AWS EC2
Frontend Hosting       | Vercel
Version Control        | Git, GitHub
```

---

## Deployment

### ✅ Architecture

```
React Frontend
      |
      v
    Vercel
      |
      v
Vercel Rewrite (/api/*)
      |
      v
   AWS EC2
      |
      v
Docker Container
      |
      v
Node.js + Express API
      |
      v
Supabase PostgreSQL


cron-job.org
      |
      v
POST /api/scrape/run
Header: x-cron-secret
      |
      v
AWS EC2 Backend  (same box as above)
```

The frontend calls a same-origin `/api` path, and `frontend/vercel.json` rewrites those requests to the AWS backend. This keeps the browser on the Vercel HTTPS origin while API traffic is forwarded to EC2.

### 🚀 Backend — AWS EC2 + Docker

The production backend runs inside Docker on an EC2 Ubuntu instance, exposed on port `3000`.

- **Elastic IP (current):** `16.192.197.234`
- **Health endpoint:** `http://16.192.197.234:3000/health`

The container runs with `--restart unless-stopped`, so it automatically restarts after a reboot unless explicitly stopped.

**Jenkins CI/CD Flow:**

```
GitHub
   |
   v
Jenkins
   |
   v
Docker Build
   |
   v
Stop Old Container
   |
   v
Start New Container
   |
   v
Verify Container Running
```

Jenkins deploys using a server-side `.env` file (`/home/ubuntu/pricetracker/backend/.env`) passed to Docker via `--env-file`, so secrets never touch GitHub.

**GitHub Actions (CI):**

```
git push
   |
   v
GitHub Actions
   |
   v
Install Dependencies
   |
   v
Run Tests
   |
   v
Run Production Builds
```

CI handles install/test/build checks for both frontend and backend; Jenkins handles backend deployment.

---

## Core Features

### 1. Product Search and Option Selection

Users search the INE Store catalog and choose the exact product **option or edition** to monitor — not just the product name. This matters because the same product can have multiple editions, kits, or variants at different prices.

```
User enters product name
        |
        v
   React Frontend
        |
        v
GET /api/products/search
        |
        v
   INE Store Catalog
        |
        v
  Matching Products
        |
        v
User selects Product + Option
        |
        v
POST /api/products/tracked
        |
        v
Tracked Product saved in Supabase
```

### 2. Product Tracking

A tracked product stores:

```
- Store product ID
- Product name / URL
- Selected option + option ID
- Active status
- Created timestamp
```

### 3. Price and Stock Scraping — Two-Strategy Design

The scraper uses a lightweight-first approach, falling back to a full browser only when necessary.

```
Tracked Product
      |
      v
Strategy 1: HTTP + Cheerio
      |
      v
   Success? ---- Yes ----> Save Result
      |
      No
      |
      v
Strategy 2: Playwright (Chromium)
      |
      v
Open Product Page
      |
      v
Handle Consent Dialog
      |
      v
Select Product Option
      |
      v
Interact with Price/Quote Section
      |
      v
Wait for Price to Render
      |
      v
Extract Price + Stock
      |
      v
Save Result
```

- **HTTP strategy:** faster and cheaper — a plain request parsed with Cheerio.
- **Playwright fallback:** used only when the HTTP strategy can't get a complete result, since the mock store can require browser interaction and dynamically rendered data.

### 4. Reliability and Retry Handling

Scrape attempts are bounded and use increasing delays between retries, so failures are recorded rather than silently dropped.

```
Attempt 1
   |
   v
 Success? ---- Yes ----> status: success
   |
   No
   |
   v
Log attempt + error
   |
   v
Backoff delay
   |
   v
Attempt 2 (retry)
   |
   v
 Success? ---- Yes ----> status: retried
   |
   No
   |
   v
Repeat up to bounded limit
   |
   v
Still failing ----> status: failed
```

For a failed attempt:

```
price          = blank
in_stock       = blank
status/outcome = failed
error_message  = stored
```

Every attempt — success or failure — is written to `scrape_logs`, so the history stays honest.

### 5. Scheduled Scraping via cron-job.org

Instead of running an internal scheduler process, scraping is triggered externally on a schedule and authenticated with a shared secret.

```
cron-job.org
      |
      v
POST /api/scrape/run
Header: x-cron-secret
      |
      v
Express Auth Middleware
      |
      v
Load Active Tracked Products (Supabase)
      |
      v
HTTP Scrape
      |
      v
Complete? ---- No ----> Playwright Fallback
      |                         |
     Yes                        |
      |<------------------------+
      v
Retry on Failure (if needed)
      |
      v
Validate Price + Stock
      |
      v
Save to price_history + scrape_logs
```

A two-hour schedule is expressed as:

```
0 */2 * * *
```

The secret must match the backend's `CRON_SECRET` and is never placed in the URL.

### 6. Price History

Every successful (or recovered) scrape is stored in `price_history`, so the dashboard can show a tracked option's price/stock over time.

```
Scrape
   |
   v
Price + In-Stock Status
   |
   v
Timestamp
   |
   v
Supabase
   |
   v
History
```

### 7. Per-Product Scrape Logs

Every scrape attempt is recorded in `scrape_logs` with:

```
- Attempt number
- Strategy used (HTTP or Playwright)
- Status / outcome
- Timestamps (started/finished)
- Error message when applicable
```

Failures remain visible instead of being hidden.

### 8. CSV Export

The dashboard provides CSV export per tracked product via `GET /api/export/:productId.csv`, including failed attempts with blank price/stock values.

---

## Database

The application uses Supabase PostgreSQL with three core tables (schema in `db/schema.sql`).

### `tracked_products`

```
Field                | Description
----------------------|--------------------------------
id                    | Primary key
name                  | Product name
url                   | Product page URL
store_product_id      | ID from the INE Store catalog
selected_option       | Chosen option/edition label
selected_option_id    | Chosen option/edition ID
active                | Whether it's still being tracked
created_at            | When tracking started
```

### `price_history`

```
Field            | Description
------------------|--------------------------------
product_id        | Linked tracked product
selected_option    | Option that was scraped
price              | Observed price
in_stock           | Observed stock status
observed_at        | Timestamp of observation
```

### `scrape_logs`

```
Field            | Description
------------------|--------------------------------
product_id        | Linked tracked product
selected_option    | Option that was scraped
attempt_number     | Retry attempt count
strategy           | HTTP or Playwright
status             | Result of this attempt
outcome            | success / retried / failed
error_message      | Populated on failure
started_at         | Attempt start time
finished_at        | Attempt end time
```

---

## API Endpoints

```
Method | Endpoint                       | Purpose
-------|---------------------------------|--------------------------------
GET    | /health                         | Health check
GET    | /api/products/search?q=...      | Search the INE Store catalog
GET    | /api/products/tracked           | List tracked products
POST   | /api/products/tracked           | Track a product option
GET    | /api/history/:productId         | Get price/stock history
GET    | /api/logs/:productId            | Get scrape logs
GET    | /api/export/:productId.csv      | Export product history as CSV
POST   | /api/scrape/run                 | Run the scheduled scrape job (protected)
```

**Track a product**

```
POST /api/products/tracked
```

```json
{
  "productId": "2024",
  "selectedOption": "Standard",
  "selectedOptionId": "standard"
}
```

**Run the scraper**

```
POST /api/scrape/run
x-cron-secret: YOUR_CRON_SECRET
```

---

## Project Structure

```
pricetracker/
├── backend/
│   ├── src/
│   │   ├── config/              # Environment and Supabase configuration
│   │   ├── controllers/         # Request handlers
│   │   ├── db/
│   │   │   ├── migrations/
│   │   │   ├── models/
│   │   │   └── repositories/
│   │   ├── middleware/          # Auth, logging, error handling
│   │   ├── routes/               # Express API routes
│   │   ├── scraper/              # HTTP + Playwright scraping logic
│   │   ├── services/             # Product search, scrape runner, CSV export
│   │   └── utils/
│   ├── scripts/                  # Seed and DB verification scripts
│   ├── Dockerfile
│   ├── .dockerignore
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   └── styles/
│   ├── public/
│   ├── vercel.json
│   └── package.json
├── db/
│   └── schema.sql
├── docs/
│   ├── architecture.md
│   ├── cron-setup.md
│   └── deployment.md
├── scripts/
│   ├── findProduct.js
│   ├── runHeadedScrape.js
│   ├── seedTrackedProducts.js
│   └── triggerScrapeLocally.js
├── .github/workflows/
│   ├── ci.yml
│   └── deploy.yml
├── Jenkinsfile
└── README.md
```

---

## Environment Variables

Create `backend/.env` and `frontend/.env` (never commit actual values). Use `.env.example` files as templates.

**Backend**

```
PORT=3000
STORE_BASE_URL=https://demo.inelabteamdev.com
BROWSER_EXECUTABLE_PATH=

SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

DATABASE_URL=
CRON_SECRET=your_random_secret
```

**Frontend**

```
VITE_API_BASE_URL=http://localhost:3000/api
```

```
Variable                    | Purpose
-----------------------------|-------------------------------------------
SUPABASE_URL                | Base URL of the Supabase project
SUPABASE_SERVICE_ROLE_KEY   | Service role key for server-side Supabase access
PORT                        | Port the Express backend listens on
CRON_SECRET                 | Secret required in x-cron-secret header
STORE_BASE_URL              | Base URL of the INE mock store
```

---

## Local Setup

**Prerequisites:** Node.js 20+, npm, Git, a Supabase project, Chromium support for Playwright.

```bash
git clone https://github.com/ubaids12/pricetracker.git
cd pricetracker

# Backend
cd backend
npm install
cd ..

# Frontend
cd frontend
npm install
cd ..
```

Apply the schema (`db/schema.sql`) in the Supabase SQL Editor, then:

```bash
npm run db:verify --prefix backend
npm run db:seed --prefix backend

# Start backend
cd backend && npm run dev
# -> http://localhost:3000  (health: /health)

# Start frontend (new terminal)
cd frontend && npm run dev
```

---

## Docker

```bash
# Build
docker build -t price-tracker-backend ./backend

# Run
docker run -d \
  --name price-tracker \
  --env-file ./backend/.env \
  -p 3000:3000 \
  --restart unless-stopped \
  price-tracker-backend:latest
```

---

## Security

```
- Database secret credentials are kept outside the public source code.
- Cron endpoint is protected with a secret header (x-cron-secret).
- SUPABASE_SERVICE_ROLE_KEY and CRON_SECRET stay server-side only,
  never in vercel.json or frontend code.
- Jenkins passes secrets to Docker via --env-file rather than committing them.
- Any credential accidentally committed to Git should be rotated immediately.
```

---

## AI Tool Usage

AI tools were used during development for assistance with:

```
- Debugging
- Understanding Playwright behavior
- Improving retry/error-handling logic
- Deployment troubleshooting
- README/documentation preparation
```

All final code was reviewed, tested, and adapted during implementation. The scraping logic was tested against the provided INE mock store, including delayed responses and retry scenarios.

---

## Bonus Features Implemented

### Bonus 1 — Dual Scraping Strategy (HTTP + Playwright)

Rather than always launching a browser, the scraper tries a fast HTTP + Cheerio pass first and only falls back to Playwright/Chromium when the lightweight path can't get a complete result — balancing speed and reliability.

### Bonus 2 — CI/CD with GitHub Actions + Jenkins

```
GitHub Actions (CI)              Jenkins (CD)
--------------------              --------------------
Install                           Docker Build
   |                                 |
   v                                 v
Test                              Deploy to AWS EC2
   |                                 |
   v                                 v
Build  ------------------------>  Health Check
```

### Bonus 3 — Multiple Tracked Products

```
Product Option   | History | Logs
------------------|---------|------
Option 1          |   Yes   |  Yes
Option 2          |   Yes   |  Yes
Option 3          |   Yes   |  Yes
```

Scheduled scraping processes every active tracked product, not just one.

---

## Troubleshooting

```
Frontend shows "Failed to fetch"
  -> Check VITE_API_BASE_URL=/api in Vercel
  -> Check frontend/vercel.json points to the current EC2 IP
  -> Check EC2 Security Group allows port 3000

Vercel returns 502 Bad Gateway
  -> Confirm backend is listening on 0.0.0.0:3000
  -> Confirm it is reachable directly at the rewrite target

Cron returns 401 Unauthorized
  -> x-cron-secret header missing or doesn't match backend CRON_SECRET

Scraper can't get a price
  -> Check: docker logs price-tracker
  -> Shows which strategy was used, attempt count, and failure reason

Product tracked but no history yet
  -> A scrape hasn't run yet
  -> Tracking only creates the record; a successful scrape must run
     before an observation appears in price_history
```

---

## Future Improvements

```
- Price-drop notifications (email/push)
- User authentication
- Multiple storefronts
- More advanced change detection
- Scraping concurrency controls
- Better observability and deployment metrics
```

---

## Author

**Ubaid Ashraf**
GitHub: https://github.com/ubaids12

## License

No license has been specified for this repository yet.