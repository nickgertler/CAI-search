const cron = require('node-cron');
const { extractDecisions, insertDecisions } = require('./scraper');
const { parseUnparsedPdfs } = require('./pdf-parser');
const fs = require('fs');

// Schedule scraping to run daily at 2 AM
const scrapeJob = cron.schedule('0 2 * * *', async () => {
  console.log('[' + new Date().toISOString() + '] Starting scheduled scrape...');
  try {
    const decisions = extractDecisions();
    const result = await insertDecisions(decisions);
    console.log('[' + new Date().toISOString() + '] Scheduled scrape completed:', result);
  } catch (error) {
    console.error('[' + new Date().toISOString() + '] Scheduled scrape failed:', error);
  }
});

// Schedule PDF parsing to run daily at 3 AM (after scraping completes)
const parseJob = cron.schedule('0 3 * * *', async () => {
  console.log('[' + new Date().toISOString() + '] Starting scheduled PDF parsing...');
  try {
    const result = await parseUnparsedPdfs();
    console.log('[' + new Date().toISOString() + '] Scheduled PDF parsing completed:', result);
  } catch (error) {
    console.error('[' + new Date().toISOString() + '] Scheduled PDF parsing failed:', error);
  }
});

console.log('Scheduler started. Decisions will be scraped daily at 2:00 AM');
console.log('PDF parsing scheduled daily at 3:00 AM');
console.log('Next scrape:', scrapeJob.nextDate().toString());
console.log('Next parse:', parseJob.nextDate().toString());

