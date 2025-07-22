import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/Ajmakare/the-refuge/data/public/data/leaderboards.json';

// Fallback data for when GitHub data is not available
const FALLBACK_DATA = {
  mostActive: [],
  topKillers: [],
  mostDeaths: [],
  lastUpdated: new Date().toISOString()
};

// Simple in-memory rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_REQUESTS = 60; // requests per window
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

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
    
    const response = await fetch(GITHUB_RAW_URL, {
      // Enable caching for 5 minutes on our side
      next: { revalidate: 300 }
    });

    if (!response.ok) {
      // Return fallback data instead of erroring
      return NextResponse.json(FALLBACK_DATA, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          // Cache fallback for shorter time
          'Cache-Control': 'public, max-age=60, s-maxage=60',
          'X-Data-Source': 'fallback',
        },
      });
    }

    const data = await response.json();

    // Return with proper caching and security headers
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        // Cache for 5 minutes in browsers/CDN
        'Cache-Control': 'public, max-age=300, s-maxage=300',
        'X-Data-Source': 'github',
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