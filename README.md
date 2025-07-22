# The Refuge - Minecraft Server Website

> A modern, production-ready website for The Refuge Minecraft server featuring real-time player leaderboards and server statistics.

## ✨ Features

- **🏆 Real-time Leaderboards** - Most Active, Top Combat, and Most Deaths rankings
- **📊 Smart Analytics** - Advanced activity scoring algorithm beyond simple playtime
- **🔒 Production Security** - Rate limiting, CORS protection, and security headers
- **📱 Mobile-First Design** - Responsive Minecraft-themed UI
- **⚡ Zero Deployment Spam** - Data updates every hour without rebuilding the site
- **🔍 SEO Optimized** - Meta tags, sitemap, and Open Graph integration
- **⚖️ Legal Compliant** - Privacy policy and terms of service


## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Deployment**: Vercel
- **Data Source**: PLAN Minecraft Plugin
- **Automation**: GitHub Actions

## 🏗️ Architecture

The website uses a modern architecture that eliminates deployment spam:

1. **GitHub Actions** downloads PLAN database every hour
2. **Sync script** processes data and commits to separate `data` branch
3. **API routes** serve fresh data from GitHub with smart caching
4. **Frontend** fetches real-time data without triggering rebuilds


## 📊 Data Synchronization

The website automatically syncs player data from your PLAN plugin:

- **Automatic**: GitHub Actions runs every hour
- **Manual**: Run `cd scripts && npm run sync`
- **Fallback**: Graceful handling when data is unavailable


## 📈 Performance

- **Lighthouse Score**: 95+ performance
- **Bundle Size**: Optimized with Next.js
- **Caching**: Smart API caching with 5-minute cache
- **Images**: Optimized with Next.js Image component


---

<p align="center">
  <strong>Built with ❤️ for The Refuge Minecraft Community</strong>
</p>