# Getting Started Checklist

## ✅ Pre-Installation

- [ ] Node.js v14+ installed (`node --version`)
- [ ] npm v6+ installed (`npm --version`)
- [ ] Git installed (`git --version`)
- [ ] At least 200MB free disk space
- [ ] Code editor ready (VS Code recommended)

## ✅ Installation (5 minutes)

```bash
# 1. Navigate to project
cd CAI-search

# 2. Check if files exist
ls -la source.html  # Should exist
ls -la package.json # Should exist

# 3. Install backend dependencies
npm install

# 4. Install client dependencies
cd client
npm install
cd ..

# 5. Initialize database
npm run db:migrate

# 6. Load sample data from source.html (downloads PDFs)
npm run scrape
```

## ✅ Verify Installation

```bash
# Check Node modules exist
ls node_modules | head -5  # Should show some modules

# Check client modules
ls client/node_modules | head -5  # Should show React

# Check database was created
ls -la server/data/cai_decisions.db  # Should be ~10MB

# Check data was loaded
npm run server  # Should print "Connected to SQLite database"
```

## ✅ First Run

### Option A: Run Both (Recommended)

```bash
# Terminal 1: Start both servers at once
npm run dev

# Wait for both to start:
# Backend: "CAI Decisions API server running on http://localhost:5000"
# Frontend: "webpack compiled successfully"

# Browser should automatically open http://localhost:3000
```

### Option B: Run Separately

```bash
# Terminal 1: Start backend only
npm run server
# Should show: "CAI Decisions API server running on http://localhost:5000"

# Terminal 2: Start frontend only
npm run client
# Should show: "webpack compiled successfully"
# Auto-opens http://localhost:3000
```

## ✅ Functionality Checks

After starting `npm run dev`, verify:

1. **Frontend Loads**
   - [ ] Page displays at `http://localhost:3000`
   - [ ] Title shows "CAI Decisions Search"
   - [ ] Statistics display (Total Decisions, Latest, Oldest)

2. **Search Works**
   - [ ] Type a search term (e.g., "hospital")
   - [ ] Click Search or press Enter
   - [ ] Results appear below
   - [ ] Results update on typing

3. **Filters Work**
   - [ ] Year dropdown shows years
   - [ ] Organization dropdown shows organizations
   - [ ] Select year and results filter
   - [ ] Clear Filters button resets

4. **Results Display**
   - [ ] Decision cards show properly formatted
   - [ ] Decision number displays
   - [ ] Organization and date visible
   - [ ] Subject text is readable
   - [ ] File size shown

5. **Download Function**
   - [ ] Click "Download PDF" button
   - [ ] New tab opens CAI website
   - [ ] PDF link is valid (or shows 404 if no longer available)

6. **Pagination**
   - [ ] If >20 results, pagination appears
   - [ ] Previous/Next buttons work
   - [ ] Page indicator shows correct page

7. **Responsive Design**
   - [ ] Resize browser window
   - [ ] Layout adjusts on small screens
   - [ ] Mobile view is usable
   - [ ] No horizontal scroll on mobile

## ✅ API Verification

Open new terminal and test API:

```bash
# Test health endpoint
curl http://localhost:5000/api/health
# Should return: {"status":"ok","timestamp":"..."}

# Test search endpoint
curl "http://localhost:5000/api/decisions/search?q=hospital&limit=5"
# Should return JSON with decisions array

# Test filter options
curl http://localhost:5000/api/decisions/filters/options
# Should return years and organizations arrays

# Test statistics
curl http://localhost:5000/api/decisions/stats/summary
# Should return total, latest, oldest
```

## ✅ Database Verification

```bash
# Count total decisions
sqlite3 server/data/cai_decisions.db "SELECT COUNT(*) as total FROM decisions;"
# Should show: 4000+ (or however many are in source.html)

# Check sample decision
sqlite3 server/data/cai_decisions.db "SELECT decision_number, decision_date FROM decisions LIMIT 3;"
# Should show decision numbers and dates

# Check if PDFs were downloaded
sqlite3 server/data/cai_decisions.db "SELECT COUNT(*) as downloaded FROM decisions WHERE local_pdf_path IS NOT NULL;"
# Should show how many PDFs were successfully downloaded

# Check years available
sqlite3 server/data/cai_decisions.db "SELECT DISTINCT year FROM decisions ORDER BY year DESC LIMIT 5;"
# Should show years like 2025, 2024, 2023, etc.
```

## ✅ Project Structure Verification

```bash
# Check all required files exist
[ -f "package.json" ] && echo "✓ package.json"
[ -f ".env" ] && echo "✓ .env"
[ -f ".gitignore" ] && echo "✓ .gitignore"
[ -f "source.html" ] && echo "✓ source.html"
[ -f "README.md" ] && echo "✓ README.md"
[ -d "server" ] && echo "✓ server/ directory"
[ -d "client" ] && echo "✓ client/ directory"
[ -d "server/data" ] && echo "✓ server/data/ directory"
[ -d "server/pdfs" ] && echo "✓ server/pdfs/ directory (PDF storage)"

# Check server files
[ -f "server/index.js" ] && echo "✓ server/index.js"
[ -f "server/scraper.js" ] && echo "✓ server/scraper.js"
[ -f "server/scheduler.js" ] && echo "✓ server/scheduler.js"
[ -d "server/db" ] && echo "✓ server/db/ directory"
[ -d "server/routes" ] && echo "✓ server/routes/ directory"

# Check client files
[ -f "client/package.json" ] && echo "✓ client/package.json"
[ -f "client/public/index.html" ] && echo "✓ client/public/index.html"
[ -d "client/src" ] && echo "✓ client/src/ directory"
[ -d "client/src/components" ] && echo "✓ client/src/components/"
[ -d "client/src/styles" ] && echo "✓ client/src/styles/"
```

## ✅ Development Ready Checklist

- [ ] All dependencies installed (`npm ls` shows no errors)
- [ ] Database created with ~4000 decisions
- [ ] Backend server starts without errors
- [ ] Frontend loads at localhost:3000
- [ ] Search functionality works
- [ ] Filters work and update results
- [ ] PDF links work
- [ ] API endpoints respond correctly
- [ ] No console errors in browser
- [ ] No errors in terminal
- [ ] Responsive design works

## ✅ Ready for Development

Now you can:

- [ ] Modify colors in `client/src/App.css`
- [ ] Add new filters in `FilterPanel.js`
- [ ] Create new API endpoints in `server/routes/decisions.js`
- [ ] Add new components in `client/src/components/`
- [ ] Deploy to production

## ✅ Common Issues & Solutions

### Issue: "Cannot find module"
```bash
# Solution: Reinstall dependencies
rm -rf node_modules client/node_modules
npm install && cd client && npm install && cd ..
```

### Issue: "Port 5000 already in use"
```bash
# Solution: Use different port
PORT=3001 npm run server
```

### Issue: "Database locked"
```bash
# Solution: Kill Node processes and restart
killall node
npm run dev
```

### Issue: "No decisions found"
```bash
# Solution: Re-run scraper
npm run scrape
```

### Issue: "React not loading"
```bash
# Solution: Clear cache and reinstall
cd client
rm -rf node_modules package-lock.json
npm install
npm start
```

## ✅ Next Steps After Verification

1. **Explore the codebase**
   - Read `server/index.js` to understand structure
   - Check `client/src/App.js` for frontend logic
   - Review `server/routes/decisions.js` for API

2. **Try customization**
   - Change colors in `client/src/App.css`
   - Add a new filter field
   - Modify the scraper regex patterns

3. **Review documentation**
   - Read [DEVELOPMENT.md](./DEVELOPMENT.md) for dev setup
   - Check [DEPLOYMENT.md](./DEPLOYMENT.md) for production
   - See [README.md](./README.md) for full docs

4. **Consider deployment**
   - Set up on Heroku, DigitalOcean, or AWS
   - Enable automatic scraping
   - Set up monitoring

5. **Enhance the app**
   - Add PDF text extraction
   - Implement user accounts
   - Add batch download
   - Create advanced search

## ✅ Useful Commands Reference

```bash
# Start development
npm run dev

# Just backend
npm run server

# Just frontend
npm run client

# Manually scrape
npm run scrape

# Auto-scrape daily
npm run scrape-schedule

# Reset database
npm run db:migrate && npm run scrape

# Build for production
npm run build-client

# Check Node version
node --version

# List installed packages
npm ls

# Clean everything and reinstall
rm -rf node_modules client/node_modules
npm install
cd client && npm install && cd ..
```

## ✅ Database Commands

```bash
# Open database
sqlite3 server/data/cai_decisions.db

# Inside sqlite3:
.tables                              # List tables
.schema decisions                    # Show structure
SELECT COUNT(*) FROM decisions;      # Count rows
SELECT * FROM decisions LIMIT 3;     # View sample
.quit                                # Exit

# Quick checks from terminal:
sqlite3 server/data/cai_decisions.db "SELECT COUNT(*) FROM decisions;"

# Check downloaded PDFs:
sqlite3 server/data/cai_decisions.db "SELECT COUNT(*) as downloaded FROM decisions WHERE local_pdf_path IS NOT NULL;"
```

## 🎉 You're All Set!

Your CAI Decisions Search platform is ready to use!

**Next:** Run `npm run dev` and start exploring! 🚀

For questions:
- Check [QUICKSTART.md](./QUICKSTART.md) for quick answers
- Read [README.md](./README.md) for detailed docs
- See [DEVELOPMENT.md](./DEVELOPMENT.md) for dev questions
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for production

Happy searching! 📚
