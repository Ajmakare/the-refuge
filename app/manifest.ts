import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'The Refuge - Minecraft Server',
    short_name: 'The Refuge',
    description: 'A semi-vanilla PvE survival Minecraft server with deep lore and democratic community. View player leaderboards and server statistics.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#6366f1',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}