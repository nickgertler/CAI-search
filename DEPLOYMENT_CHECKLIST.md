# Deployment Checklist

Use this checklist to ensure your deployment is complete and working.

## Pre-Deployment

- [ ] Code committed to GitHub
- [ ] All dependencies listed in package.json
- [ ] React app builds without errors: `npm run build-client`
- [ ] Tested locally with `npm run dev`
- [ ] Environment variables documented

## Server Setup

- [ ] VPS created (DigitalOcean / similar)
- [ ] SSH access verified
- [ ] Node.js 18+ installed
- [ ] npm installed globally
- [ ] PM2 installed globally
- [ ] Nginx installed

## Application Deployment

- [ ] Code cloned from GitHub or uploaded
- [ ] `npm install` completed
- [ ] `npm run build-client` completed
- [ ] Database initialized: `node server/db/migrate.js`
- [ ] Initial scrape completed: `node server/scraper.js`
- [ ] Database verified has data: `sqlite3 data/decisions.db "SELECT COUNT(*) FROM decisions;"`

## Process Management

- [ ] Application started with PM2: `pm2 start server/index.js --name "cai-search"`
- [ ] PM2 startup configured: `pm2 startup` + `pm2 save`
- [ ] Process is running: `pm2 status` shows "online"
- [ ] Logs show scheduler started: `pm2 logs cai-search | grep "Scheduler"`

## Web Server Configuration

- [ ] Nginx config created at `/etc/nginx/sites-available/cai-search`
- [ ] Nginx config syntax valid: `nginx -t`
- [ ] Nginx enabled and running: `systemctl status nginx`
- [ ] Nginx restarted: `systemctl restart nginx`

## SSL/HTTPS

- [ ] Domain registered and DNS pointing to server
- [ ] SSL certificate obtained: `certbot --nginx -d your-domain.com`
- [ ] HTTPS working in browser
- [ ] Auto-renewal configured

## Testing

- [ ] API health check: `curl https://your-domain.com/api/health`
- [ ] Frontend loads: Visit https://your-domain.com in browser
- [ ] Search works
- [ ] Filters work
- [ ] Language switcher works
- [ ] Download button works

## Monitoring

- [ ] PM2 monitoring setup: `pm2 monit`
- [ ] Logs being reviewed: `pm2 logs cai-search`
- [ ] Database backups configured
- [ ] Backup script created and tested

## Scraper Verification

- [ ] Scheduler shows in logs: "Scheduler started"
- [ ] Cron schedule confirmed in `server/scheduler.js`
- [ ] Next scheduled run time confirmed: `pm2 describe cai-search`
- [ ] Manual scrape test: `node server/scraper.js`
- [ ] Wait until next scheduled time and verify logs update

## Maintenance Readiness

- [ ] Update procedure documented
- [ ] Rollback procedure known
- [ ] Alert system in place (optional)
- [ ] Team knows how to restart app
- [ ] Backup restoration tested

## Production Monitoring (Ongoing)

- [ ] Daily check: `pm2 status` shows "online"
- [ ] Weekly: Review error logs
- [ ] Weekly: Verify scraper is running
- [ ] Monthly: Check database size and backups
- [ ] Monthly: Review performance metrics

## URL Configuration

- [ ] Update these files with your production URL:
  - [ ] `client/src/App.js` - Change localhost:5000 to relative /api paths
  - [ ] `client/src/components/*` - All fetch calls use relative paths
  - [ ] Rebuild: `npm run build-client`

## Final Steps

- [ ] Visit your domain URL and test thoroughly
- [ ] Share with team/users
- [ ] Monitor logs for first 24 hours
- [ ] Celebrate! 🎉

---

## Quick Troubleshooting Commands

```bash
# Check if running
pm2 status

# View logs
pm2 logs cai-search

# Restart if issues
pm2 restart cai-search

# Check port 5000
netstat -tlnp | grep 5000

# Check Nginx
nginx -t
systemctl status nginx

# Database check
sqlite3 /var/www/cai-search/data/decisions.db \
  "SELECT COUNT(*) as decisions FROM decisions; SELECT MAX(created_at) FROM decisions;"

# Verify scheduler
pm2 logs cai-search | grep "Scheduler\|Starting scheduled"
```
