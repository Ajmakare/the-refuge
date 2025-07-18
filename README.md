# The Refuge - Minecraft Server Website

A modern, Minecraft-themed website for The Refuge server featuring player leaderboards, server statistics, and community integration.

## 🚀 Features

- **Modern Design**: Minecraft-themed aesthetics with blocky elements and pixel fonts
- **Responsive Layout**: Mobile-first design that works on all devices
- **Player Leaderboards**: Real-time player statistics from PLAN plugin data
- **Discord Integration**: Prominent Discord invite buttons for community building
- **Google AdSense**: Clean ad integration for monetization
- **Automated Data Sync**: GitHub Actions workflow for daily data updates

## 🛠 Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS with custom Minecraft theme
- **Deployment**: Vercel (optimized for static generation)
- **Data Source**: PLAN plugin SQLite database
- **CI/CD**: GitHub Actions for automated data synchronization

## 📁 Project Structure

```
the-refuge-website/
├── app/                        # Next.js app directory
│   ├── page.tsx               # Homepage
│   ├── leaderboards/          # Leaderboards page
│   ├── layout.tsx             # Root layout with AdSense
│   └── globals.css            # Global styles
├── components/                # React components
│   ├── ui/                    # UI components
│   ├── AdSense.tsx            # Google AdSense component
│   └── DiscordButton.tsx      # Discord invite button
├── lib/                       # Utilities and types
├── public/                    # Static assets
│   └── data/                  # JSON data files
├── scripts/                   # Data sync scripts
│   └── sync-plan-data.js      # PLAN SQLite to JSON converter
└── .github/workflows/         # GitHub Actions
    └── sync-plan-data.yml     # Automated data sync
```

## 🔧 Setup Instructions

### 1. Clone and Install

```bash
git clone <your-repo>
cd the-refuge-website
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file:

```env
# Google AdSense (replace with your publisher ID)
NEXT_PUBLIC_ADSENSE_ID=ca-pub-XXXXXXXXXXXXXXXXX

# GGServers Connection (for GitHub Actions)
GGSERVERS_HOST=your-server.ggservers.com
GGSERVERS_USERNAME=your-username
GGSERVERS_PASSWORD=your-password
GGSERVERS_PORT=21
```

### 3. Update Configuration

**Discord Invite URL**: Update the Discord invite URL in:
- `components/DiscordButton.tsx`
- `app/page.tsx`

**Server Information**: Update server details in:
- `app/page.tsx` (server IP, statistics)
- `app/layout.tsx` (metadata)

**AdSense Configuration**: Replace placeholder AdSense client ID in:
- `app/layout.tsx`
- `components/AdSense.tsx`

### 4. PLAN Data Integration

#### Option A: Manual Sync (Getting Started)
1. Download `Plan.db` from your GGServers file manager
2. Place it in `scripts/temp/Plan.db`
3. Run the sync script:
   ```bash
   cd scripts
   npm install
   npm run sync
   ```

#### Option B: Automated Sync (Production)
1. Set up GitHub repository secrets for GGServers access
2. Update the download logic in `scripts/sync-plan-data.js`
3. The GitHub Action will run daily and update data automatically

### 5. Development

```bash
npm run dev
```

Visit `http://localhost:3000` to see your site.

### 6. Deployment to Vercel

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on every push to main branch

## 🔄 Data Sync Process

The website uses a GitHub Actions workflow to automatically sync PLAN data:

1. **Daily Schedule**: Runs at 6 AM UTC every day
2. **Download**: Fetches the latest `Plan.db` from your server
3. **Extract**: Converts SQLite data to JSON format
4. **Update**: Commits updated JSON to the repository
5. **Deploy**: Triggers automatic Vercel redeployment

### Manual Data Sync

To manually trigger a data sync:
1. Go to your GitHub repository
2. Click "Actions" tab
3. Select "Sync PLAN Data" workflow
4. Click "Run workflow"

## 📊 Leaderboard Categories

- **Most Active**: Players ranked by total playtime
- **Top Killers**: Players ranked by mob kills
- **Longest Sessions**: Players ranked by average session length
- **Top Builders**: Players ranked by blocks placed

## 🎨 Customization

### Minecraft Theme Colors

The site uses a custom Minecraft color palette defined in `tailwind.config.js`:

- `minecraft-grass`: #8BC34A
- `minecraft-dirt`: #8D6E63
- `minecraft-stone`: #757575
- `minecraft-gold`: #FFC107
- `minecraft-diamond`: #00BCD4
- `minecraft-emerald`: #4CAF50

### Adding New Pages

1. Create a new directory in `app/`
2. Add a `page.tsx` file
3. Follow the existing component patterns
4. Update navigation in the layout components

## 🔧 Troubleshooting

### Common Issues

1. **SQLite Database Access**: Ensure your GGServers credentials are correct and the PLAN plugin is generating the database at the expected path.

2. **Missing Dependencies**: Run `npm install` in both the root directory and the `scripts/` directory.

3. **AdSense Not Loading**: Verify your AdSense publisher ID is correct and your domain is approved.

4. **GitHub Actions Failing**: Check the Actions tab for detailed error logs and ensure all secrets are configured.

### PLAN Database Schema

The sync script expects these PLAN database tables:
- `plan_players` - Player information
- `plan_sessions_summary` - Session statistics
- `plan_kills` - Kill statistics
- `plan_deaths` - Death counts
- `plan_actions` - Block actions

If your PLAN version uses different table names, update the queries in `scripts/sync-plan-data.js`.

## 📝 License

This project is for The Refuge Minecraft Server. Feel free to adapt for your own server.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

Built with ❤️ for The Refuge Minecraft community