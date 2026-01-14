# Development Guide

## Setting Up Your Development Environment

### 1. Prerequisites
- Node.js (v14+) - [Download here](https://nodejs.org/)
- Git
- Code editor (VS Code recommended)
- SQLite viewer (optional but helpful)

### 2. Initial Setup

```bash
# Clone or navigate to project
cd CAI-search

# Install all dependencies
npm install
cd client && npm install && cd ..

# Create data directory
mkdir -p data

# Initialize database
npm run db:migrate

# Load sample data
npm run scrape
```

See [QUICKSTART.md](./QUICKSTART.md) for a faster 5-minute setup.

### 3. Start Development

```bash
# Terminal 1: Start both servers
npm run dev

# Or in separate terminals:
# Terminal 1:
npm run server

# Terminal 2:
cd client && npm start
```

---

## PDF Text Extraction

This application uses **pdf-parse v2.3.10** for extracting text from CAI decision PDFs.

### Key Features
- ✅ **Pure Node.js** - No external binaries required (works anywhere)
- ✅ **Cross-Platform** - Works on macOS, Linux, Windows
- ✅ **Reliable** - Handles errors gracefully
- ✅ **Efficient** - Downloads and deletes PDFs immediately (zero disk footprint)
- ✅ **Scalable** - Can process 100s of PDFs without memory issues

### Implementation Details

Located in `server/scraper.js` - `downloadAndExtractPdf()` function:

1. **Download**: Fetch PDF from CAI website via axios
2. **Temp Store**: Write to temporary file (`/tmp` directory)
3. **Extract**: Parse PDF and extract all text using PDFParse
4. **Store**: Save extracted text directly to database
5. **Cleanup**: Delete temporary PDF file

### Database Storage
- **Field**: `pdf_text` (TEXT column)
- **Content**: Full extracted text from PDF
- **Average Size**: ~11,233 characters per decision
- **Coverage**: 397+ out of 402+ decisions

---

## Project Architecture

### Backend Architecture

```
Express Server (Port 5000)
    ├── Routes (API endpoints)
    │   └── /api/decisions
    │       ├── GET /search
    │       ├── GET /:id
    │       ├── GET /filters/options
    │       └── GET /stats/summary
    │
    ├── Database (SQLite)
    │   ├── decisions
    │   ├── decision_search
    │   └── scraping_history
    │
    └── Utilities
        ├── Scraper (parse HTML)
        ├── Scheduler (cron jobs)
        └── Database connection
```

### Frontend Architecture

```
React App (Port 3000)
    ├── App.js (main component, state management)
    │
    ├── Components
    │   ├── SearchBar (search input)
    │   ├── FilterPanel (filters sidebar)
    │   ├── DecisionsList (results display)
    │   └── Statistics (info dashboard)
    │
    └── API Integration
        └── Fetch calls to backend
```

---

## Adding New Features

### Adding a New API Endpoint

1. **Create the endpoint** in `server/routes/decisions.js`:

```javascript
// Example: Get decisions by decision number
router.get('/by-number/:number', (req, res) => {
  const { number } = req.params;
  
  db.get(
    'SELECT * FROM decisions WHERE decision_number = ?',
    [number],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: 'Not found' });
      res.json(row);
    }
  );
});
```

2. **Call from frontend** in React component:

```javascript
const fetchByNumber = async (number) => {
  const response = await fetch(`http://localhost:5000/api/decisions/by-number/${number}`);
  const data = await response.json();
  setDecision(data);
};
```

### Adding a New React Component

1. **Create component file** `client/src/components/MyComponent.js`:

```javascript
import React, { useState } from 'react';
import '../styles/MyComponent.css';

function MyComponent({ data }) {
  return (
    <div className="my-component">
      {/* Your JSX here */}
    </div>
  );
}

export default MyComponent;
```

2. **Create styles** `client/src/styles/MyComponent.css`:

```css
.my-component {
  /* Your styles here */
}
```

3. **Use in App.js**:

```javascript
import MyComponent from './components/MyComponent';

// In render:
<MyComponent data={someData} />
```

### Adding a Database Table

1. **Update migration** in `server/db/migrate.js`:

```javascript
db.run(`
  CREATE TABLE IF NOT EXISTS my_table (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    value TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`, (err) => {
  if (err) reject(err);
});
```

2. **Run migration**:

```bash
npm run db:migrate
```

---

## Common Development Tasks

### Debugging

#### Backend Debugging
```bash
# Run with verbose logging
NODE_DEBUG=* npm run server

# Or use node inspector
node --inspect server/index.js
# Then open chrome://inspect in Chrome
```

#### Frontend Debugging
- Open DevTools in browser (F12)
- Use React DevTools browser extension
- Check Network tab for API calls
- Check Console for errors

### Database Inspection

```bash
# Open SQLite CLI
sqlite3 data/cai_decisions.db

# Common commands:
.tables                  # List tables
.schema decisions        # Show table structure
SELECT COUNT(*) FROM decisions;  # Count rows
SELECT * FROM decisions LIMIT 5; # View sample data
.quit                   # Exit
```

### Modifying the Scraper

Edit `server/scraper.js` to change how data is extracted:

```javascript
// Find decision number
const decisionNumber = $cells.eq(0).text().trim();

// Find organization
let organization = '';
const orgMatch = subject.match(/à l'endroit (?:de |du |d')?(.+?)(?:\.|$)/);
if (orgMatch) {
  organization = orgMatch[1].trim();
}

// Adjust extraction logic as needed
```

### Adding Search Filters

1. **Backend** - Update API query in `server/routes/decisions.js`:

```javascript
if (newFilter) {
  query += ' AND some_field = ?';
  params.push(newFilter);
}
```

2. **Frontend** - Add filter UI in `FilterPanel.js`:

```javascript
<div className="filter-group">
  <label>New Filter</label>
  <input 
    type="text" 
    onChange={(e) => onFilterChange({ newFilter: e.target.value })}
  />
</div>
```

---

## Testing

### Manual Testing Checklist

- [ ] Search functionality works
- [ ] Filters update results
- [ ] Pagination works correctly
- [ ] PDF download links are valid
- [ ] Statistics display correctly
- [ ] Responsive design on mobile
- [ ] No console errors
- [ ] API returns correct data

### Testing Database Queries

```bash
# Open SQLite
sqlite3 data/cai_decisions.db

# Test search
SELECT * FROM decisions 
WHERE decision_number LIKE '%1007%' 
LIMIT 5;

# Test filter
SELECT * FROM decisions 
WHERE year = 2015 
ORDER BY decision_date DESC;

# Test pagination
SELECT * FROM decisions 
ORDER BY decision_date DESC 
LIMIT 20 OFFSET 40;
```

---

## Performance Optimization

### Database Optimization

```bash
# Analyze queries
sqlite3 data/cai_decisions.db ".analyze"

# Vacuum database (cleanup fragmentation)
sqlite3 data/cai_decisions.db "VACUUM"

# Check index usage
EXPLAIN QUERY PLAN SELECT * FROM decisions WHERE year = 2015;
```

### Frontend Optimization

1. **Code splitting** - Load components lazily
2. **Memoization** - Use React.memo for expensive components
3. **Caching** - Cache API responses
4. **Lazy loading** - Load images on demand

Example:
```javascript
import React, { lazy, Suspense } from 'react';

const DecisionsList = lazy(() => import('./components/DecisionsList'));

// In render:
<Suspense fallback={<div>Loading...</div>}>
  <DecisionsList decisions={decisions} />
</Suspense>
```

### Backend Optimization

1. **Connection pooling** - Reuse DB connections
2. **Query optimization** - Use proper indexes
3. **Response caching** - Cache common queries
4. **Compression** - Enable gzip

---

## Code Style & Best Practices

### Backend JavaScript (Node.js)

```javascript
// ✅ Good: Clear variable names, proper error handling
const fetchDecisions = async (filters) => {
  try {
    const decisions = await queryDatabase(filters);
    return decisions;
  } catch (error) {
    console.error('Error fetching decisions:', error);
    throw error;
  }
};

// ❌ Avoid: Unclear names, no error handling
const get = (q) => {
  return db(q);
};
```

### Frontend React

```javascript
// ✅ Good: Descriptive names, proper prop types
function DecisionCard({ decision, onDownload }) {
  return (
    <div className="decision-card">
      <h3>{decision.decision_number}</h3>
      <button onClick={() => onDownload(decision)}>Download</button>
    </div>
  );
}

// ❌ Avoid: Non-descriptive, magic values
function DC({ d, od }) {
  return <div><h3>{d.num}</h3><button onClick={() => od(d)}>DL</button></div>;
}
```

### CSS

```css
/* ✅ Good: Semantic class names, organized structure */
.decision-card {
  border: 1px solid #e0e0e0;
  padding: 1rem;
}

.decision-card__title {
  font-size: 1.5rem;
  color: #2c3e50;
}

/* ❌ Avoid: Non-semantic names, unclear structure */
.d {
  border: 1px solid #e0e0e0;
  padding: 1rem;
}

.t {
  font-size: 1.5rem;
  color: #2c3e50;
}
```

---

## Debugging Tips

### Backend Issues

1. **Check server logs**:
   ```bash
   # Look for errors in terminal
   npm run server
   ```

2. **Test API endpoints**:
   ```bash
   # Use curl or Postman
   curl "http://localhost:5000/api/health"
   ```

3. **Check database connection**:
   ```javascript
   // Add to server/index.js
   db.all("SELECT COUNT(*) as count FROM decisions", (err, rows) => {
     if (err) console.error('DB Error:', err);
     else console.log('DB Connected, total decisions:', rows[0].count);
   });
   ```

### Frontend Issues

1. **React DevTools** - Inspect component state and props
2. **Network tab** - Check API calls and responses
3. **Console tab** - Look for JavaScript errors
4. **Sources tab** - Set breakpoints and debug

### Database Issues

1. **Check database exists**:
   ```bash
   ls -la data/cai_decisions.db
   ```

2. **Verify schema**:
   ```bash
   sqlite3 data/cai_decisions.db ".schema decisions"
   ```

3. **Check for corruption**:
   ```bash
   sqlite3 data/cai_decisions.db "PRAGMA integrity_check;"
   ```

---

## Git Workflow

### Basic Workflow

```bash
# Create feature branch
git checkout -b feature/add-export-csv

# Make changes
# ... edit files ...

# Stage changes
git add .

# Commit
git commit -m "Add CSV export feature"

# Push to GitHub
git push origin feature/add-export-csv

# Create Pull Request on GitHub
```

### Useful Git Commands

```bash
# See what changed
git status

# View differences
git diff

# Undo recent changes
git checkout -- filename

# View commit history
git log --oneline

# Reset to previous commit
git reset --hard HEAD~1
```

---

## Environment Variables

### Development (.env)

```
PORT=5000
NODE_ENV=development
DATABASE_PATH=./data/cai_decisions.db
DEBUG=true
```

### Production (.env.production)

```
PORT=5000
NODE_ENV=production
DATABASE_PATH=/var/lib/cai/data.db
DEBUG=false
```

---

## Next Steps

1. **Read the code** - Familiarize yourself with the structure
2. **Modify colors** - Change CSS variables in `App.css`
3. **Add filters** - Extend filter capabilities
4. **Optimize database** - Add more indexes if needed
5. **Deploy** - Follow DEPLOYMENT.md
6. **Monitor** - Keep an eye on logs and performance

Happy coding! 🚀
