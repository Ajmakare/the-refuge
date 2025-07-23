import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { DiscordLeaderboardData } from '@/lib/types';

const MEE6_API_URL = 'https://mee6.xyz/api/plugins/levels/leaderboard/598640040544829440';
const GUILD_ID = '598640040544829440';

// Fallback data for when MEE6 API is not available
const FALLBACK_DATA: DiscordLeaderboardData = {
  players: [],
  guild: {
    id: GUILD_ID,
    name: 'The Refuge',
    icon: ''
  },
  lastUpdated: new Date().toISOString()
};

// Simple in-memory rate limiting and caching
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const cacheStore = new Map<string, { data: DiscordLeaderboardData; timestamp: number }>();

const RATE_LIMIT_REQUESTS = 30; // requests per window (lower for external API)
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(ip);
  
  // Clean up old entries
  if (record && now > record.resetTime) {
    rateLimitStore.delete(ip);
  }
  
  const currentRecord = rateLimitStore.get(ip);
  if (!currentRecord) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (currentRecord.count >= RATE_LIMIT_REQUESTS) {
    return false;
  }
  
  currentRecord.count++;
  return true;
}

function getFromCache(key: string): DiscordLeaderboardData | null {
  const cached = cacheStore.get(key);
  if (!cached) return null;
  
  const now = Date.now();
  if (now - cached.timestamp > CACHE_DURATION) {
    cacheStore.delete(key);
    return null;
  }
  
  return cached.data;
}

function setCache(key: string, data: DiscordLeaderboardData): void {
  cacheStore.set(key, {
    data,
    timestamp: Date.now()
  });
}

async function fetchMee6Data(): Promise<DiscordLeaderboardData> {
  try {
    // Check cache first
    const cacheKey = `mee6_${GUILD_ID}`;
    const cachedData = getFromCache(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const response = await fetch(MEE6_API_URL, {
      headers: {
        'User-Agent': 'The Refuge Minecraft Server Website',
        'Accept': 'application/json',
      },
      // Add timeout
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`MEE6 API responded with ${response.status}`);
    }

    const mee6Data = await response.json();
    
    // Transform MEE6 data to our format
    const transformedData: DiscordLeaderboardData = {
      players: mee6Data.players || [], // Show all available players (typically 100)
      guild: {
        id: mee6Data.guild?.id || GUILD_ID,
        name: mee6Data.guild?.name || 'The Refuge',
        icon: mee6Data.guild?.icon || ''
      },
      lastUpdated: new Date().toISOString()
    };

    // Cache the result
    setCache(cacheKey, transformedData);
    
    return transformedData;
  } catch (error) {
    console.error('MEE6 API error:', error);
    return FALLBACK_DATA;
  }
}

export async function GET() {
  try {
    // Get client IP for rate limiting
    const headersList = await headers();
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    const clientIp = forwardedFor?.split(',')[0] || realIp || 'unknown';
    
    // Check rate limit
    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { 
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Limit': RATE_LIMIT_REQUESTS.toString(),
            'X-RateLimit-Window': RATE_LIMIT_WINDOW.toString(),
          }
        }
      );
    }
    
    const data = await fetchMee6Data();

    // Return with proper caching and security headers
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        // Cache for 5 minutes in browsers/CDN
        'Cache-Control': 'public, max-age=300, s-maxage=300',
        'X-Data-Source': data.players.length > 0 ? 'mee6' : 'fallback',
        // Security headers
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        // CORS headers (restrictive)
        'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
          ? 'https://therefuge-minecraft.vercel.app' 
          : '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
    });

  } catch (error) {
    console.error('Discord leaderboard error:', error);
    // Return fallback data instead of error for better UX
    return NextResponse.json(FALLBACK_DATA, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60, s-maxage=60',
        'X-Data-Source': 'fallback-error',
      },
    });
  }
}