import { NextResponse } from 'next/server';

const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/aidanfoo96/the-refuge/data/public/data/leaderboards.json';

export async function GET() {
  try {
    console.log('🔄 Fetching leaderboard data from GitHub...');
    
    const response = await fetch(GITHUB_RAW_URL, {
      // Enable caching for 5 minutes on our side
      next: { revalidate: 300 }
    });

    if (!response.ok) {
      console.error('❌ Failed to fetch from GitHub:', response.status, response.statusText);
      throw new Error(`GitHub fetch failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Successfully fetched leaderboard data');

    // Return with proper caching headers
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        // Cache for 5 minutes in browsers/CDN
        'Cache-Control': 'public, max-age=300, s-maxage=300',
        // Add CORS headers if needed
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('❌ API Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch leaderboard data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          // Don't cache errors
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        }
      }
    );
  }
}