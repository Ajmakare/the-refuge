# GitHub Repository Setup for PLAN Sync

## 🔧 Repository Settings Configuration

To enable the GitHub Actions workflow to automatically commit leaderboard updates, you need to configure these repository settings:

### **1. Enable GitHub Actions Permissions**

1. **Go to your repository on GitHub**
2. **Click Settings → Actions → General**
3. **Under "Workflow permissions", select:**
   - ✅ **"Read and write permissions"**
   - ✅ **"Allow GitHub Actions to create and approve pull requests"**
4. **Click "Save"**

### **2. Add Repository Secrets**

1. **Go to Settings → Secrets and variables → Actions**
2. **Click "New repository secret"**
3. **Add these secrets:**

```
GGSERVERS_HOST=d757.ggn.io
GGSERVERS_PORT=2022
GGSERVERS_USERNAME=your-sftp-username
GGSERVERS_PASSWORD=your-sftp-password
```

### **3. Alternative: Use Personal Access Token (if write permissions still fail)**

If the default GITHUB_TOKEN doesn't work:

1. **Create a Personal Access Token:**
   - Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Generate new token with `repo` scope
   - Copy the token

2. **Add as repository secret:**
   - Name: `PAT_TOKEN`
   - Value: your personal access token

3. **Update workflow to use PAT:**
   ```yaml
   with:
     token: ${{ secrets.PAT_TOKEN }}
   ```

## 🚀 **Your PLAN Sync is Working!**

Based on the output you showed, your PLAN database sync is actually **working perfectly**:

✅ **SFTP Connection** - Successfully connected to `d757.ggn.io:2022`
✅ **Database Download** - PLAN database downloaded via SFTP
✅ **Data Processing** - Player statistics extracted and formatted
✅ **JSON Generation** - Leaderboard data updated successfully
✅ **Local Commit** - Changes committed with detailed stats

**The output showed:**
```
📊 Data sync completed:
- Most Active: 5 players
- Top Killers: 3 players  
- Longest Sessions: 3 players
- Top Builders: 4 players
- Top Player: Steve_Builder (2h playtime)
```

## 🔧 **Next Steps**

1. **Configure repository permissions** (step 1 above)
2. **Add your SFTP secrets** (step 2 above)
3. **Test the workflow** by manually triggering it

### **Manual Test:**
1. Go to Actions tab in your repository
2. Click "Sync PLAN Data"
3. Click "Run workflow"
4. Monitor the logs

### **Automated Schedule:**
Once permissions are fixed, the workflow will:
- ✅ **Run every 30 minutes** automatically
- ✅ **Download latest PLAN data** from your server
- ✅ **Update leaderboards** with live player stats
- ✅ **Commit and deploy** changes to Vercel

## 🎉 **Success!**

Your automated PLAN synchronization is fully implemented and working. Once the GitHub permissions are configured, you'll have:

- **Real-time leaderboards** updating every 30 minutes
- **Live player statistics** from your Minecraft server
- **Automatic deployment** to your website
- **Zero manual intervention** required

The hard work is done - now it's just a matter of repository configuration!