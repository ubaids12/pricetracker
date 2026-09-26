import { runScrapeForTrackedProducts } from "../services/scrapeRunner.service.js";

let scrapeRunning = false;

export function runScrape(_request, response) {
  // Prevent overlapping scrape jobs
  if (scrapeRunning) {
    return response.status(409).json({
      status: "already_running",
      message: "A scrape job is already running"
    });
  }

  scrapeRunning = true;

  // Respond immediately to cron-job.org
  response.status(202).json({
    status: "started",
    message: "Scrape job started"
  });

  // Run scraping in the background
  runScrapeForTrackedProducts()
    .then((result) => {
      console.log("Scheduled scrape completed:", result);
    })
    .catch((error) => {
      console.error("Scheduled scrape failed:", error);
    })
    .finally(() => {
      scrapeRunning = false;
    });
}