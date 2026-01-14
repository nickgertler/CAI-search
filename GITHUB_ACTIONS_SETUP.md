# GitHub Actions CI/CD Setup Guide

## Overview

This guide walks you through setting up GitHub Actions to automatically build your React client and deploy to your DigitalOcean droplet whenever you push to `main`.

## What This Does

✅ **On every push to main:**
1. GitHub Actions checks out your code
2. Installs dependencies and builds the React client (on GitHub's servers)
3. Uploads the built client to your droplet
4. Pulls the latest server code on your droplet
5. Restarts your Node.js server
6. **Preserves your SQLite database** (never gets wiped)

**No more manual builds!** Just `git push` and watch the deployment happen.

---

## Setup Steps

### Step 1: Generate SSH Key for GitHub Actions

On your **local machine**:

```bash
# Generate a dedicated SSH key for deployments (no passphrase)
ssh-keygen -t ed25519 -f ~/.ssh/github_actions_deploy -N ""

# Display the private key (you'll add this to GitHub secrets)
cat ~/.ssh/github_actions_deploy
```

### Step 2: Add Public Key to Your Droplet

SSH into your droplet and add the public key:

```bash
# On your LOCAL machine:
cat ~/.ssh/github_actions_deploy.pub

# Then SSH to droplet and add it:
ssh root@YOUR_DROPLET_IP

# On the DROPLET:
echo "YOUR_PUBLIC_KEY_CONTENT" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

exit
```

### Step 3: Add GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add these two secrets:

**Secret 1: `DROPLET_SSH_KEY`**
- **Value**: The entire contents of `~/.ssh/github_actions_deploy` (the PRIVATE key)
- Include the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` lines

**Secret 2: `DROPLET_HOST`**
- **Value**: Your droplet's IP address (e.g., `147.182.155.253`)

### Step 4: Ensure Git is Initialized on Your Droplet

SSH into your droplet and set up git:

```bash
cd /var/www/cai-search

# Initialize git if not already done
git init
git remote add origin https://github.com/nickgertler/CAI-search.git

# Fetch without checking out (to avoid overwriting data/)
git fetch origin main
```

### Step 5: Make Deploy Script Executable

On your **droplet**:

```bash
chmod +x /var/www/cai-search/scripts/deploy.sh
```

### Step 6: Ensure systemd Service Exists

Your workflow restarts the service with `systemctl restart cai-search`. Make sure this service exists:

```bash
# On your droplet, check if service exists:
systemctl status cai-search

# If it doesn't exist, create it:
sudo cat > /etc/systemd/system/cai-search.service << 'EOF'
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

sudo systemctl daemon-reload
sudo systemctl enable cai-search
sudo systemctl start cai-search
```

---

## Testing the Workflow

### Make a Test Push

```bash
# Make a small change to verify everything works
echo "# Updated $(date)" >> README.md

git add README.md
git commit -m "Test CI/CD workflow"
git push origin main
```

### Watch the Workflow

1. Go to your GitHub repository
2. Click the **Actions** tab
3. You should see your workflow running
4. Click on it to see real-time logs

### Verify Deployment

After the workflow completes:

```bash
# Check droplet logs
ssh root@YOUR_DROPLET_IP
systemctl status cai-search
journalctl -u cai-search -n 20

# Verify your changes are there
curl http://localhost:5000/api/health

# Check that database is still intact
sqlite3 /var/www/cai-search/server/data/cai_decisions.db "SELECT COUNT(*) FROM decisions;"
```

---

## How the Workflow Works

### Build Job (on GitHub)
1. Checks out your code
2. Installs Node dependencies
3. Runs `npm run build-client` to build React
4. Saves the built files as artifacts

### Deploy Job (after build succeeds)
1. Downloads the built files from the build job
2. Connects to your droplet via SSH
3. Runs `scripts/deploy.sh` which:
   - Pulls latest code from GitHub (preserves `data/` directory)
   - Installs server dependencies
4. Uploads the built React client via SCP
5. Restarts the Node.js server

### Database Safety
- The `data/` directory is in `.gitignore` so it's never committed
- The deploy script explicitly excludes `data/` when pulling: `git checkout HEAD -- data/ || true`
- The database stays intact on every deployment

---

## Troubleshooting

### Workflow fails with "permission denied"

**Problem**: SSH authentication failed

**Solution**:
```bash
# Verify the public key is in ~/.ssh/authorized_keys on your droplet
ssh root@YOUR_DROPLET_IP
cat ~/.ssh/authorized_keys

# Verify permissions
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

### Workflow fails with "command not found: node"

**Problem**: Node.js isn't in the PATH when SSH runs commands

**Solution**: Use the full path in the deploy script or ensure Node is installed at `/usr/bin/node`

```bash
ssh root@YOUR_DROPLET_IP "which node"
```

### Database is empty after deployment

**Problem**: The data directory got overwritten

**Solution**: This shouldn't happen with the current setup. If it does:
1. Check the workflow logs for errors
2. Verify `.gitignore` includes `data/*.db`
3. Manually restore from backups if needed

### "git remote already exists" error

**Problem**: The droplet already has a git remote configured

**Solution**: On the droplet, update the existing remote:
```bash
cd /var/www/cai-search
git remote set-url origin https://github.com/nickgertler/CAI-search.git
```

---

## Advanced Customization

### Deploy Only on Tags

To deploy only when you create a git tag:

Edit `.github/workflows/deploy.yml` and change the `on:` section:

```yaml
on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:
```

### Run Additional Commands

To run database migrations or other scripts during deployment, add them to `scripts/deploy.sh`:

```bash
# Example: Run database migrations
node server/db/migrate.js

# Example: Run scraper
node server/scraper.js
```

### Slack Notifications

To get notified when deployments succeed/fail, add this step to the workflow:

```yaml
- name: Notify Slack
  if: always()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK }}
    payload: |
      {
        "text": "Deployment ${{ job.status }}"
      }
```

---

## Security Notes

- The SSH key is stored as a GitHub secret and never exposed in logs
- The deploy key has only the permissions needed (SSH access to droplet)
- Consider rotating the SSH key periodically
- Keep your `.gitignore` updated to exclude sensitive files

---

## Next Steps

1. ✅ Generate SSH key (Step 1 above)
2. ✅ Add public key to droplet (Step 2)
3. ✅ Add secrets to GitHub (Step 3)
4. ✅ Initialize git on droplet (Step 4)
5. ✅ Test with a small push (Testing section)
6. 🚀 Push your changes and watch the magic happen!

---

## Questions?

If the workflow fails, check:
1. **GitHub Actions tab** → Click the failed workflow → View logs
2. **Droplet logs**: `journalctl -u cai-search -n 50`
3. **SSH connectivity**: `ssh -i ~/.ssh/github_actions_deploy root@YOUR_DROPLET_IP`
