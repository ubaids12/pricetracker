


Price Tracker
A full-stack price monitoring application built to track product prices and stock availability over time.

The project combines a React + Vite frontend with a Node.js + Express backend, Supabase for persistent storage, and Playwright for browser-based scraping when a simple HTTP request is not enough. The backend runs in Docker on AWS EC2, the frontend is deployed on Vercel, and scheduled scraping is triggered through cron-job.org.

Live App: https://pricetracker-fztnbuk82-ubaid-f409.vercel.app/

Repository: https://github.com/ubaids12/pricetracker

What the project does
Price Tracker is designed around a simple workflow:

Search the INE Store catalog.

Choose the exact product option or edition you want to monitor.

Add that option to your tracked products.

Periodically scrape the current price and stock status.

Store every observation in Supabase.

View price history and scraping logs from the dashboard.

Export product history as CSV when needed.

The important part is that the application tracks a specific product option, not just a product name. This matters when the same product has multiple editions, kits, or variants with different prices.

Features
Product search against the INE Store catalog

Option/edition selection before tracking

Track multiple products and variants

Automatic price and stock checks

Price history stored with timestamps

Scrape attempt and error logs

HTTP scraper with Playwright browser fallback

Retry logic with bounded backoff

CSV export for tracked product history

Supabase-backed persistence

Dockerized backend

Jenkins-based backend deployment to AWS EC2

Vercel deployment for the frontend

Scheduled scraping through cron-job.org

Cron endpoint protected by a secret header

Tech Stack
Layer	Technology
Frontend	React, Vite, JavaScript
Backend	Node.js, Express
Scraping	Fetch/HTTP, Cheerio, Playwright, Chromium
Database	Supabase / PostgreSQL
Containerization	Docker
Backend Hosting	AWS EC2
Frontend Hosting	Vercel
Scheduling	cron-job.org
CI	GitHub Actions
CD	Jenkins
Version Control	Git + GitHub
Architecture
                    ┌─────────────────────────┐
                    │        User / Browser    │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │     Vercel Frontend     │
                    │     React + Vite        │
                    └────────────┬────────────┘
                                 │ /api/*
                                 │
                         Vercel Rewrite / Proxy
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │      AWS EC2            │
                    │   Docker Container      │
                    │   Node + Express API    │
                    └────────────┬────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
              ▼                  ▼                  ▼
       ┌─────────────┐   ┌────────────────┐  ┌──────────────┐
       │ INE Store   │   │    Supabase    │  │ cron-job.org │
       │ Catalog     │   │ PostgreSQL DB  │  │ Scheduler    │
       └──────┬──────┘   └────────────────┘  └──────┬───────┘
              │                                     │
              │ scrape                              │ POST /api/scrape/run
              ▼                                     │ + x-cron-secret
       ┌───────────────────┐                        │
       │ HTTP Scraper      │◄───────────────────────┘
       │       ↓           │
       │ Playwright Fallback│
       └───────────────────┘
How a normal user request works
Search product
     ↓
GET /api/products/search
     ↓
Backend queries INE Store catalog
     ↓
Frontend shows matching products + options
     ↓
User selects an option
     ↓
POST /api/products/tracked
     ↓
Supabase stores tracked product
     ↓
Dashboard shows tracked product
How scheduled scraping works
cron-job.org
     ↓
POST /api/scrape/run
Header: x-cron-secret
     ↓
Express authentication middleware
     ↓
Load active tracked products from Supabase
     ↓
HTTP scrape
     ↓
If HTTP fails → Playwright browser scrape
     ↓
Retry when necessary
     ↓
Validate price + stock
     ↓
Store observation in price_history
     ↓
Store attempt details in scrape_logs
Project Structure
pricetracker/
│
├── backend/
│   ├── src/
│   │   ├── config/              # Environment and Supabase configuration
│   │   ├── controllers/         # Request handlers
│   │   ├── db/
│   │   │   ├── migrations/      # Database migrations
│   │   │   ├── models/          # Database models
│   │   │   └── repositories/    # Data access layer
│   │   ├── middleware/           # Auth, logging, error handling
│   │   ├── routes/               # Express API routes
│   │   ├── scraper/              # HTTP + Playwright scraping logic
│   │   ├── services/             # Product search, scrape runner, CSV export
│   │   └── utils/                # Shared utilities
│   ├── scripts/                  # Seed and database verification scripts
│   ├── Dockerfile
│   ├── .dockerignore
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/                  # API client
│   │   ├── components/           # Reusable UI components
│   │   ├── pages/                # Search, dashboard, detail views
│   │   └── styles/               # Application styling
│   ├── public/
│   ├── vercel.json               # Vercel routing/build configuration
│   └── package.json
│
├── db/
│   └── schema.sql                # Supabase schema
│
├── docs/
│   ├── architecture.md
│   ├── cron-setup.md
│   └── deployment.md
│
├── scripts/
│   ├── findProduct.js
│   ├── runHeadedScrape.js
│   ├── seedTrackedProducts.js
│   └── triggerScrapeLocally.js
│
├── .github/workflows/
│   ├── ci.yml
│   └── deploy.yml
│
├── Jenkinsfile
└── README.md
API Endpoints
Method	Endpoint	Purpose
GET	/health	Health check
GET	/api/products/search?q=...	Search the INE Store catalog
GET	/api/products/tracked	List tracked products
POST	/api/products/tracked	Track a product option
GET	/api/history/:productId	Get price/stock history
GET	/api/logs/:productId	Get scrape logs
GET	/api/export/:productId.csv	Export product history as CSV
POST	/api/scrape/run	Run the scheduled scrape job
Track a product
POST /api/products/tracked

Example request body:

{
  "productId": "2024",
  "selectedOption": "Standard",
  "selectedOptionId": "standard"
}
The exact option values come from the product returned by the search endpoint.

Run the scraper
POST /api/scrape/run

This endpoint is protected by the x-cron-secret header.

POST /api/scrape/run
x-cron-secret: YOUR_CRON_SECRET
Database
The application uses Supabase PostgreSQL with three core tables:

tracked_products
Stores the products and specific options being monitored.

Important fields include:

id

name

url

store_product_id

selected_option

selected_option_id

active

created_at

price_history
Stores each successful price and stock observation.

Important fields include:

product_id

selected_option

price

in_stock

observed_at

scrape_logs
Stores scraper attempts and outcomes.

Important fields include:

product_id

selected_option

attempt_number

strategy

status

outcome

error_message

started_at

finished_at

Apply the schema from:

db/schema.sql
Local Development
Prerequisites
Install:

Node.js 20+

npm

Git

A Supabase project

Chromium support for Playwright when browser scraping is used

1. Clone the repository
git clone https://github.com/ubaids12/pricetracker.git
cd pricetracker
2. Install backend dependencies
cd backend
npm install
cd ..
3. Install frontend dependencies
cd frontend
npm install
cd ..
4. Configure environment variables
Create:

backend/.env
frontend/.env
Use the example files as templates:

backend/.env.example
frontend/.env.example
Backend example
PORT=3000
STORE_BASE_URL=https://demo.inelabteamdev.com
BROWSER_EXECUTABLE_PATH=

SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

DATABASE_URL=
CRON_SECRET=your_random_secret
Frontend example
For local development:

VITE_API_BASE_URL=http://localhost:3000/api
5. Apply the database schema
Open the Supabase SQL Editor and run:

db/schema.sql
6. Verify the database connection
From the repository root:

npm run db:verify --prefix backend
A successful verification checks that the required tables are available and that insert/delete operations work correctly.

7. Seed demo products
npm run db:seed --prefix backend
8. Start the backend
cd backend
npm run dev
The backend runs on:

http://localhost:3000
Health check:

http://localhost:3000/health
9. Start the frontend
Open another terminal:

cd frontend
npm run dev
Vite will show the local frontend URL in the terminal.

Scraper Design
The scraper uses two strategies.

1. HTTP scraping
The first attempt uses a normal HTTP request and Cheerio to parse the returned HTML. This path is lighter and faster because it does not need to launch a browser.

2. Playwright fallback
When the HTTP strategy cannot obtain a complete result, the scraper falls back to Playwright with Chromium.

The browser flow can:

Open the product page

Handle consent dialogs

Select the requested product option

Interact with the price/quote section

Wait for the price to become available

Parse the final page HTML

Retry behavior
Scrape attempts are bounded and use increasing delays between retries. The system records each attempt so failures are visible instead of silently disappearing.

This gives the application a practical balance:

HTTP = faster + cheaper
Browser = slower + more capable for dynamic pages
Docker
The backend is containerized so the runtime is the same on the deployment server as it is during local testing.

Build the image
From the repository root:

docker build -t price-tracker-backend ./backend
Run the container
docker run -d \
  --name price-tracker \
  --env-file ./backend/.env \
  -p 3000:3000 \
  --restart unless-stopped \
  price-tracker-backend:latest
Check the container:

docker ps
Check logs:

docker logs price-tracker
The container exposes port 3000.

Production Deployment
Frontend — Vercel
The React/Vite frontend is deployed to Vercel.

Vercel project settings:

Root Directory: frontend
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Production environment variable:

VITE_API_BASE_URL=/api
The frontend uses a same-origin /api path, and frontend/vercel.json forwards those requests to the AWS backend.

Example:

{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "http://YOUR_ELASTIC_IP:3000/api/:path*"
    }
  ]
}
Using a Vercel rewrite keeps the browser request on the Vercel HTTPS origin while the rewrite forwards API traffic to the backend.

Backend — AWS EC2
The production backend runs inside Docker on an EC2 Ubuntu instance.

Current deployment port:

3000
Current Elastic IP used by the deployment:

16.192.197.234
Backend health endpoint:

http://16.192.197.234:3000/health
The backend container is configured with --restart unless-stopped so it automatically restarts after a reboot unless explicitly stopped.

Jenkins CI/CD
The repository includes a Jenkinsfile that deploys the backend to EC2.

The pipeline performs the following steps:

Checkout source
      ↓
Docker build
      ↓
Stop old container
      ↓
Start new container
      ↓
Verify container is running
The Jenkins deployment uses the server-side environment file:

/home/ubuntu/pricetracker/backend/.env
Secrets stay on the server and are passed to Docker with --env-file instead of being committed to GitHub.

Scheduled Scraping with cron-job.org
The scraper is triggered externally on a schedule instead of keeping an internal scheduler process alive inside the backend.

cron request
Method:

POST
URL:

http://16.192.197.234:3000/api/scrape/run
Header:

x-cron-secret: YOUR_CRON_SECRET
A two-hour schedule can be expressed as:

0 */2 * * *
The secret must match the backend CRON_SECRET value.

Do not place the secret in the URL.

CI
GitHub Actions is used for continuous integration.

The workflow in .github/workflows/ci.yml checks both the frontend and backend and runs the available install, test, and build commands.

Typical flow:

git push
   ↓
GitHub Actions
   ↓
Install dependencies
   ↓
Run tests
   ↓
Run production builds
Jenkins handles the deployment side for the backend.

Useful Commands
Backend
npm run dev
npm start
npm test
npm run db:verify
npm run db:seed
Frontend
npm run dev
npm run build
npm run preview
Docker
docker ps
docker logs price-tracker
docker restart price-tracker
docker rm -f price-tracker
Test the backend from a machine that can reach EC2
curl -i http://16.192.197.234:3000/health
Expected response:

{
  "status": "ok"
}
Trigger a scrape manually
curl -i -X POST http://16.192.197.234:3000/api/scrape/run \
  -H "x-cron-secret: YOUR_CRON_SECRET"
Troubleshooting
Frontend shows Failed to fetch
Check:

VITE_API_BASE_URL is /api in Vercel Production.

frontend/vercel.json points to the current backend Elastic IP.

The EC2 Security Group allows TCP port 3000.

The Docker container is running:

docker ps --filter name=price-tracker
The backend is reachable:

curl -i http://16.192.197.234:3000/health
Vercel returns 502 Bad Gateway
Usually check the external rewrite target first:

http://YOUR_ELASTIC_IP:3000/api/...
Then confirm the backend is listening on 0.0.0.0:3000 and that port 3000 is open in the EC2 Security Group.

Cron returns 401 Unauthorized
The x-cron-secret header is missing or does not match the backend CRON_SECRET.

Scraper cannot get a price
Check Docker logs:

docker logs price-tracker
The logs record which strategy was used, how many attempts were made, and whether the HTTP or browser scraper failed.

Product is tracked but has no history yet
Tracking a product only creates the tracked-product record. A successful scrape must run before an observation appears in price_history.

Security Notes
Never commit backend/.env or any real Supabase service-role key.

Keep SUPABASE_SERVICE_ROLE_KEY server-side only.

Keep CRON_SECRET private.

Do not put secrets in vercel.json, frontend source code, or the cron URL.

If a real credential is ever committed to Git, rotate it immediately.

Why this project was built this way
The project intentionally separates responsibilities:

React/Vite handles the user interface.

Express exposes a small API and coordinates application logic.

Supabase stores tracked products, observations, and logs.

HTTP scraping handles the inexpensive path first.

Playwright handles dynamic browser interactions when required.

Docker makes the backend deployment reproducible.

AWS EC2 provides a persistent host for the browser-based scraper.

Vercel serves the frontend.

cron-job.org triggers scheduled scraping.

Jenkins automates backend deployment.

This keeps the frontend, API, scraper, database, scheduler, and deployment pipeline independent enough to debug and operate separately.

Future Improvements
Potential extensions include:

Price-drop notifications

Email or push alerts

User authentication

Multiple storefronts

More advanced change detection

Scraping concurrency controls

Better observability and deployment metrics

These are not required for the current core workflow.

Author
Ubaid Ashraf

GitHub: https://github.com/ubaids12

License
No license has been specified for this repository yet.

