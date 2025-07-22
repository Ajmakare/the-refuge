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

## 🚀 Live Demo

Visit [the-refuge.vercel.app](https://the-refuge.vercel.app) to see it in action!

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

## 📋 Quick Start

### Prerequisites
- Node.js 18+
- Access to a Minecraft server with PLAN plugin
- GGServers hosting (or similar with FTP/SFTP access)

### Installation

```bash
# Clone the repository
git clone https://github.com/Ajmakare/the-refuge.git
cd the-refuge

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your server details

# Start development server
npm run dev
```

### Environment Variables

```bash
# Server Connection
GGSERVERS_HOST=your-server.ggservers.com
GGSERVERS_USERNAME=your-username
GGSERVERS_PASSWORD=your-password
GGSERVERS_PORT=21

# Optional: Google AdSense
NEXT_PUBLIC_ADSENSE_ID=ca-pub-XXXXXXXXXXXXXXXXX
```

## 📊 Data Synchronization

The website automatically syncs player data from your PLAN plugin:

- **Automatic**: GitHub Actions runs every hour
- **Manual**: Run `cd scripts && npm run sync`
- **Fallback**: Graceful handling when data is unavailable

## 🔧 Customization

### Styling
- Edit `tailwind.config.js` for colors and theme
- Modify `app/globals.css` for custom styles
- Update images in `public/images/`

### Content
- Server rules: `app/page.tsx`
- Legal pages: `app/privacy/` and `app/terms/`
- Metadata: `app/layout.tsx`

## 📈 Performance

- **Lighthouse Score**: 95+ performance
- **Bundle Size**: Optimized with Next.js
- **Caching**: Smart API caching with 5-minute cache
- **Images**: Optimized with Next.js Image component

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **PLAN Plugin** - For providing comprehensive Minecraft server analytics
- **GGServers** - Reliable Minecraft server hosting
- **Vercel** - Seamless deployment and hosting
- **The Refuge Community** - For 6+ years of amazing gameplay

---

<p align="center">
  <strong>Built with ❤️ for The Refuge Minecraft Community</strong>
</p>