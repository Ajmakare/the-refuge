#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const dns = require('dns');

// Configuration
const CONFIG = {
  // Development mode - skip download if true
  devMode: process.env.NODE_ENV === 'development' || process.env.DEV_MODE === 'true',
  
  // FTP/SFTP connection details for GGServers
  server: {
    host: process.env.GGSERVERS_HOST || 'your-server.ggservers.com',
    username: process.env.GGSERVERS_USERNAME || 'your-username',
    password: process.env.GGSERVERS_PASSWORD || 'your-password',
    port: parseInt(process.env.GGSERVERS_PORT || '21'), // Ensure it's a number
  },
  
  // Paths - GGServers typically uses /plugins/Plan/ for the PLAN plugin
  remoteSqlitePath: '/plugins/Plan/database.db', // Standard PLAN plugin database location
  localSqlitePath: './temp/Plan.db',
  outputJsonPath: '../public/data/leaderboards.json', // Relative to scripts directory
  
  // Data limits
  limits: {
    mostActive: 10,
    topKillers: 10,
    longestSessions: 10,
    topBuilders: 10,
  }
};

/**
 * Download SQLite file from GGServers via FTP/SFTP
 */
async function downloadSqliteFile() {
  console.log('⬇️  Downloading SQLite file from server...');
  
  // Create temp directory if it doesn't exist
  const tempDir = path.dirname(CONFIG.localSqlitePath);
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  // Development mode: skip download and use sample data if available
  if (CONFIG.devMode) {
    console.log('🔧 Development mode enabled - skipping download');
    
    // Check if we have existing sample data to continue with
    const existingSampleData = '../public/data/leaderboards.json';
    if (fs.existsSync(existingSampleData)) {
      console.log('✅ Found existing sample data, will use current structure');
      console.log('💡 To test with real database, set your GGServers credentials and remove DEV_MODE');
      return;
    }
    
    // If no sample data exists, create a minimal SQLite database for testing
    await createSampleDatabase();
    return;
  }
  
  // Validate hostname format
  console.log('🔍 Validating connection settings...');
  console.log(`📡 Host: ${CONFIG.server.host}`);
  console.log(`🔌 Port: ${CONFIG.server.port} (${typeof CONFIG.server.port})`);
  console.log(`👤 User: ${CONFIG.server.username}`);
  
  if (!CONFIG.server.host || CONFIG.server.host === 'your-server.ggservers.com') {
    throw new Error('❌ GGSERVERS_HOST not configured. Please set your actual GGServers hostname.');
  }
  
  if (!CONFIG.server.username || CONFIG.server.username === 'your-username') {
    throw new Error('❌ GGSERVERS_USERNAME not configured. Please set your FTP username.');
  }
  
  if (!CONFIG.server.password || CONFIG.server.password === 'your-password') {
    throw new Error('❌ GGSERVERS_PASSWORD not configured. Please set your FTP password.');
  }
  
  // Clean up hostname (remove protocol if present)
  let cleanHost = CONFIG.server.host.replace(/^sftp?:\/\//, '').replace(/^https?:\/\//, '').trim();
  
  // Handle GGServers specific formats like d757.ggn.io:2022
  if (cleanHost.includes(':')) {
    const [host, portFromHost] = cleanHost.split(':');
    cleanHost = host;
    if (!CONFIG.server.port || CONFIG.server.port === 21) {
      CONFIG.server.port = parseInt(portFromHost);
      console.log(`🔧 Extracted port from hostname: ${CONFIG.server.port}`);
    }
  }
  
  CONFIG.server.host = cleanHost;
  console.log(`🔧 Cleaned hostname: ${cleanHost}`);
  
  // Test DNS resolution first
  console.log('🌐 Testing DNS resolution...');
  try {
    await new Promise((resolve, reject) => {
      dns.resolve4(CONFIG.server.host, (err, addresses) => {
        if (err) {
          reject(new Error(`DNS resolution failed for ${CONFIG.server.host}: ${err.message}`));
        } else {
          console.log(`✅ DNS resolved to: ${addresses[0]}`);
          resolve(addresses);
        }
      });
    });
  } catch (dnsError) {
    console.log(`❌ ${dnsError.message}`);
    
    // Try common GGServers patterns
    const alternatives = [
      CONFIG.server.host.replace('.ggservers.com', '') + '.ggservers.com',
      CONFIG.server.host + '.ggservers.com',
      CONFIG.server.host.replace('.ggn.io', '') + '.ggn.io',
      CONFIG.server.host + '.ggn.io',
      'mc-' + CONFIG.server.host.replace(/^mc-/, '').replace('.ggservers.com', '') + '.ggservers.com'
    ];
    
    console.log('🔍 Trying alternative hostnames...');
    let foundAlternative = false;
    
    for (const alt of alternatives) {
      if (alt === CONFIG.server.host) continue;
      
      try {
        await new Promise((resolve, reject) => {
          dns.resolve4(alt, (err, addresses) => {
            if (err) reject(err);
            else resolve(addresses);
          });
        });
        console.log(`✅ Found working hostname: ${alt}`);
        CONFIG.server.host = alt;
        foundAlternative = true;
        break;
      } catch (e) {
        console.log(`❌ ${alt} also failed`);
      }
    }
    
    if (!foundAlternative) {
      throw new Error(`❌ Cannot resolve hostname. Please check:
1. Hostname spelling: ${CONFIG.server.host}
2. GGServers server status
3. Network connectivity

Common GGServers hostname formats:
- yourserver.ggservers.com
- mc-123.ggservers.com
- subdomain.ggservers.com`);
    }
  }
  
  // Try SFTP first (more secure), then fall back to FTP
  let downloadSuccess = false;
  
  // Option 1: Try SFTP download (for ports 22, 2022, or any non-21 port)
  if (CONFIG.server.port === 22 || CONFIG.server.port === 2022 || CONFIG.server.port !== 21) {
    try {
      console.log('🔒 Attempting SFTP download...');
      const Client = require('ssh2-sftp-client');
      const sftp = new Client();
      
      await sftp.connect({
        host: CONFIG.server.host,
        port: CONFIG.server.port,
        username: CONFIG.server.username,
        password: CONFIG.server.password,
        readyTimeout: 20000,
        retries: 2
      });
      
      console.log('✅ SFTP connected successfully');
      
      // Download the Plan database file
      await sftp.get(CONFIG.remoteSqlitePath, CONFIG.localSqlitePath);
      
      await sftp.end();
      downloadSuccess = true;
      console.log('✅ SFTP download completed successfully');
      
    } catch (sftpError) {
      console.log('❌ SFTP download failed:', sftpError.message);
      console.log('🔄 Falling back to FTP...');
    }
  }
  
  // Option 2: Try FTP download if SFTP failed or port is 21
  if (!downloadSuccess) {
    try {
      console.log('📁 Attempting FTP download...');
      console.log(`🔗 Connecting to ${CONFIG.server.host}:${CONFIG.server.port}`);
      
      const Client = require('ftp');
      const client = new Client();
      
      await new Promise((resolve, reject) => {
        client.on('ready', () => {
          console.log('✅ FTP connected successfully');
          
          // List directory first to verify connection and path
          client.list('/', (listErr, list) => {
            if (listErr) {
              console.log('⚠️  Could not list root directory:', listErr.message);
            } else {
              console.log('📂 Root directory contents:', list.length, 'items found');
              const pluginsDir = list.find(item => item.name === 'plugins');
              if (pluginsDir) {
                console.log('✅ Found plugins directory');
              } else {
                console.log('⚠️  No plugins directory found in root');
                console.log('📁 Available directories:', list.filter(item => item.type === 'd').map(item => item.name));
              }
            }
            
            // Try to get the database file
            console.log(`📥 Attempting to download: ${CONFIG.remoteSqlitePath}`);
            client.get(CONFIG.remoteSqlitePath, (err, stream) => {
              if (err) {
                // Try alternative paths
                const alternativePaths = [
                  '/plugins/Plan/Plan.db',
                  '/plugins/Plan/database.db',
                  '/server/plugins/Plan/database.db',
                  '/server/plugins/Plan/Plan.db'
                ];
                
                console.log('⚠️  Primary path failed, trying alternatives...');
                tryAlternativePaths(client, alternativePaths, 0, resolve, reject);
                return;
              }
              
              const writeStream = fs.createWriteStream(CONFIG.localSqlitePath);
              stream.pipe(writeStream);
              
              stream.on('end', () => {
                client.end();
                console.log('✅ FTP download completed successfully');
                resolve();
              });
              
              stream.on('error', (streamErr) => {
                client.end();
                reject(new Error(`FTP stream error: ${streamErr.message}`));
              });
            });
          });
        });
        
        client.on('error', (connErr) => {
          reject(new Error(`FTP connection error: ${connErr.message}`));
        });
        
        const ftpConfig = {
          host: CONFIG.server.host,
          port: CONFIG.server.port === 22 ? 21 : CONFIG.server.port,
          user: CONFIG.server.username,
          password: CONFIG.server.password,
          connTimeout: 20000,
          keepalive: 0
        };
        
        console.log('🔧 FTP Config:', { 
          host: ftpConfig.host, 
          port: ftpConfig.port, 
          user: ftpConfig.user,
          timeout: ftpConfig.connTimeout
        });
        
        client.connect(ftpConfig);
      });
      
      downloadSuccess = true;
      
    } catch (ftpError) {
      console.log('❌ FTP download failed:', ftpError.message);
    }
  }
  
  // Final check: Manual fallback or error
  if (!downloadSuccess) {
    console.log('⚠️  Automated download failed. Checking for manual file...');
    
    if (fs.existsSync(CONFIG.localSqlitePath)) {
      console.log('✅ Found manually placed SQLite file');
      return;
    }
    
    throw new Error(`
❌ Could not download SQLite file automatically. Please:
1. Check your GGServers credentials and connection
2. Verify the remote path: ${CONFIG.remoteSqlitePath}
3. Or manually download Plan.db and place it at: ${CONFIG.localSqlitePath}

Connection attempted:
- Host: ${CONFIG.server.host}
- Port: ${CONFIG.server.port}
- Username: ${CONFIG.server.username}
- Remote path: ${CONFIG.remoteSqlitePath}
    `);
  }
  
  // Verify downloaded file
  if (!fs.existsSync(CONFIG.localSqlitePath)) {
    throw new Error('Downloaded file not found at expected location');
  }
  
  const fileStats = fs.statSync(CONFIG.localSqlitePath);
  if (fileStats.size === 0) {
    throw new Error('Downloaded file is empty');
  }
  
  console.log(`✅ SQLite file downloaded successfully (${Math.round(fileStats.size / 1024)}KB)`);
}

/**
 * Try alternative paths for the PLAN database
 */
function tryAlternativePaths(client, paths, index, resolve, reject) {
  if (index >= paths.length) {
    client.end();
    reject(new Error('PLAN database not found at any expected location'));
    return;
  }
  
  const currentPath = paths[index];
  console.log(`🔍 Trying path ${index + 1}/${paths.length}: ${currentPath}`);
  
  client.get(currentPath, (err, stream) => {
    if (err) {
      console.log(`❌ Path ${currentPath} failed: ${err.message}`);
      tryAlternativePaths(client, paths, index + 1, resolve, reject);
      return;
    }
    
    console.log(`✅ Found database at: ${currentPath}`);
    const writeStream = fs.createWriteStream(CONFIG.localSqlitePath);
    stream.pipe(writeStream);
    
    stream.on('end', () => {
      client.end();
      console.log('✅ Alternative path download completed successfully');
      resolve();
    });
    
    stream.on('error', (streamErr) => {
      client.end();
      reject(new Error(`FTP stream error: ${streamErr.message}`));
    });
  });
}

/**
 * Create a sample SQLite database for development/testing
 */
async function createSampleDatabase() {
  console.log('🔨 Creating sample SQLite database for development...');
  
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(CONFIG.localSqlitePath, (err) => {
      if (err) {
        reject(new Error(`Failed to create sample database: ${err.message}`));
        return;
      }
    });

    // Create sample tables and data based on the existing sample data
    const sampleData = [
      {
        uuid: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Steve_Builder',
        playtime: 7200000,
        sessions: 45,
        mob_kills: 1250,
        player_kills: 5,
        deaths: 32,
        blocks_placed: 15000,
        blocks_broken: 8500,
        last_seen: Date.now(),
        registered: Date.now() - (30 * 24 * 60 * 60 * 1000) // 30 days ago
      },
      {
        uuid: '456e7890-e89b-12d3-a456-426614174001',
        name: 'Alex_Miner',
        playtime: 6900000,
        sessions: 38,
        mob_kills: 980,
        player_kills: 2,
        deaths: 28,
        blocks_placed: 12000,
        blocks_broken: 22000,
        last_seen: Date.now() - (24 * 60 * 60 * 1000), // 1 day ago
        registered: Date.now() - (45 * 24 * 60 * 60 * 1000) // 45 days ago
      }
    ];

    // Create tables
    db.serialize(() => {
      db.run(`CREATE TABLE plan_players (
        uuid TEXT PRIMARY KEY,
        name TEXT,
        registered INTEGER
      )`);

      db.run(`CREATE TABLE plan_sessions_summary (
        uuid TEXT,
        playtime INTEGER,
        session_count INTEGER,
        last_seen INTEGER
      )`);

      db.run(`CREATE TABLE plan_kills (
        uuid TEXT,
        mob_kills INTEGER,
        player_kills INTEGER
      )`);

      db.run(`CREATE TABLE plan_deaths (
        uuid TEXT,
        deaths INTEGER
      )`);

      db.run(`CREATE TABLE plan_actions (
        uuid TEXT,
        blocks_placed INTEGER,
        blocks_broken INTEGER
      )`);

      // Insert sample data
      const stmt1 = db.prepare('INSERT INTO plan_players VALUES (?, ?, ?)');
      const stmt2 = db.prepare('INSERT INTO plan_sessions_summary VALUES (?, ?, ?, ?)');
      const stmt3 = db.prepare('INSERT INTO plan_kills VALUES (?, ?, ?)');
      const stmt4 = db.prepare('INSERT INTO plan_deaths VALUES (?, ?)');
      const stmt5 = db.prepare('INSERT INTO plan_actions VALUES (?, ?, ?)');

      sampleData.forEach(player => {
        stmt1.run(player.uuid, player.name, player.registered);
        stmt2.run(player.uuid, player.playtime, player.sessions, player.last_seen);
        stmt3.run(player.uuid, player.mob_kills, player.player_kills);
        stmt4.run(player.uuid, player.deaths);
        stmt5.run(player.uuid, player.blocks_placed, player.blocks_broken);
      });

      stmt1.finalize();
      stmt2.finalize();
      stmt3.finalize();
      stmt4.finalize();
      stmt5.finalize();

      db.close(() => {
        console.log('✅ Sample SQLite database created');
        resolve();
      });
    });
  });
}

/**
 * Detect PLAN database table naming scheme
 */
function detectTableScheme(tableNames) {
  // Common PLAN table naming schemes
  const schemes = [
    {
      name: 'Standard PLAN v5+',
      tables: {
        players: 'plan_players',
        sessions: 'plan_sessions_summary', 
        kills: 'plan_kills',
        deaths: 'plan_deaths',
        actions: 'plan_actions'
      }
    },
    {
      name: 'Alternative PLAN v5+',
      tables: {
        players: 'plan_players',
        sessions: 'plan_sessions',
        kills: 'plan_kills', 
        deaths: 'plan_deaths',
        actions: 'plan_actions'
      }
    },
    {
      name: 'Legacy PLAN v4',
      tables: {
        players: 'plan_users',
        sessions: 'plan_user_info',
        kills: 'plan_kills',
        deaths: 'plan_deaths', 
        actions: 'plan_actions'
      }
    },
    {
      name: 'Simple naming',
      tables: {
        players: 'players',
        sessions: 'sessions',
        kills: 'kills',
        deaths: 'deaths',
        actions: 'actions'
      }
    },
    {
      name: 'Database prefix',
      tables: {
        players: 'plandb_players',
        sessions: 'plandb_sessions',
        kills: 'plandb_kills',
        deaths: 'plandb_deaths',
        actions: 'plandb_actions'
      }
    }
  ];

  // Check each scheme
  for (const scheme of schemes) {
    const requiredTables = Object.values(scheme.tables);
    const foundTables = requiredTables.filter(table => tableNames.includes(table.toLowerCase()));
    
    // Need at least players table to be viable
    if (foundTables.includes(scheme.tables.players.toLowerCase())) {
      console.log(`🔍 Scheme "${scheme.name}": found ${foundTables.length}/${requiredTables.length} tables`);
      
      // Update scheme with only found tables
      const availableScheme = {
        name: scheme.name,
        tables: {}
      };
      
      for (const [key, tableName] of Object.entries(scheme.tables)) {
        if (tableNames.includes(tableName.toLowerCase())) {
          availableScheme.tables[key] = tableName;
        }
      }
      
      return availableScheme;
    }
  }
  
  return null;
}

/**
 * Run queries with detected table scheme
 */
function runQueriesWithScheme(db, scheme, leaderboardData, resolve, reject) {
  let completed = 0;
  const queries = 4;

  function checkComplete() {
    completed++;
    if (completed === queries) {
      db.close();
      console.log('📊 Final leaderboard summary:');
      console.log(`   - Most Active: ${leaderboardData.mostActive.length} players`);
      console.log(`   - Top Killers: ${leaderboardData.topKillers.length} players`);
      console.log(`   - Longest Sessions: ${leaderboardData.longestSessions.length} players`);
      console.log(`   - Top Builders: ${leaderboardData.topBuilders.length} players`);
      resolve(leaderboardData);
    }
  }

  // Build dynamic queries based on available tables
  const tables = scheme.tables;

  // Query 1: Most Active Players (by playtime)
  if (tables.players && tables.sessions) {
    const activePlayersQuery = `
      SELECT 
        p.uuid,
        p.name,
        s.playtime,
        s.session_count as sessions,
        ${tables.kills ? 'COALESCE(k.mob_kills, 0) as mob_kills,' : '0 as mob_kills,'}
        ${tables.kills ? 'COALESCE(k.player_kills, 0) as player_kills,' : '0 as player_kills,'}
        ${tables.deaths ? 'COALESCE(d.deaths, 0) as deaths,' : '0 as deaths,'}
        ${tables.actions ? 'COALESCE(a.blocks_placed, 0) as blocks_placed,' : '0 as blocks_placed,'}
        ${tables.actions ? 'COALESCE(a.blocks_broken, 0) as blocks_broken,' : '0 as blocks_broken,'}
        s.last_seen,
        p.registered as join_date
      FROM ${tables.players} p
      LEFT JOIN ${tables.sessions} s ON p.uuid = s.uuid
      ${tables.kills ? `LEFT JOIN ${tables.kills} k ON p.uuid = k.uuid` : ''}
      ${tables.deaths ? `LEFT JOIN ${tables.deaths} d ON p.uuid = d.uuid` : ''}
      ${tables.actions ? `LEFT JOIN ${tables.actions} a ON p.uuid = a.uuid` : ''}
      WHERE s.playtime > 0
      ORDER BY s.playtime DESC
      LIMIT ?
    `;

    db.all(activePlayersQuery, [CONFIG.limits.mostActive], (err, rows) => {
      if (err) {
        console.error('❌ Error querying most active players:', err.message);
      } else {
        console.log(`🔍 Most Active query returned ${rows.length} rows`);
        leaderboardData.mostActive = rows.map(formatPlayerRow);
      }
      checkComplete();
    });
  } else {
    console.log('⚠️  Skipping Most Active query - missing required tables');
    checkComplete();
  }

  // Query 2: Top Killers (by mob kills) 
  if (tables.players && tables.kills) {
    const killersQuery = `
      SELECT 
        p.uuid, p.name,
        ${tables.sessions ? 's.playtime, s.session_count as sessions,' : '0 as playtime, 0 as sessions,'}
        COALESCE(k.mob_kills, 0) as mob_kills,
        COALESCE(k.player_kills, 0) as player_kills,
        ${tables.deaths ? 'COALESCE(d.deaths, 0) as deaths,' : '0 as deaths,'}
        ${tables.actions ? 'COALESCE(a.blocks_placed, 0) as blocks_placed,' : '0 as blocks_placed,'}
        ${tables.actions ? 'COALESCE(a.blocks_broken, 0) as blocks_broken,' : '0 as blocks_broken,'}
        ${tables.sessions ? 's.last_seen,' : 'NULL as last_seen,'}
        p.registered as join_date
      FROM ${tables.players} p
      ${tables.sessions ? `LEFT JOIN ${tables.sessions} s ON p.uuid = s.uuid` : ''}
      LEFT JOIN ${tables.kills} k ON p.uuid = k.uuid
      ${tables.deaths ? `LEFT JOIN ${tables.deaths} d ON p.uuid = d.uuid` : ''}
      ${tables.actions ? `LEFT JOIN ${tables.actions} a ON p.uuid = a.uuid` : ''}
      WHERE k.mob_kills > 0
      ORDER BY k.mob_kills DESC
      LIMIT ?
    `;

    db.all(killersQuery, [CONFIG.limits.topKillers], (err, rows) => {
      if (err) {
        console.error('❌ Error querying top killers:', err.message);
      } else {
        console.log(`🔍 Top Killers query returned ${rows.length} rows`);
        leaderboardData.topKillers = rows.map(formatPlayerRow);
      }
      checkComplete();
    });
  } else {
    console.log('⚠️  Skipping Top Killers query - missing required tables');
    checkComplete();
  }

  // Query 3: Longest Sessions (by average session length)
  if (tables.players && tables.sessions) {
    const sessionsQuery = `
      SELECT 
        p.uuid, p.name, s.playtime, s.session_count as sessions,
        ${tables.kills ? 'COALESCE(k.mob_kills, 0) as mob_kills,' : '0 as mob_kills,'}
        ${tables.kills ? 'COALESCE(k.player_kills, 0) as player_kills,' : '0 as player_kills,'}
        ${tables.deaths ? 'COALESCE(d.deaths, 0) as deaths,' : '0 as deaths,'}
        ${tables.actions ? 'COALESCE(a.blocks_placed, 0) as blocks_placed,' : '0 as blocks_placed,'}
        ${tables.actions ? 'COALESCE(a.blocks_broken, 0) as blocks_broken,' : '0 as blocks_broken,'}
        s.last_seen, p.registered as join_date,
        (s.playtime / s.session_count) as avg_session_length
      FROM ${tables.players} p
      LEFT JOIN ${tables.sessions} s ON p.uuid = s.uuid
      ${tables.kills ? `LEFT JOIN ${tables.kills} k ON p.uuid = k.uuid` : ''}
      ${tables.deaths ? `LEFT JOIN ${tables.deaths} d ON p.uuid = d.uuid` : ''}
      ${tables.actions ? `LEFT JOIN ${tables.actions} a ON p.uuid = a.uuid` : ''}
      WHERE s.session_count > 0
      ORDER BY avg_session_length DESC
      LIMIT ?
    `;

    db.all(sessionsQuery, [CONFIG.limits.longestSessions], (err, rows) => {
      if (err) {
        console.error('Error querying longest sessions:', err);
      } else {
        leaderboardData.longestSessions = rows.map(formatPlayerRow);
      }
      checkComplete();
    });
  } else {
    console.log('⚠️  Skipping Longest Sessions query - missing required tables');
    checkComplete();
  }

  // Query 4: Top Builders (by blocks placed)
  if (tables.players && tables.actions) {
    const buildersQuery = `
      SELECT 
        p.uuid, p.name,
        ${tables.sessions ? 's.playtime, s.session_count as sessions,' : '0 as playtime, 0 as sessions,'}
        ${tables.kills ? 'COALESCE(k.mob_kills, 0) as mob_kills,' : '0 as mob_kills,'}
        ${tables.kills ? 'COALESCE(k.player_kills, 0) as player_kills,' : '0 as player_kills,'}
        ${tables.deaths ? 'COALESCE(d.deaths, 0) as deaths,' : '0 as deaths,'}
        COALESCE(a.blocks_placed, 0) as blocks_placed,
        COALESCE(a.blocks_broken, 0) as blocks_broken,
        ${tables.sessions ? 's.last_seen,' : 'NULL as last_seen,'}
        p.registered as join_date
      FROM ${tables.players} p
      ${tables.sessions ? `LEFT JOIN ${tables.sessions} s ON p.uuid = s.uuid` : ''}
      ${tables.kills ? `LEFT JOIN ${tables.kills} k ON p.uuid = k.uuid` : ''}
      ${tables.deaths ? `LEFT JOIN ${tables.deaths} d ON p.uuid = d.uuid` : ''}
      LEFT JOIN ${tables.actions} a ON p.uuid = a.uuid
      WHERE a.blocks_placed > 0
      ORDER BY a.blocks_placed DESC
      LIMIT ?
    `;

    db.all(buildersQuery, [CONFIG.limits.topBuilders], (err, rows) => {
      if (err) {
        console.error('Error querying top builders:', err);
      } else {
        leaderboardData.topBuilders = rows.map(formatPlayerRow);
      }
      checkComplete();
    });
  } else {
    console.log('⚠️  Skipping Top Builders query - missing required tables');
    checkComplete();
  }
}

/**
 * Format player row data consistently
 */
function formatPlayerRow(row) {
  return {
    uuid: row.uuid,
    name: row.name,
    playtime: row.playtime || 0,
    sessions: row.sessions || 0,
    kills: {
      mob: row.mob_kills || 0,
      player: row.player_kills || 0
    },
    deaths: row.deaths || 0,
    blocksPlaced: row.blocks_placed || 0,
    blocksBroken: row.blocks_broken || 0,
    lastSeen: row.last_seen ? new Date(row.last_seen).toISOString() : new Date().toISOString(),
    joinDate: row.join_date ? new Date(row.join_date).toISOString() : new Date().toISOString()
  };
}

/**
 * Extract player statistics from PLAN SQLite database
 */
async function extractPlayerStats() {
  console.log('📊 Extracting player statistics...');
  
  // In development mode, if no database exists but we have sample data, just refresh it
  if (CONFIG.devMode && !fs.existsSync(CONFIG.localSqlitePath)) {
    const existingSampleData = '../public/data/leaderboards.json';
    if (fs.existsSync(existingSampleData)) {
      console.log('📊 Development mode: refreshing existing sample data with new timestamp');
      const sampleData = JSON.parse(fs.readFileSync(existingSampleData, 'utf8'));
      sampleData.lastUpdated = new Date().toISOString();
      return sampleData;
    }
  }
  
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

    // First, inspect the database structure
    console.log('🔍 Inspecting PLAN database structure...');
    
    // Check what tables exist and detect naming scheme
    db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
      if (err) {
        console.log('❌ Error listing tables:', err.message);
        return;
      } 
      
      console.log('📋 Available tables:', tables.map(t => t.name).join(', '));
      
      // Detect table naming scheme
      const tableNames = tables.map(t => t.name.toLowerCase());
      let detectedScheme = detectTableScheme(tableNames);
      
      if (detectedScheme) {
        console.log('✅ Detected PLAN table scheme:', detectedScheme.name);
        console.log('🔧 Using table mappings:', JSON.stringify(detectedScheme.tables, null, 2));
        
        // Update queries to use detected table names
        runQueriesWithScheme(db, detectedScheme, leaderboardData, resolve, reject);
      } else {
        console.log('❌ No compatible PLAN table scheme detected');
        console.log('💡 Available tables:', tableNames.join(', '));
        
        // Fallback to empty data
        resolve(leaderboardData);
      }
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