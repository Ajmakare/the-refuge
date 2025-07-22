import { NextResponse } from 'next/server';

const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/Ajmakare/the-refuge/data/public/data/leaderboards.json';

// Fallback data for when GitHub data is not available
const FALLBACK_DATA = {
  mostActive: [],
  topKillers: [],
  mostDeaths: [],
  lastUpdated: new Date().toISOString()
};

export async function GET() {
  try {
    console.log('🔄 Fetching leaderboard data from GitHub...');
    
    const response = await fetch(GITHUB_RAW_URL, {
      // Enable caching for 5 minutes on our side
      next: { revalidate: 300 }
    });

    if (!response.ok) {
      console.warn('⚠️  GitHub data not available (status:', response.status + '), using fallback data');
      
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
    console.log('✅ Successfully fetched leaderboard data from GitHub');

    // Return with proper caching headers
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        // Cache for 5 minutes in browsers/CDN
        'Cache-Control': 'public, max-age=300, s-maxage=300',
        'X-Data-Source': 'github',
        // Add CORS headers if needed
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('❌ API Error:', error, '- returning fallback data');
    
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