# The Refuge - Minecraft Server Website

A modern, Minecraft-themed website for The Refuge server featuring advanced player leaderboards, intelligent activity scoring, and comprehensive server statistics.

## 🚀 Features

### 🏆 Advanced Leaderboard System
- **Smart Activity Scoring**: Sophisticated algorithm ranking players by active time, session frequency, recent activity, and engagement - not just raw playtime
- **Complete Data Consistency**: All leaderboard tabs show consistent player statistics through intelligent data merging
- **Four Leaderboard Categories**: 
  - **Most Active**: Activity score-based ranking (replaces simple playtime)
  - **Top Combat**: Combined mob kills + PvP kills with proper data aggregation  
  - **Longest Sessions**: Average session length in minutes (more meaningful than total sessions)
  - **Most Deaths**: Players who've learned the most from their mistakes

### 🎨 Enhanced User Experience
- **Improved Visual Design**: Better trophy colors with readable 3rd place bronze (#D2691E)
- **Smart Timestamps**: Full date and time display for when data was last updated
- **Optimized Server Stats**: Shows Most Active player, Top Killer, and Most Deaths instead of simple counts
- **Responsive Design**: Mobile-first Minecraft-themed UI that works beautifully on all devices

### 🔄 Robust Data Integration
- **Universal PLAN Compatibility**: Supports both modern PLAN v5+ and Legacy PLAN v4 databases
- **Intelligent Database Detection**: Automatically adapts to different table naming schemes
- **Real-time Sync**: Automated updates every 30 minutes via GitHub Actions
- **Fallback Support**: Graceful handling of missing tables or data structures

### 🎯 Technical Excellence
- **Modern Architecture**: Next.js 15 with App Router and TypeScript
- **Performance Optimized**: Static generation with efficient data processing
- **Discord Integration**: Seamless community connection
- **AdSense Ready**: Clean monetization integration

## 🛠 Tech Stack

- **Framework**: Next.js 15 with App Router and TypeScript
- **Styling**: Tailwind CSS with custom Minecraft theme
- **Database Processing**: SQLite with dynamic schema detection  
- **Deployment**: Vercel with automated GitHub Actions pipeline
- **Data Source**: PLAN plugin with comprehensive compatibility layer

## 📊 Leaderboard Intelligence

### 🧠 Activity Scoring Algorithm
The "Most Active" leaderboard uses a sophisticated multi-factor scoring system:
- **40% Active Time**: Total playtime minus AFK time (rewards genuine engagement)
- **30% Session Frequency**: Regular players get bonus points (1 hour equivalent per session)
- **20% Recent Activity**: Players active within 7 days receive additional weighting
- **10% Engagement**: Mob kills indicate active gameplay (1 minute equivalent per kill)

### 📈 Data Processing Features
- **Comprehensive Merging**: Player statistics are consistent across all leaderboard tabs
- **Intelligent Queries**: Uses CTEs (Common Table Expressions) for complex data aggregation  
- **Dual Database Support**: Automatically detects and adapts to PLAN v4/v5+ table structures
- **Graceful Fallbacks**: Handles missing tables and incomplete data elegantly

### 🏅 Current Leaderboard Categories
- **Most Active**: Advanced activity score ranking (not simple playtime)
- **Top Combat**: Combined mob and PvP kills with proper session data integration
- **Longest Sessions**: Average session length in minutes (shows dedication patterns)
- **Most Deaths**: Learning experiences and risk-taking behavior

## 🔄 Automated Data Pipeline

The website features a robust automated data synchronization system:
- **Real-time Updates**: GitHub Actions workflow runs every 30 minutes
- **Multi-Protocol Support**: SFTP primary with FTP fallback
- **Error Handling**: Comprehensive logging and graceful error recovery
- **Schema Detection**: Automatically adapts to different PLAN database versions
- **Performance Optimized**: Efficient queries minimize database load

## 🎨 Design System

### Minecraft-Inspired Theme
The website features a cohesive Minecraft aesthetic with:
- **Custom Color Palette**: Grass greens, stone grays, gold accents, and diamond blues
- **Pixel-Perfect Typography**: Geist Sans and Geist Mono for clean readability
- **Blocky Elements**: Minecraft-themed UI components and card designs
- **Trophy System**: Gold crown (1st), silver star (2nd), chocolate trophy (3rd) with distinct colors

### Technical Architecture
- **Component-Based**: Reusable React components with consistent styling
- **Responsive Grid**: Mobile-first approach with Tailwind CSS
- **Performance Optimized**: Static generation with efficient data loading
- **Accessible**: Clean typography and color contrast for readability

## 🛡️ Database Compatibility

The system supports multiple PLAN database versions and naming schemes:

### Supported Schemas
- **Modern PLAN v5+**: `plan_users`, `plan_sessions`, `plan_kills`, `plan_deaths`
- **Legacy PLAN v4**: `plan_users`, `plan_user_info`, individual session records  
- **Alternative Naming**: `players`, `sessions`, `kills`, `deaths` (simple names)
- **Prefixed Tables**: `plandb_*` prefix variations

### Adaptive Query System
- **Schema Detection**: Automatically identifies available tables and columns
- **Dynamic Queries**: Adjusts SQL queries based on detected database structure
- **Graceful Degradation**: Handles missing data with appropriate fallbacks
- **Performance Optimized**: Uses efficient joins and CTEs for complex aggregations

## 🌟 Key Achievements

This website represents a significant evolution in Minecraft server analytics:

- **Beyond Simple Stats**: Moves from basic playtime rankings to sophisticated engagement scoring
- **Data Intelligence**: Implements complex data merging and consistency algorithms  
- **Universal Compatibility**: Works with any PLAN database version or configuration
- **User Experience Excellence**: Clean, intuitive interface with meaningful information display
- **Performance & Reliability**: Robust error handling and efficient data processing

## 📈 Impact

- **Enhanced Player Engagement**: More accurate representation of player activity encourages healthy competition
- **Community Building**: Comprehensive statistics help players understand their gameplay patterns
- **Technical Innovation**: Advanced database compatibility ensures long-term sustainability
- **Visual Polish**: Professional design creates a premium experience for server communities

---

Built with ❤️ for The Refuge Minecraft community

*A testament to what's possible when technical excellence meets community passion*