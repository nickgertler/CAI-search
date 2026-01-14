const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const decisionsRouter = require('./routes/decisions');
const initDatabase = require('./db/migrate');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize database
initDatabase().catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

// Routes
app.use('/api/decisions', decisionsRouter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'CAI Decisions API',
    version: '1.0.0',
    endpoints: {
      search: '/api/decisions/search?q=query&year=2024&organization=&startDate=&endDate=&page=1&limit=20',
      decision: '/api/decisions/:id',
      filters: '/api/decisions/filters/options',
      stats: '/api/decisions/stats/summary',
      health: '/api/health'
    },
    docs: 'See README.md for full API documentation'
  });
});

// API endpoint listing
app.get('/api', (req, res) => {
  res.json({
    message: 'CAI Decisions API',
    version: '1.0.0',
    baseUrl: 'http://localhost:5000',
    endpoints: {
      'Search decisions': {
        method: 'GET',
        path: '/api/decisions/search',
        query: {
          q: 'Search term (optional)',
          year: 'Filter by year (optional)',
          organization: 'Filter by organization (optional)',
          startDate: 'Start date YYYY-MM-DD (optional)',
          endDate: 'End date YYYY-MM-DD (optional)',
          page: 'Page number (default: 1)',
          limit: 'Results per page (default: 20)'
        },
        example: '/api/decisions/search?q=hospital&year=2024&limit=10'
      },
      'Get single decision': {
        method: 'GET',
        path: '/api/decisions/:id',
        example: '/api/decisions/1'
      },
      'Get filter options': {
        method: 'GET',
        path: '/api/decisions/filters/options',
        description: 'Returns available years and organizations'
      },
      'Get statistics': {
        method: 'GET',
        path: '/api/decisions/stats/summary',
        description: 'Returns total count, latest and oldest dates'
      },
      'Health check': {
        method: 'GET',
        path: '/api/health'
      }
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start scheduler in production (scraper runs on schedule)
if (process.env.NODE_ENV === 'production' || process.env.RUN_SCHEDULER === 'true') {
  try {
    require('./scheduler');
  } catch (error) {
    console.warn('Scheduler initialization warning:', error.message);
  }
}

// Start server
app.listen(PORT, () => {
  console.log(`CAI Decisions API server running on http://localhost:${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api`);
});
