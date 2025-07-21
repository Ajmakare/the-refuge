# PLAN Database Sync Setup Guide

This guide will help you set up automated synchronization between your GGServers PLAN database and your website leaderboards.

## 🚀 Quick Setup Summary

Your PLAN database sync system is now fully implemented and ready to use! Here's what's been set up:

- ✅ **Automated FTP/SFTP download** from GGServers
- ✅ **SQLite database parsing** with PLAN plugin support
- ✅ **GitHub Actions workflow** for scheduled syncing every 30 minutes
- ✅ **Development mode** for local testing
- ✅ **Error handling and fallbacks** for reliable operation

## 📋 Next Steps for You

### 1. Configure GGServers Access

First, gather your GGServers FTP credentials:

1. **Log into your GGServers control panel**
2. **Find the FTP access section** (usually under "File Manager" or "FTP")
3. **Note down these details:**
   - Hostname (e.g., `d757.ggn.io` or `yourserver.ggservers.com`)
   - FTP Username
   - FTP Password
   - Port (usually 21 for FTP, 22 for SFTP)

### 2. Set Up GitHub Repository Secrets

In your GitHub repository, go to **Settings → Secrets and variables → Actions** and add:

```
GGSERVERS_HOST=yourserver.ggservers.com
GGSERVERS_USERNAME=your-ftp-username
GGSERVERS_PASSWORD=your-ftp-password
GGSERVERS_PORT=21
```

### 3. Verify PLAN Plugin Database Location

The sync script expects your PLAN database at: `/plugins/Plan/database.db`

**To verify this path:**
1. Connect to your server via FTP
2. Navigate to the `/plugins/Plan/` directory
3. Look for files like `database.db`, `Plan.db`, or similar
4. If the file is named differently, update the path in `scripts/sync-plan-data.js` (line 18)

### 4. Test the Setup

Once you've added the GitHub secrets:

1. **Go to your repository's Actions tab**
2. **Find the "Sync PLAN Data" workflow**
3. **Click "Run workflow" → "Run workflow"**
4. **Monitor the logs** to see if the sync works

## 🔧 Local Development Testing

For testing locally before setting up production:

1. **Copy environment template:**
   ```bash
   cp .env.example .env.local
   ```

2. **Fill in your credentials in `.env.local`:**
   ```bash
   GGSERVERS_HOST=yourserver.ggservers.com
   GGSERVERS_USERNAME=your-username
   GGSERVERS_PASSWORD=your-password
   GGSERVERS_PORT=21
   ```

3. **Test the sync:**
   ```bash
   cd scripts
   npm run sync
   ```

4. **For development with sample data:**
   ```bash
   cd scripts
   npm run sync:dev
   ```

## 📊 How It Works

### Automated Schedule
- **Runs every 30 minutes** (customizable in `.github/workflows/sync-plan-data.yml`)
- **Downloads latest PLAN database** from your server
- **Extracts player statistics** (playtime, kills, builds, etc.)
- **Updates leaderboard data** in `public/data/leaderboards.json`
- **Commits changes** and triggers Vercel redeployment

### Data Extracted
- **Most Active Players** (by total playtime)
- **Top Combat Players** (by mob + PvP kills)
- **Longest Sessions** (by average session length)
- **Top Builders** (by blocks placed)

### Error Handling
- **Connection fallbacks** (tries SFTP, then FTP)
- **Manual file support** (place database manually if needed)
- **Data validation** (ensures JSON is valid before deployment)
- **Development mode** (works with sample data for testing)

## 🎯 Customization Options

### Change Sync Frequency
Edit `.github/workflows/sync-plan-data.yml`, line 6:
```yaml
- cron: '*/15 * * * *'  # Every 15 minutes
- cron: '0 */6 * * *'   # Every 6 hours
- cron: '0 6 * * *'     # Daily at 6 AM
```

### Change Player Limits
Edit `scripts/sync-plan-data.js`, lines 25-30:
```javascript
limits: {
  mostActive: 20,     // Show top 20 instead of 10
  topKillers: 15,
  longestSessions: 10,
  topBuilders: 25,
}
```

### Alternative Database Path
If your PLAN database is in a different location, update line 18:
```javascript
remoteSqlitePath: '/plugins/Plan/Plan.db', // or wherever your file is
```

## 🔍 Troubleshooting

### Common Issues

**"Connection failed" errors:**
- Verify your FTP credentials
- Check if your server allows FTP connections
- Try both FTP (port 21) and SFTP (port 22)

**"Database not found" errors:**
- Confirm PLAN plugin is installed and running
- Check the database file path
- Ensure FTP user has read access to the plugins directory

**"No changes detected" in Actions:**
- This is normal if player data hasn't changed
- Force a sync by manually running the workflow

### Manual Database Download

If automated download fails, you can manually place the database:

1. **Download `database.db`** from `/plugins/Plan/` via FTP
2. **Place it at** `scripts/temp/Plan.db`
3. **Run the sync** with `npm run sync`

## 🎉 You're All Set!

Once configured, your leaderboards will update automatically every 30 minutes with fresh data from your Minecraft server. The GitHub Actions workflow will handle everything automatically, and Vercel will redeploy your site whenever the data changes.

**Monitor your setup:**
- Check the Actions tab for sync status
- Watch for commit messages like "🤖 Update leaderboard data"
- Verify leaderboards on your live site show current data

Need help? Check the Action logs or review the sync script for detailed error messages.