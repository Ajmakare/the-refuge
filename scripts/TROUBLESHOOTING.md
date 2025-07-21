# GGServers Connection Troubleshooting

Based on the error you're seeing (`getaddrinfo ENOTFOUND`), here's how to diagnose and fix the connection:

## 🔍 Quick Diagnosis

The error suggests one of these issues:
1. **Hostname is incorrect** - Double-check your server hostname
2. **Network/DNS issue** - The hostname can't be resolved
3. **FTP service not available** - GGServers might not have FTP enabled

## 🛠 Step-by-Step Fixes

### 1. Verify Your Hostname Format

GGServers hostnames typically look like:
- ✅ `yourserver.ggservers.com`
- ✅ `mc-123.ggservers.com` 
- ❌ `https://yourserver.ggservers.com` (remove https://)
- ❌ `yourserver` (missing .ggservers.com)

### 2. Test Connection Manually

Run this to test your connection:
```bash
# Replace with your actual credentials
node test-connection.js yourserver.ggservers.com username password 21
```

### 3. Check GGServers Control Panel

1. **Log into your GGServers panel**
2. **Look for "File Manager" or "FTP Access"**
3. **Verify these details:**
   - Hostname/Server address
   - FTP username (might be different from panel login)
   - FTP password (might need to be set separately)
   - Port (usually 21 for FTP, 22 for SFTP)

### 4. Alternative Connection Methods

If FTP doesn't work, GGServers might use:

**SFTP (Port 22):**
```bash
# Test SFTP instead
GGSERVERS_PORT=22 npm run sync
```

**Alternative ports:**
```bash
# Try different FTP ports
GGSERVERS_PORT=2121 npm run sync
GGSERVERS_PORT=8021 npm run sync
```

### 5. Manual File Access Method

If automated download fails, you can:

1. **Download via GGServers web panel:**
   - Go to File Manager → plugins → Plan
   - Download `database.db` or `Plan.db`

2. **Place the file locally:**
   ```bash
   # Create temp directory
   mkdir -p temp
   
   # Copy your downloaded file to:
   cp ~/Downloads/database.db temp/Plan.db
   ```

3. **Run sync:**
   ```bash
   npm run sync
   ```

## 🔧 Common GGServers Issues

### Issue: "FTP not enabled"
**Solution:** Contact GGServers support to enable FTP access

### Issue: "Authentication failed"
**Solution:** 
- Reset FTP password in control panel
- Use server-specific FTP credentials (not panel login)

### Issue: "Permission denied"
**Solution:** Ensure FTP user has read access to plugins directory

### Issue: "File not found"
**Solution:** PLAN plugin might not be installed or database in different location

## 🧪 Quick Test Script

Create a test file to verify your exact credentials:

```bash
# Create test-my-connection.sh
echo '#!/bin/bash
echo "Testing connection to $GGSERVERS_HOST..."
ping -c 1 $GGSERVERS_HOST
echo "Testing FTP port..."
nc -zv $GGSERVERS_HOST $GGSERVERS_PORT
' > test-my-connection.sh

chmod +x test-my-connection.sh

# Run with your credentials
GGSERVERS_HOST=yourserver.ggservers.com GGSERVERS_PORT=21 ./test-my-connection.sh
```

## 💡 Next Steps

1. **Verify hostname format** (most common issue)
2. **Check GGServers control panel** for correct FTP settings
3. **Try SFTP** if FTP fails
4. **Use manual download** as fallback
5. **Contact GGServers support** if all else fails

Once you identify the correct settings, update your environment variables and the sync should work!

## 🎯 Quick Fix Commands

```bash
# Test different configurations
GGSERVERS_HOST=yourserver.ggservers.com GGSERVERS_PORT=21 npm run sync
GGSERVERS_HOST=yourserver.ggservers.com GGSERVERS_PORT=22 npm run sync
GGSERVERS_HOST=yourserver.ggservers.com GGSERVERS_PORT=2121 npm run sync

# If all fail, use development mode to keep working
npm run sync:dev
```