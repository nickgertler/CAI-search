# Deployment Summary

I've prepared a comprehensive deployment guide for your CAI Decisions Search application optimized for **simplicity and cost**.

## The Challenge

You need:
1. **Frontend** (React) to be served
2. **Backend API** (Node.js) running 24/7
3. **Scraper** running 1-2 times daily via cron
4. **Database** persisting all decisions with extracted text
5. **As cheap as possible**

## The Solution

**Recommended**: Cheap VPS (~$3-6/month) + simple cron job

This setup allows:
- ✅ Very affordable ($3-6/month)
- ✅ Scraper runs once or twice daily via cron
- ✅ Automatic restart on failures
- ✅ Easy updates and maintenance
- ✅ No extra dependencies needed (cron is built-in to Linux)

## Quick Summary of Deployment Process

1. **Create VPS** on Linode/DigitalOcean (5 min)
2. **SSH in and install** Node.js only (5 min)
3. **Deploy code** and install dependencies (5 min)
4. **Initialize database** and run first scrape (5 min)
5. **Start API** with simple `node server/index.js` in background (2 min)
6. **Add cron job** for daily scrape (2 min)
7. **Set up SSL** with Let's Encrypt - FREE (5 min)
8. **Verify** everything works (monitoring)

**Total time: ~30 minutes for complete setup**

## How the Scraper Works

In production:
- Your API server runs continuously
- A simple cron job triggers daily (default: 2 AM)
- Cron runs: `node /var/www/cai-search/server/scraper.js`
- Scraper:
  - Checks CAI website for decisions
  - Downloads PDFs
  - Extracts text immediately
  - Deletes PDFs from disk
  - Saves text to database
  - Then exits

You can customize the schedule with crontab (simple text):
```
# Once daily at 2 AM
0 2 * * * node /var/www/cai-search/server/scraper.js

# Twice daily at 2 AM and 2 PM
0 2,14 * * * node /var/www/cai-search/server/scraper.js

# Every 6 hours
0 */6 * * * node /var/www/cai-search/server/scraper.js
```

## Cost Breakdown

| Item | Cost |
|------|------|
| VPS (Linode/DigitalOcean basic) | $3-6/month |
| Domain (optional) | $12/year (~$1/month) |
| SSL | FREE (Let's Encrypt) |
| Database backups | Included |
| **Total** | **$3-7/month** |

Compare to: PM2 requires $7+/month for VPS alone

## Files I've Created/Updated

### New Files:
- **DEPLOYMENT.md** - Complete deployment guide (simplified for cron-based approach)
- **DEPLOYMENT_CHECKLIST.md** - Step-by-step checklist

### Modified Files:
- **server/index.js** - Removed scheduler auto-start (cron will handle scraping)

## Next Steps

### To Deploy:

1. Read **DEPLOYMENT.md** - "Simple Cron-Based Deployment" section
2. Create a cheap VPS ($3-6/month):
   - Linode, DigitalOcean, or Vultr
3. Follow the setup commands (~30 minutes)
4. Add ONE cron line for daily scraping
5. Done!

### To Monitor:

```bash
# SSH into your server
ssh root@YOUR_IP

# Check if API is running
curl http://localhost:5000/api/health

# Check cron logs (after it runs)
tail -50 /var/log/syslog | grep "scraper\|cron"

# Manually test scraper
node /var/www/cai-search/server/scraper.js
```
pm2 status

# View logs
pm2 logs cai-search

# Check next scrape time
pm2 describe cai-search
```

## Alternative Deployment Options

If you want even simpler/cheaper:

| Option | Cost | Setup Time | Best For |
|--------|------|-----------|----------|
| **VPS + Cron** (recommended) | $3-6/mo | 30 min | Full control, cheapest |
| **Vercel Frontend + Heroku API** | $0-14/mo | 20 min | Very simple, some cost |
| **Netlify + AWS Lambda** | $0-15/mo | 30 min | Serverless, scalable |
| **Railway.app** | $5-20/mo | 20 min | Easy, moderate cost |
| **Traditional Shared Hosting** | $2-5/mo | 20 min | Very cheap, limited |

See "Alternative Options" in DEPLOYMENT.md for details.

## Critical Configuration

Make sure your frontend uses relative URLs for API calls:

```javascript
// ❌ Don't do this in production
fetch('http://localhost:5000/api/decisions/search')

// ✅ Do this instead
fetch('/api/decisions/search')
```

This way Nginx correctly routes to the backend. Your current code already uses the proper pattern in most places.

## Monitoring Strategy

### Daily (No action needed):
- Your API server runs continuously
- Cron automatically runs scraper 1-2 times daily
- Backups run automatically

### Weekly (Check once a week):
```bash
ssh root@YOUR_IP
tail -20 /var/log/syslog | grep scraper
# Should see successful scrape logs from past week
```

### Monthly (Manual check):
```bash
sqlite3 /var/www/cai-search/data/decisions.db \
  "SELECT COUNT(*) as total, MAX(created_at) as latest FROM decisions;"
# Verify count is increasing
```

## Setup Questions

1. **Do you have a domain?** (Optional - can use IP address initially)
2. **Which VPS provider?** (Linode or DigitalOcean - both good)
3. **How often should scraper run?** (Default: 2 AM daily - easily customizable)
4. **Backup strategy?** (Manual or automatic?)

## Once Deployed

1. **Test the API** - `curl http://your-domain.com/api/health`
2. **Test the UI** - Visit site, search, download PDFs
3. **Wait for first scrape** - Check logs at next scheduled time
4. **Verify data** - Query DB to see new decisions
5. **Share with users** - They can now access live CAI decisions
6. **Monitor weekly** - Quick check that scraper is working

---

## Common Questions

**Q: Will the scraper really run unattended?**  
A: Yes. PM2 keeps the process alive, and node-cron handles scheduling. It runs whether you're logged in or not.

**Q: What if the server crashes?**  
A: PM2 automatically restarts the app. Nginx serves cached content while restarting.

**Q: Can I update the app without stopping the scraper?**  
A: Yes. Use `pm2 reload cai-search` for graceful restarts, or `pm2 restart` for immediate restart.

**Q: How much does storage cost?**  
A: SQLite database is ~25MB per 400 decisions. Your VPS comes with 25-50GB storage - plenty.

**Q: Can I automate code updates?**  
A: Yes, with GitHub Actions or similar CI/CD, but that's optional.

**Q: What if CAI website changes?**  
A: The scraper might fail. Check logs with `pm2 logs cai-search` and update scraper.js accordingly.

---

## You're Ready!

Everything is set up and ready to deploy. The scraper will automatically monitor CAI for new decisions 24/7 once you follow the deployment guide.

Start with **DEPLOYMENT.md** section "Step-by-Step DigitalOcean Deployment" and follow the copy-paste commands.

Good luck! 🚀
