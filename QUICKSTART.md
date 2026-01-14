# Quick Start Guide

## ✅ Prerequisites

Before you start, ensure you have:
- [ ] Node.js v14+ installed (`node --version`)
- [ ] npm v6+ installed (`npm --version`)
- [ ] Git installed (`git --version`)
- [ ] At least 200MB free disk space
- [ ] Code editor ready (VS Code recommended)

## Getting Started in 5 Minutes

### 1. Install Dependencies
```bash
cd CAI-search

# Install backend dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

### 2. Initialize Database & Load Data
```bash
npm run db:migrate
npm run scrape
```

### 3. Start Development Server
```bash
npm run dev
```

The application will open at `http://localhost:3000`

---

## ✅ Verify Installation

```bash
# Check Node modules exist
ls node_modules | head -5  # Should show some modules

# Check client modules
ls client/node_modules | head -5  # Should show React

# Check database was created
ls -la server/data/cai_decisions.db  # Should be ~10MB+

# Check data was loaded
curl http://localhost:5000/api/health  # Should return {"status":"ok"}
```

---

## Using the Application

### Search
1. Enter a search term (decision number, organization name, or keywords)
2. Click **Search** button
3. Results will appear below

### Filter Results
Use the left sidebar to:
- **Filter by Year**: Select from dropdown
- **Filter by Organization**: Choose from list
- **Filter by Date Range**: Select start and end dates
- **Clear Filters**: Reset all filters to search again

### Download Decisions
1. Find the decision you want
2. Click the **Download PDF** button
3. The PDF will open in a new tab

---

## Commands Reference

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start both frontend and backend in development mode |
| `npm run server` | Start only the backend API server |
| `npm run client` | Start only the React development server |
| `npm run scrape` | Manually scrape CAI website and update database |
| `npm run scrape-schedule` | Start automatic daily scraping at 2 AM |
| `npm run db:migrate` | Initialize database schema |
| `npm run build-client` | Build React app for production |

---

## Project Structure Explained

```
CAI-search/
├── server/                    # Backend (Node.js/Express)
│   ├── db/
│   │   ├── connection.js     # Database connection
│   │   └── migrate.js        # Schema initialization
│   ├── routes/
│   │   └── decisions.js      # API endpoints
│   ├── scraper.js            # HTML parser & data loader
│   ├── scheduler.js          # Periodic scraping
│   └── index.js              # Express app setup
│
├── client/                    # Frontend (React)
│   ├── public/
│   │   └── index.html        # HTML template
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── styles/          # CSS files
│   │   ├── App.js           # Main component
│   │   └── index.js         # React entry point
│   └── package.json
│
├── source.html              # Original CAI website HTML
├── package.json             # Backend dependencies
├── .env                     # Configuration (port, etc.)
└── README.md               # Full documentation
```

---

## API Examples

### Search for a Decision
```bash
curl "http://localhost:5000/api/decisions/search?q=hospital&year=2015"
```

### Get Filter Options
```bash
curl "http://localhost:5000/api/decisions/filters/options"
```

### Get Statistics
```bash
curl "http://localhost:5000/api/decisions/stats/summary"
```

---

## Troubleshooting

### "Cannot find module" errors
```bash
# Delete and reinstall node_modules
rm -rf node_modules
rm package-lock.json
npm install
```

### Port 5000 already in use
```bash
# Use a different port
PORT=3001 npm run server
```

### Database errors
```bash
# Reset database
rm data/cai_decisions.db
npm run db:migrate
npm run scrape
```

### React app won't start
```bash
cd client
rm -rf node_modules package-lock.json
npm install
npm start
```

---

## Key Features

✅ **Search 1000s of CAI Decisions**
- Full-text search across decision numbers and subjects
- Case-insensitive matching

✅ **Advanced Filtering**
- Filter by year, organization, date range
- Combine multiple filters

✅ **Download PDFs**
- Direct links to official CAI PDFs
- View file sizes before download

✅ **Statistics Dashboard**
- Total decisions in database
- Date range coverage

✅ **Responsive Design**
- Works on desktop, tablet, and mobile
- Touch-friendly interface

---

## Next Steps

1. **Explore Decisions**: Try searching for organizations or years
2. **Adjust Filters**: Narrow down results using the sidebar
3. **Download PDFs**: Access official CAI decision documents
4. **Schedule Updates**: Set up automatic scraping with `npm run scrape-schedule`

---

## Questions?

Check the full [README.md](./README.md) for detailed documentation, API endpoints, and advanced configuration.
