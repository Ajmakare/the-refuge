#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Configuration
const CONFIG = {
  // FTP/SFTP connection details for GGServers
  server: {
    host: process.env.GGSERVERS_HOST || 'your-server.ggservers.com',
    username: process.env.GGSERVERS_USERNAME || 'your-username',
    password: process.env.GGSERVERS_PASSWORD || 'your-password',
    port: process.env.GGSERVERS_PORT || 21, // or 22 for SFTP
  },
  
  // Paths
  remoteSqlitePath: '/path/to/Plan/Plan.db', // Update this path
  localSqlitePath: './temp/Plan.db',
  outputJsonPath: './public/data/leaderboards.json',
  
  // Data limits
  limits: {
    mostActive: 10,
    topKillers: 10,
    longestSessions: 10,
    topBuilders: 10,
  }
};

/**
 * Download SQLite file from GGServers via FTP
 * You'll need to implement this based on your server access method
 */
async function downloadSqliteFile() {
  console.log('⬇️  Downloading SQLite file from server...');
  
  // Option 1: Using FTP (install 'ftp' package)
  // const Client = require('ftp');
  // const client = new Client();
  
  // Option 2: Using SFTP (install 'ssh2-sftp-client' package)
  // const Client = require('ssh2-sftp-client');
  // const sftp = new Client();
  
  // Option 3: Manual download for now
  console.log('⚠️  Manual download required. Please download Plan.db from your server and place it at:', CONFIG.localSqlitePath);
  console.log('   Server path:', CONFIG.remoteSqlitePath);
  
  // Create temp directory if it doesn't exist
  const tempDir = path.dirname(CONFIG.localSqlitePath);
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  // For now, check if file exists locally
  if (!fs.existsSync(CONFIG.localSqlitePath)) {
    throw new Error(`SQLite file not found at ${CONFIG.localSqlitePath}. Please download it manually first.`);
  }
  
  console.log('✅ SQLite file found locally');
}

/**
 * Extract player statistics from PLAN SQLite database
 */
async function extractPlayerStats() {
  console.log('📊 Extracting player statistics...');
  
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(CONFIG.localSqlitePath, sqlite3.OPEN_READONLY, (err) => {
      if (err) {
        reject(new Error(`Failed to open database: ${err.message}`));
        return;
      }
    });

    const leaderboardData = {
      mostActive: [],
      topKillers: [],
      longestSessions: [],
      topBuilders: [],
      lastUpdated: new Date().toISOString()
    };

    let completed = 0;
    const queries = 4; // Number of queries we'll run

    function checkComplete() {
      completed++;
      if (completed === queries) {
        db.close();
        resolve(leaderboardData);
      }
    }

    // Query 1: Most Active Players (by playtime)
    const activePlayersQuery = `
      SELECT 
        p.uuid,
        p.name,
        s.playtime,
        s.session_count as sessions,
        COALESCE(k.mob_kills, 0) as mob_kills,
        COALESCE(k.player_kills, 0) as player_kills,
        COALESCE(d.deaths, 0) as deaths,
        COALESCE(a.blocks_placed, 0) as blocks_placed,
        COALESCE(a.blocks_broken, 0) as blocks_broken,
        s.last_seen,
        p.registered as join_date
      FROM plan_players p
      LEFT JOIN plan_sessions_summary s ON p.uuid = s.uuid
      LEFT JOIN plan_kills k ON p.uuid = k.uuid
      LEFT JOIN plan_deaths d ON p.uuid = d.uuid
      LEFT JOIN plan_actions a ON p.uuid = a.uuid
      WHERE s.playtime > 0
      ORDER BY s.playtime DESC
      LIMIT ?
    `;

    db.all(activePlayersQuery, [CONFIG.limits.mostActive], (err, rows) => {
      if (err) {
        console.error('Error querying most active players:', err);
      } else {
        leaderboardData.mostActive = rows.map(row => ({
          uuid: row.uuid,
          name: row.name,
          playtime: row.playtime,
          sessions: row.sessions,
          kills: {
            mob: row.mob_kills,
            player: row.player_kills
          },
          deaths: row.deaths,
          blocksPlaced: row.blocks_placed,
          blocksBroken: row.blocks_broken,
          lastSeen: new Date(row.last_seen).toISOString(),
          joinDate: new Date(row.join_date).toISOString()
        }));
      }
      checkComplete();
    });

    // Query 2: Top Killers (by mob kills)
    db.all(`
      SELECT 
        p.uuid, p.name, s.playtime, s.session_count as sessions,
        COALESCE(k.mob_kills, 0) as mob_kills,
        COALESCE(k.player_kills, 0) as player_kills,
        COALESCE(d.deaths, 0) as deaths,
        COALESCE(a.blocks_placed, 0) as blocks_placed,
        COALESCE(a.blocks_broken, 0) as blocks_broken,
        s.last_seen, p.registered as join_date
      FROM plan_players p
      LEFT JOIN plan_sessions_summary s ON p.uuid = s.uuid
      LEFT JOIN plan_kills k ON p.uuid = k.uuid
      LEFT JOIN plan_deaths d ON p.uuid = d.uuid
      LEFT JOIN plan_actions a ON p.uuid = a.uuid
      WHERE k.mob_kills > 0
      ORDER BY k.mob_kills DESC
      LIMIT ?
    `, [CONFIG.limits.topKillers], (err, rows) => {
      if (err) {
        console.error('Error querying top killers:', err);
      } else {
        leaderboardData.topKillers = rows.map(row => ({
          uuid: row.uuid,
          name: row.name,
          playtime: row.playtime,
          sessions: row.sessions,
          kills: {
            mob: row.mob_kills,
            player: row.player_kills
          },
          deaths: row.deaths,
          blocksPlaced: row.blocks_placed,
          blocksBroken: row.blocks_broken,
          lastSeen: new Date(row.last_seen).toISOString(),
          joinDate: new Date(row.join_date).toISOString()
        }));
      }
      checkComplete();
    });

    // Query 3: Longest Sessions (by average session length)
    db.all(`
      SELECT 
        p.uuid, p.name, s.playtime, s.session_count as sessions,
        COALESCE(k.mob_kills, 0) as mob_kills,
        COALESCE(k.player_kills, 0) as player_kills,
        COALESCE(d.deaths, 0) as deaths,
        COALESCE(a.blocks_placed, 0) as blocks_placed,
        COALESCE(a.blocks_broken, 0) as blocks_broken,
        s.last_seen, p.registered as join_date,
        (s.playtime / s.session_count) as avg_session_length
      FROM plan_players p
      LEFT JOIN plan_sessions_summary s ON p.uuid = s.uuid
      LEFT JOIN plan_kills k ON p.uuid = k.uuid
      LEFT JOIN plan_deaths d ON p.uuid = d.uuid
      LEFT JOIN plan_actions a ON p.uuid = a.uuid
      WHERE s.session_count > 0
      ORDER BY avg_session_length DESC
      LIMIT ?
    `, [CONFIG.limits.longestSessions], (err, rows) => {
      if (err) {
        console.error('Error querying longest sessions:', err);
      } else {
        leaderboardData.longestSessions = rows.map(row => ({
          uuid: row.uuid,
          name: row.name,
          playtime: row.playtime,
          sessions: row.sessions,
          kills: {
            mob: row.mob_kills,
            player: row.player_kills
          },
          deaths: row.deaths,
          blocksPlaced: row.blocks_placed,
          blocksBroken: row.blocks_broken,
          lastSeen: new Date(row.last_seen).toISOString(),
          joinDate: new Date(row.join_date).toISOString()
        }));
      }
      checkComplete();
    });

    // Query 4: Top Builders (by blocks placed)
    db.all(`
      SELECT 
        p.uuid, p.name, s.playtime, s.session_count as sessions,
        COALESCE(k.mob_kills, 0) as mob_kills,
        COALESCE(k.player_kills, 0) as player_kills,
        COALESCE(d.deaths, 0) as deaths,
        COALESCE(a.blocks_placed, 0) as blocks_placed,
        COALESCE(a.blocks_broken, 0) as blocks_broken,
        s.last_seen, p.registered as join_date
      FROM plan_players p
      LEFT JOIN plan_sessions_summary s ON p.uuid = s.uuid
      LEFT JOIN plan_kills k ON p.uuid = k.uuid
      LEFT JOIN plan_deaths d ON p.uuid = d.uuid
      LEFT JOIN plan_actions a ON p.uuid = a.uuid
      WHERE a.blocks_placed > 0
      ORDER BY a.blocks_placed DESC
      LIMIT ?
    `, [CONFIG.limits.topBuilders], (err, rows) => {
      if (err) {
        console.error('Error querying top builders:', err);
      } else {
        leaderboardData.topBuilders = rows.map(row => ({
          uuid: row.uuid,
          name: row.name,
          playtime: row.playtime,
          sessions: row.sessions,
          kills: {
            mob: row.mob_kills,
            player: row.player_kills
          },
          deaths: row.deaths,
          blocksPlaced: row.blocks_placed,
          blocksBroken: row.blocks_broken,
          lastSeen: new Date(row.last_seen).toISOString(),
          joinDate: new Date(row.join_date).toISOString()
        }));
      }
      checkComplete();
    });
  });
}

/**
 * Save leaderboard data to JSON file
 */
async function saveLeaderboardData(data) {
  console.log('💾 Saving leaderboard data...');
  
  // Ensure output directory exists
  const outputDir = path.dirname(CONFIG.outputJsonPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Write JSON file
  fs.writeFileSync(CONFIG.outputJsonPath, JSON.stringify(data, null, 2));
  console.log('✅ Leaderboard data saved to:', CONFIG.outputJsonPath);
}

/**
 * Main execution function
 */
async function main() {
  try {
    console.log('🚀 Starting PLAN data sync...');
    
    await downloadSqliteFile();
    const leaderboardData = await extractPlayerStats();
    await saveLeaderboardData(leaderboardData);
    
    console.log('🎉 PLAN data sync completed successfully!');
    console.log('📊 Statistics extracted:');
    console.log(`   - Most Active: ${leaderboardData.mostActive.length} players`);
    console.log(`   - Top Killers: ${leaderboardData.topKillers.length} players`);
    console.log(`   - Longest Sessions: ${leaderboardData.longestSessions.length} players`);
    console.log(`   - Top Builders: ${leaderboardData.topBuilders.length} players`);
    
  } catch (error) {
    console.error('❌ Error during sync:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main, CONFIG };