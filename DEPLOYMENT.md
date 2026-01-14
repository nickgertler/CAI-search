# Deployment Guide - CAI Decisions Search

## Overview

This application consists of:
- **Frontend**: React app (static files after build)
- **Backend**: Node.js Express API (port 5000)
- **Database**: SQLite3
- **Scraper**: Daily cron job (runs 1-2 times per day)
- **PDF Processing**: Inline extraction during scraping

The **critical requirement** is that the scraper runs 1-2 times daily via cron to check for new CAI decisions.

---

## Deployment Options

### Quick Comparison

| Option | Cost | Setup Time | Best For |
|--------|------|-----------|----------|
| **VPS + Cron** (recommended) | $3-6/month | 30 min | Simplest & cheapest |
| Heroku | $7-50/month | 20 min | Very easy, costs more |
| Vercel Frontend + Backend | $0-15/month | 40 min | Split architecture |
| Railway.app | $5-20/month | 20 min | Good balance |
| AWS Lambda + API Gateway | $0-10/month | 60 min | Serverless, complex |

**Recommended**: Cheap VPS ($3-6/month) + simple Linux cron job for maximum simplicity and cost savings.

---

## RECOMMENDED: Simple VPS Deployment with Cron

### Why This Setup

✅ Very affordable ($3-6/month)  
✅ Scraper runs reliably 1-2 times daily  
✅ Minimal complexity - no extra dependencies  
✅ Easy to monitor and update  
✅ No process manager needed  

### Prerequisites

- Domain name (optional, $10-15/year)
- Cheap VPS account (Linode, DigitalOcean, or Vultr)
- SSH client (built-in on Mac/Linux, PuTTY on Windows)

---

## Step-by-Step VPS Deployment

### Step 1: Create VPS

1. **Create Account** at Linode.com or DigitalOcean.com
2. **Create Instance**:
   - OS: Ubuntu 22.04 LTS
   - Size: Basic ($3-6/month is enough)
   - Region: Toronto or closest to Canada
3. **Note your IP address** (e.g., `123.45.67.89`)

### Step 2: Initial Server Setup

```bash
# SSH into your VPS
ssh root@YOUR_VPS_IP

# Update system
apt update && apt upgrade -y

# Install Node.js 24 LTS (current)
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
apt install -y nodejs git

# Verify installation
node --version  # Should show v24.13.0 or higher
npm --version

# Create application directory
mkdir -p /var/www/cai-search
cd /var/www/cai-search

# Create data directory for SQLite database
mkdir -p data
chmod 755 data
```

### Step 3: Deploy Application Code

```bash
cd /var/www/cai-search

# Clone from GitHub (if you have a repo)
git clone https://github.com/nickgertler/CAI-search.git .

# OR upload via SCP
# scp -r ./* root@YOUR_VPS_IP:/var/www/cai-search/

# Install server dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..

# Build React frontend
npm run build-client

# NOTE: If build fails due to low memory (< 512MB RAM):
# Build locally on your machine instead, then upload:
# On local: npm run build-client
# Then: scp -r client/build root@YOUR_VPS_IP:/var/www/cai-search/client/
```

### Step 4: Initialize Database and Run Initial Scrape

```bash
# Initialize database
node server/db/migrate.js

# Run initial scrape (takes 2-5 minutes)
node server/scraper.js

# Verify data was inserted
sqlite3 /var/www/cai-search/server/data/cai_decisions.db "SELECT COUNT(*) as decisions FROM decisions;"
```

### Step 5: Start API Server as Background Process

Simple way - start in a detached screen session:

```bash
# Install screen if needed
apt install -y screen

# Start Node.js in background
cd /var/www/cai-search
screen -d -m -S api node server/index.js

# Verify it's running
curl http://localhost:5000/api/health

# You should see: {"status":"ok","timestamp":"..."}
```

Or use a simple systemd service (better for production):

```bash
# Create systemd service file
cat > /etc/systemd/system/cai-search.service << 'EOF'
[Unit]
Description=CAI Decisions Search API
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/cai-search
ExecStart=/usr/bin/node /var/www/cai-search/server/index.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start
systemctl enable cai-search
systemctl start cai-search

# Check status
systemctl status cai-search
curl http://localhost:5000/api/health
```

### Step 6: Set Up Daily Scraper with Cron

```bash
# Open crontab editor
crontab -e

# Add this line (runs scraper at 2 AM daily):
0 2 * * * node /var/www/cai-search/server/scraper.js >> /var/log/cai-scraper.log 2>&1

# Or for twice daily (2 AM and 2 PM):
0 2,14 * * * node /var/www/cai-search/server/scraper.js >> /var/log/cai-scraper.log 2>&1

# Save and exit (Ctrl+X, then Y, then Enter)
```

Verify cron is set:
```bash
crontab -l
# Should show your scheduled job
```

### Step 7: Configure Web Server (Optional - for nicer URLs)

If you want domain-based access instead of IP:port, set up a simple reverse proxy.

**Simple approach - run API on port 80 directly:**

```bash
# Stop the service
systemctl stop cai-search

# Edit the service to run on port 80
# In /etc/systemd/system/cai-search.service, add:
Environment="PORT=80"

systemctl daemon-reload
systemctl start cai-search

# Verify
curl http://localhost/api/health
```

**Better approach - use Nginx as reverse proxy:**

```bash
# Install Nginx
apt install -y nginx

# Create config
cat > /etc/nginx/sites-available/cai-search << 'EOF'
server {
    listen 80;
    listen [::]:80;
    
    server_name your-domain.com www.your-domain.com;
    # or just: server_name YOUR_IP;
    
    # Serve React frontend
    root /var/www/cai-search/client/build;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy
    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

# Enable site
ln -s /etc/nginx/sites-available/cai-search /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test
nginx -t

# Start
systemctl start nginx
systemctl enable nginx
```

### Step 8: Add SSL/HTTPS (FREE - Let's Encrypt)

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get SSL certificate (requires domain name)
certbot --nginx -d cai.nog.omg.lol -d cai.nog.omg.lol

# Auto-renewal is configured automatically
# Verify:
systemctl status certbot.timer
```

---

## Verify Everything is Working

### Test 1: API is Running

```bash
curl http://localhost:5000/api/health
# Should return: {"status":"ok","timestamp":"..."}
```

### Test 2: Frontend Loads

```bash
# Open in browser:
# http://YOUR_IP or http://your-domain.com

# Or test with curl:
curl http://YOUR_IP/ | head -20
# Should show HTML with React app
```

### Test 3: Search Works

```bash
curl 'http://localhost:5000/api/decisions/search?limit=1'
# Should return decision data
```

### Test 4: Cron is Set Up

```bash
# Verify cron job exists
crontab -l
# Should show: 0 2 * * * node /var/www/cai-search/server/scraper.js ...
```

---

## Monitor Scraper Execution

The scraper runs automatically on your cron schedule (default: 2 AM daily).

### Check Cron Logs

```bash
# After the scheduled time, check if it ran:
tail -50 /var/log/syslog | grep "CRON\|scraper"

# If using systemd service for scraper, check journal:
journalctl -u cai-scraper -n 50
```

### Check Database for New Data

```bash
# Verify data is being added
sqlite3 /var/www/cai-search/server/data/cai_decisions.db << EOF
SELECT COUNT(*) as total_decisions, 
       COUNT(CASE WHEN pdf_text IS NOT NULL THEN 1 END) as with_text,
       MAX(created_at) as latest_update
FROM decisions;
EOF

# Should show count increasing and recent created_at timestamp
```

### Manually Test Scraper

```bash
# You can run the scraper manually anytime
cd /var/www/cai-search
node server/scraper.js

# Should output something like:
# Scraping completed:
#   Added/Updated: 5
#   Skipped: 397
# ✅ All PDFs extracted and stored in database
```

---

## Monitoring & Maintenance

### Daily Operations

```bash
# Just let it run! Cron handles everything.
# Optionally check in the morning:
tail -20 /var/log/syslog | grep CRON
```

### Weekly Operations

```bash
# Check that database is growing
sqlite3 /var/www/cai-search/server/data/cai_decisions.db \
  "SELECT COUNT(*) FROM decisions;"

# Should be higher than last week
```

### Update Application

```bash
cd /var/www/cai-search

# Pull latest code
git pull origin main

# Install new dependencies if any
npm install

# Rebuild frontend
npm run build-client

# Restart API
systemctl restart cai-search

# Restart Nginx if needed
systemctl restart nginx
```

### Database Backups

```bash
# Manual backup
mkdir -p /var/www/cai-search/backups
cp /var/www/cai-search/server/data/cai_decisions.db \
   /var/www/cai-search/backups/cai_decisions_backup_$(date +%Y%m%d).db

# Automatic daily backups at 1 AM:
crontab -e
# Add this line:
0 1 * * * mkdir -p /var/www/cai-search/backups && cp /var/www/cai-search/server/data/cai_decisions.db /var/www/cai-search/backups/cai_decisions_$(date +\%Y\%m\%d).db

# Keep only last 30 days:
0 1 * * * find /var/www/cai-search/backups -name "cai_decisions_*.db" -mtime +30 -delete
```

---

## Troubleshooting

### API not responding

```bash
# Check if service is running
systemctl status cai-search

# Restart it
systemctl restart cai-search

# Check error logs
journalctl -u cai-search -n 50
```

### Scraper not running

```bash
# Verify cron job is set
crontab -l

# Check cron logs
tail -50 /var/log/syslog | grep CRON

# Test manually
cd /var/www/cai-search
node server/scraper.js
```

### Port already in use

```bash
# Check what's using port 5000
lsof -i :5000

# Kill the process if needed
kill -9 <PID>

# Or change the port in server/index.js and restart
systemctl restart cai-search
```

### Database locked

```bash
# This shouldn't happen with cron, but if it does:
# Restart the API
systemctl restart cai-search

# Check database integrity
sqlite3 /var/www/cai-search/server/data/cai_decisions.db "PRAGMA integrity_check;"
```

---

## Cost Breakdown (Monthly)

| Service | Cost | Notes |
|---------|------|-------|
| VPS (Linode/DigitalOcean Basic) | $3-6 | 1-2GB RAM, 25GB storage |
| Domain | $1 | ~$12/year average |
| SSL Certificate | FREE | Let's Encrypt |
| Backups | FREE | Manual or cron-based |
| **TOTAL** | **$4-7/month** | Very affordable! |

---

## Alternative Deployment Options

### Option 2: Heroku (Easier but pricier)

**Cost**: $7-50/month (no free tier anymore)

**Pros**:
- Automatic deployment from GitHub
- Built-in SSL
- Horizontal scaling easy

**Cons**:
- More expensive
- Less control
- Cold starts (dyno goes to sleep)

**Setup**:
```bash
# Create Procfile
echo "web: npm run server" > Procfile

# Deploy
heroku login
heroku create your-app-name
git push heroku main

# Initialize
heroku run "npm run db:migrate"
heroku run "npm run scrape"

# Enable scheduler
heroku addons:create scheduler:standard
# Then in Heroku dashboard, add daily job: "npm run scrape-schedule"
```

### Option 3: Railway.app (Good middle ground)

**Cost**: Pay-as-you-go, typically $5-20/month

**Pros**:
- Simple deployment
- Good developer experience
- Persistent databases

**Setup**:
```bash
# Install Railway CLI
npm i -g @railway/cli

# Connect and deploy
railway login
railway init
railway up
```

### Option 4: AWS EC2 (Maximum control)

**Cost**: $3-30/month depending on instance size

**Pros**:
- Full control
- Scalable
- Many options

**Cons**:
- Complex setup
- More configuration

Similar to DigitalOcean steps above, but using AWS console.

---

## Maintenance Schedule

### Daily
- Check application is running: `pm2 status`
- Review logs for errors: `pm2 logs cai-search`

### Weekly
- Verify scraper is capturing new decisions
- Check disk space: `df -h`
- Review database size

### Monthly
- Download database backups securely
- Review application performance metrics
- Check PM2 logs for warnings
- Verify SSL certificate is auto-renewing

### Quarterly
- Review and update dependencies: `npm outdated`
- Test backup restoration
- Audit disk usage

---

## Next Steps

1. **Set up DigitalOcean account** (or choose your VPS)
2. **Create droplet** with Ubuntu 22.04 LTS
3. **Follow Steps 2-7** above
4. **Test** the scraper by checking logs after 2 AM tomorrow
5. **Monitor** with `pm2 logs cai-search`

---

## Questions?

Check the logs first:
```bash
pm2 logs cai-search
```

Most issues will show up there. If stuck, check:
- `/var/log/nginx/error.log` for web server issues
- `/var/log/syslog` for system issues
- Database integrity: `sqlite3 /var/www/cai-search/server/data/cai_decisions.db "PRAGMA integrity_check;"`

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## Option 3: Docker Deployment

### Create Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy and install dependencies
COPY package*.json ./
RUN npm install

# Copy client dependencies
COPY client/package*.json client/
WORKDIR /app/client
RUN npm install
WORKDIR /app

# Build client
RUN npm run build-client

# Initialize database
RUN npm run db:migrate
RUN npm run scrape

# Expose port
EXPOSE 5000

# Start server
CMD ["npm", "run", "server"]
```

### Build and Run
```bash
docker build -t cai-search .
docker run -p 5000:5000 -v $(pwd)/data:/app/data cai-search
```

---

## Environment Configuration for Production

Create `.env.production`:
```
PORT=5000
NODE_ENV=production
DATABASE_PATH=/var/lib/cai/data.db
```

---

## Database Backup and Maintenance

### Automated Daily Backups
```bash
# Create backup script
cat > /home/cai/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
cp /var/www/CAI-search/data/cai_decisions.db /backups/cai_decisions_$DATE.db.gz
find /backups -name "cai_decisions_*.db.gz" -mtime +30 -delete
EOF

chmod +x /home/cai/backup.sh

# Schedule with cron
crontab -e
# Add: 0 2 * * * /home/cai/backup.sh
```

---

## Scheduled Scraping in Production

### Using PM2 for Scheduled Scraping
```bash
# Create scheduler script
cat > scheduler.sh << 'EOF'
#!/bin/bash
cd /var/www/CAI-search
npm run scrape-schedule
EOF

chmod +x scheduler.sh

# Run with PM2
pm2 start scheduler.sh --name "cai-scheduler"
pm2 save
```

### Or Use System Cron
```bash
# Add to crontab
crontab -e

# Add this line (runs scraper daily at 3 AM)
0 3 * * * cd /var/www/CAI-search && npm run scrape >> /var/log/cai-scrape.log 2>&1
```

---

## Monitoring and Logs

### View Application Logs
```bash
# If using PM2
pm2 logs cai-api

# System logs (if using systemd)
journalctl -u cai-api -f
```

### Monitor Performance
```bash
# CPU and Memory usage
pm2 monit

# Check process status
pm2 status
```

---

## Security Checklist

- [ ] Enable HTTPS/SSL certificate
- [ ] Set environment variables securely
- [ ] Restrict database access
- [ ] Use strong credentials for any admin paths
- [ ] Enable CORS only for trusted domains
- [ ] Regular security updates for Node.js
- [ ] Monitor error logs for issues
- [ ] Implement rate limiting if needed
- [ ] Regular database backups
- [ ] Firewall rules configured

---

## Troubleshooting Deployment

### Database locked error
```bash
# Check for zombie processes
ps aux | grep node

# Kill and restart
pm2 restart cai-api
```

### High memory usage
```bash
# Restart application
pm2 restart cai-api

# Check database size
ls -lh server/data/cai_decisions.db
```

### Scraping fails
```bash
# Check logs
tail -f /var/log/cai-scrape.log

# Manually run scraper
cd /var/www/CAI-search
npm run scrape
```

---

## Performance Optimization

### Database Optimization
```bash
# Analyze database
sqlite3 data/cai_decisions.db ".analyze"

# Vacuum (cleanup fragmentation)
sqlite3 data/cai_decisions.db "VACUUM"
```

### Enable Gzip Compression in Nginx
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1000;
```

---

## Updating the Application

### Pull Latest Changes
```bash
cd /var/www/CAI-search
git pull origin main
npm install
cd client && npm install && cd ..
npm run build-client
pm2 restart cai-api
```

---

## Estimated Costs

| Platform | Estimated Monthly Cost |
|----------|----------------------|
| Heroku (Eco) | ~$5-10 |
| DigitalOcean Basic | ~$6-12 |
| AWS Lightsail | ~$5-20 |
| Docker on personal server | Cost of server only |

---

## Support

For deployment issues:
1. Check application logs
2. Review error messages
3. Verify environment configuration
4. Test database connectivity
5. Check firewall/network rules
