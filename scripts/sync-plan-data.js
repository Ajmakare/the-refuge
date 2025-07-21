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
    mostActive: 15,
    topKillers: 15,
    longestSessions: 15,
    mostDeaths: 15,
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
        sessions: 'plan_sessions',
        kills: 'plan_kills',
        deaths: 'plan_deaths', 
        actions: 'plan_actions'
      }
    },
    {
      name: 'Alternative Legacy PLAN v4',
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
 * Detect column structure for tables
 */
function detectColumnStructure(db, tables, callback) {
  const columnMapping = {};
  let tablesChecked = 0;
  const tablesToCheck = ['sessions', 'kills'];
  
  function checkComplete() {
    tablesChecked++;
    if (tablesChecked === tablesToCheck.length) {
      callback(columnMapping);
    }
  }
  
  // Check columns in sessions table (most variable between versions)
  if (tables.sessions) {
    db.all(`PRAGMA table_info(${tables.sessions})`, [], (err, columns) => {
      if (err || !columns) {
        console.log('⚠️  Could not detect columns in sessions table');
      } else {
        const columnNames = columns.map(col => col.name.toLowerCase());
        console.log(`🔍 ${tables.sessions} columns:`, columnNames.join(', '));
        
        // Map common column variations
        columnMapping.playtime = columnNames.includes('playtime') ? 'playtime' : 
                                columnNames.includes('playtime_ms') ? 'playtime_ms' :
                                columnNames.includes('length_ms') ? 'length_ms' :
                                columnNames.includes('session_length') ? 'session_length' :
                                columnNames.includes('time_played') ? 'time_played' : null;
        
        // Check for session-based data that needs aggregation
        columnMapping.sessionStart = columnNames.includes('session_start') ? 'session_start' : null;
        columnMapping.sessionEnd = columnNames.includes('session_end') ? 'session_end' : null;
        columnMapping.userId = columnNames.includes('user_id') ? 'user_id' : null;
        
        columnMapping.sessions = columnNames.includes('session_count') ? 'session_count' :
                                columnNames.includes('sessions') ? 'sessions' : null;
        
        columnMapping.lastSeen = columnNames.includes('last_seen') ? 'last_seen' :
                                columnNames.includes('session_end') ? 'session_end' :
                                columnNames.includes('last_login') ? 'last_login' : null;
      }
      checkComplete();
    });
  } else {
    checkComplete();
  }
  
  // Check columns in kills table
  if (tables.kills) {
    db.all(`PRAGMA table_info(${tables.kills})`, [], (err, columns) => {
      if (err || !columns) {
        console.log('⚠️  Could not detect columns in kills table');
      } else {
        const columnNames = columns.map(col => col.name.toLowerCase());
        console.log(`🔍 ${tables.kills} columns:`, columnNames.join(', '));
        
        // Map kill column variations
        columnMapping.mobKills = columnNames.includes('mob_kills') ? 'mob_kills' :
                                columnNames.includes('kills') ? 'kills' :
                                columnNames.includes('mob_kill_count') ? 'mob_kill_count' : null;
        
        columnMapping.playerKills = columnNames.includes('player_kills') ? 'player_kills' :
                                   columnNames.includes('pvp_kills') ? 'pvp_kills' :
                                   columnNames.includes('player_kill_count') ? 'player_kill_count' : null;
        
        // Check for individual kill records that need aggregation
        columnMapping.killerUuid = columnNames.includes('killer_uuid') ? 'killer_uuid' : null;
        columnMapping.victimUuid = columnNames.includes('victim_uuid') ? 'victim_uuid' : null;
      }
      checkComplete();
    });
  } else {
    checkComplete();
  }
}

/**
 * Run queries with column mapping
 */
function runQueriesWithColumns(db, tables, columns, leaderboardData, scheme, checkComplete) {
  // Query 1: Most Active Players or Basic Player List
  if (tables.players) {
    if (tables.sessions && columns.playtime) {
      // Full query with session data
      const activePlayersQuery = `
        SELECT 
          p.uuid,
          p.name,
          COALESCE(s.${columns.playtime}, 0) as playtime,
          ${columns.sessions ? `COALESCE(s.${columns.sessions}, 0) as sessions,` : '0 as sessions,'}
          p.registered as join_date,
          ${columns.lastSeen ? `COALESCE(s.${columns.lastSeen}, p.registered) as last_seen` : 'p.registered as last_seen'}
        FROM ${tables.players} p
        LEFT JOIN ${tables.sessions} s ON p.uuid = s.uuid
        WHERE COALESCE(s.${columns.playtime}, 0) > 0
        ORDER BY COALESCE(s.${columns.playtime}, 0) DESC
        LIMIT ?
      `;

      db.all(activePlayersQuery, [CONFIG.limits.mostActive], (err, rows) => {
        if (err) {
          console.error('❌ Error querying most active players:', err.message);
        } else {
          console.log(`🔍 Most Active query returned ${rows.length} rows`);
          leaderboardData.mostActive = rows.map(row => ({
            uuid: row.uuid,
            name: row.name,
            playtime: row.playtime || 0,
            sessions: row.sessions || 0,
            kills: { mob: 0, player: 0 },
            deaths: 0,
            afkTime: 0,
            daysActive: 0,
            lastSeen: new Date(row.last_seen || row.join_date).toISOString(),
            joinDate: new Date(row.join_date).toISOString()
          }));
        }
        checkComplete();
      });
    } else if (tables.sessions && columns.sessionStart && columns.sessionEnd && columns.userId) {
      // Aggregated session data query (for your database structure)
      console.log('📊 Aggregating session data from individual session records...');
      const aggregatedPlayersQuery = `
        SELECT 
          p.uuid,
          p.name,
          SUM(COALESCE(s.${columns.sessionEnd} - s.${columns.sessionStart}, 0)) as playtime,
          COUNT(s.id) as sessions,
          SUM(COALESCE(s.mob_kills, 0)) as mob_kills,
          SUM(COALESCE(s.afk_time, 0)) as afk_time,
          p.registered as join_date,
          MAX(s.${columns.sessionEnd}) as last_seen,
          CAST(AVG(COALESCE(s.${columns.sessionEnd} - s.${columns.sessionStart}, 0)) / (60 * 1000) AS INTEGER) as avg_session_length_minutes,
          -- Calculate activity score with balanced weighting (SQLite compatible)
          CAST(
            -- Recent active time (last 14 days) - 40% weight
            COALESCE(SUM(
              CASE WHEN s.${columns.sessionEnd} > (strftime('%s', 'now') - 1209600) * 1000
                   THEN MAX(0, (s.${columns.sessionEnd} - s.${columns.sessionStart}) - COALESCE(s.afk_time, 0))
                   ELSE 0 END
            ), 0) * 0.4
            -- Total active time (lifetime engagement) - 30% weight  
            + CASE 
                WHEN (SUM(COALESCE(s.${columns.sessionEnd} - s.${columns.sessionStart}, 0)) - SUM(COALESCE(s.afk_time, 0))) > 0 
                THEN (SUM(COALESCE(s.${columns.sessionEnd} - s.${columns.sessionStart}, 0)) - SUM(COALESCE(s.afk_time, 0))) * 0.3
                ELSE 0 
              END
            -- Session frequency bonus (regular play) - 20% weight
            + (COUNT(s.id) * 1800000 * 0.2)  -- 30 minutes equivalent per session
            -- Recent consistency (active days in last 14 days) - 10% weight
            + (COUNT(DISTINCT 
                CASE WHEN s.${columns.sessionEnd} > (strftime('%s', 'now') - 1209600) * 1000
                     THEN date(s.${columns.sessionEnd}/1000, 'unixepoch') 
                     ELSE NULL END
              ) * 3600000 * 0.1)  -- 1 hour equivalent per active day
          AS INTEGER) as activity_score
        FROM ${tables.players} p
        LEFT JOIN ${tables.sessions} s ON p.id = s.${columns.userId}
        GROUP BY p.uuid, p.name, p.registered
        HAVING SUM(COALESCE(s.${columns.sessionEnd} - s.${columns.sessionStart}, 0)) > 0
        ORDER BY activity_score DESC, playtime DESC
        LIMIT ?
      `;

      db.all(aggregatedPlayersQuery, [CONFIG.limits.mostActive], (err, rows) => {
        if (err) {
          console.error('❌ Error querying aggregated players:', err.message);
          console.log('💡 Falling back to basic player list...');
          
          // Fallback to basic player list
          const basicPlayersQuery = `
            SELECT uuid, name, registered as join_date
            FROM ${tables.players} 
            ORDER BY registered DESC
            LIMIT ?
          `;

          db.all(basicPlayersQuery, [CONFIG.limits.mostActive], (err2, rows2) => {
            if (!err2) {
              console.log(`🔍 Basic fallback query returned ${rows2.length} rows`);
              leaderboardData.mostActive = rows2.map(row => ({
                uuid: row.uuid,
                name: row.name,
                playtime: 0,
                sessions: 0,
                kills: { mob: 0, player: 0 },
                deaths: 0,
                afkTime: 0,
                daysActive: 0,
                lastSeen: new Date(row.join_date).toISOString(),
                joinDate: new Date(row.join_date).toISOString()
              }));
            }
            checkComplete();
          });
        } else {
          console.log(`🔍 Aggregated session query returned ${rows.length} rows`);
          leaderboardData.mostActive = rows.map(row => ({
            uuid: row.uuid,
            name: row.name,
            playtime: row.playtime || 0,
            sessions: row.sessions || 0,
            kills: { mob: row.mob_kills || 0, player: 0 },
            deaths: 0,
            afkTime: row.afk_time || 0,
            avgSessionLength: row.avg_session_length_minutes || 0,
            activityScore: row.activity_score || 0, // Internal scoring metric
            lastSeen: new Date(row.last_seen || row.join_date).toISOString(),
            joinDate: new Date(row.join_date).toISOString()
          }));
          checkComplete();
        }
      });
    } else {
      // Fallback: Basic player list
      console.log('📋 No session data available, showing basic player list...');
      const basicPlayersQuery = `
        SELECT uuid, name, registered as join_date
        FROM ${tables.players} 
        ORDER BY registered DESC
        LIMIT ?
      `;

      db.all(basicPlayersQuery, [CONFIG.limits.mostActive], (err, rows) => {
        if (err) {
          console.error('❌ Error querying basic players:', err.message);
        } else {
          console.log(`🔍 Basic player query returned ${rows.length} rows`);
          leaderboardData.mostActive = rows.map(row => ({
            uuid: row.uuid,
            name: row.name,
            playtime: 0,
            sessions: 0,
            kills: { mob: 0, player: 0 },
            deaths: 0,
            afkTime: 0,
            daysActive: 0,
            lastSeen: new Date(row.join_date).toISOString(),
            joinDate: new Date(row.join_date).toISOString()
          }));
        }
        checkComplete();
      });
    }
  } else {
    console.log('⚠️  Skipping Most Active query - missing players table');
    checkComplete();
  }

  // Query 2: Top Killers
  if (tables.players && tables.kills) {
    if (columns.mobKills || columns.playerKills) {
      // Direct aggregated kill data
      const mobKillsCol = columns.mobKills || '0';
      const playerKillsCol = columns.playerKills || '0';
      
      const killersQuery = `
        SELECT 
          p.uuid, p.name, p.registered as join_date,
          ${mobKillsCol !== '0' ? `COALESCE(k.${mobKillsCol}, 0) as mob_kills` : '0 as mob_kills'},
          ${playerKillsCol !== '0' ? `COALESCE(k.${playerKillsCol}, 0) as player_kills` : '0 as player_kills'}
        FROM ${tables.players} p
        LEFT JOIN ${tables.kills} k ON p.uuid = k.uuid
        WHERE ${mobKillsCol !== '0' ? `COALESCE(k.${mobKillsCol}, 0) > 0` : '1=0'}
        ORDER BY ${mobKillsCol !== '0' ? `COALESCE(k.${mobKillsCol}, 0) DESC` : 'p.uuid'}
        LIMIT ?
      `;

      db.all(killersQuery, [CONFIG.limits.topKillers], (err, rows) => {
        if (err) {
          console.error('❌ Error querying top killers:', err.message);
        } else {
          console.log(`🔍 Top Killers query returned ${rows.length} rows`);
          leaderboardData.topKillers = rows.map(row => ({
            uuid: row.uuid,
            name: row.name,
            playtime: 0,
            sessions: 0,
            kills: { mob: row.mob_kills || 0, player: row.player_kills || 0 },
            deaths: 0,
            afkTime: 0,
            daysActive: 0,
            lastSeen: new Date(row.join_date).toISOString(),
            joinDate: new Date(row.join_date).toISOString()
          }));
        }
        checkComplete();
      });
    } else if (columns.killerUuid) {
      // Merge PvP kills with mob kills from sessions for Top Combat leaderboard
      console.log('📊 Aggregating kill data from individual kill records AND session mob kills...');
      
      // First get mob kills from sessions, then PvP kills separately and combine
      const combinedKillsQuery = `
        WITH mob_kills_summary AS (
          SELECT 
            p.uuid, p.name, p.registered as join_date,
            COALESCE(SUM(s.mob_kills), 0) as mob_kills
          FROM ${tables.players} p
          LEFT JOIN ${tables.sessions} s ON p.id = s.${columns.userId}
          GROUP BY p.uuid, p.name, p.registered
        ),
        pvp_kills_summary AS (
          SELECT 
            p.uuid,
            COUNT(k.id) as player_kills
          FROM ${tables.players} p
          LEFT JOIN ${tables.kills} k ON p.uuid = k.${columns.killerUuid}
          GROUP BY p.uuid
        )
        SELECT 
          m.uuid, m.name, m.join_date,
          m.mob_kills,
          COALESCE(pk.player_kills, 0) as player_kills,
          (m.mob_kills + COALESCE(pk.player_kills, 0)) as total_kills
        FROM mob_kills_summary m
        LEFT JOIN pvp_kills_summary pk ON m.uuid = pk.uuid
        WHERE (m.mob_kills + COALESCE(pk.player_kills, 0)) > 0
        ORDER BY total_kills DESC
        LIMIT ?
      `;

      db.all(combinedKillsQuery, [CONFIG.limits.topKillers], (err, rows) => {
        if (err) {
          console.error('❌ Error querying combined kills:', err.message);
        } else {
          console.log(`🔍 Combined kills query returned ${rows.length} rows`);
          leaderboardData.topKillers = rows.map(row => ({
            uuid: row.uuid,
            name: row.name,
            playtime: 0,
            sessions: 0,
            kills: { mob: row.mob_kills || 0, player: row.player_kills || 0 },
            deaths: 0,
            afkTime: 0,
            daysActive: 0,
            lastSeen: new Date(row.join_date).toISOString(),
            joinDate: new Date(row.join_date).toISOString()
          }));
        }
        checkComplete();
      });
    } else {
      console.log('⚠️  Skipping Top Killers query - no kill data columns found');
      checkComplete();
    }
  } else {
    console.log('⚠️  Skipping Top Killers query - missing required tables');
    checkComplete();
  }

  // Query 3: Longest Sessions - works with both summary and individual session tables
  if (tables.players && columns.playtime && columns.sessions) {
    // Summary table approach (plan_sessions_summary)
    const sessionsQuery = `
      SELECT 
        p.uuid, p.name, p.registered as join_date,
        COALESCE(s.${columns.playtime}, 0) as playtime,
        COALESCE(s.${columns.sessions}, 0) as sessions,
        CASE 
          WHEN COALESCE(s.${columns.sessions}, 0) > 0 THEN COALESCE(s.${columns.playtime}, 0) / COALESCE(s.${columns.sessions}, 1)
          ELSE 0 
        END as avg_session_length
      FROM ${tables.players} p
      LEFT JOIN ${tables.sessions} s ON p.uuid = s.uuid
      WHERE COALESCE(s.${columns.sessions}, 0) > 0
      ORDER BY avg_session_length DESC
      LIMIT ?
    `;

    db.all(sessionsQuery, [CONFIG.limits.longestSessions], (err, rows) => {
      if (err) {
        console.error('❌ Error querying longest sessions:', err.message);
      } else {
        console.log(`🔍 Longest Sessions query returned ${rows.length} rows`);
        leaderboardData.longestSessions = rows.map(row => ({
          uuid: row.uuid,
          name: row.name,
          playtime: row.playtime || 0,
          sessions: row.sessions || 0,
          kills: { mob: 0, player: 0 },
          deaths: 0,
          afkTime: 0,
          avgSessionLength: Math.round(row.avg_session_length / 60000) || 0, // Convert to minutes
          lastSeen: new Date(row.join_date).toISOString(),
          joinDate: new Date(row.join_date).toISOString()
        }));
      }
      checkComplete();
    });
  } else if (tables.sessions && columns.sessionStart && columns.sessionEnd && columns.userId) {
    // Individual session records approach (plan_sessions)
    console.log('📊 Calculating longest sessions based on sustained play dedication...');
    const longestSessionsQuery = `
      SELECT 
        p.uuid,
        p.name,
        p.registered as join_date,
        SUM(COALESCE(s.${columns.sessionEnd} - s.${columns.sessionStart}, 0)) as total_playtime,
        COUNT(s.id) as total_sessions,
        MAX(COALESCE(s.${columns.sessionEnd} - s.${columns.sessionStart}, 0)) as longest_single_session,
        SUM(COALESCE(s.afk_time, 0)) as total_afk_time,
        -- Calculate session dedication score (balanced approach)
        CAST(
          -- Longest single session (peak dedication) - 50% weight
          MAX(COALESCE(s.${columns.sessionEnd} - s.${columns.sessionStart}, 0)) * 0.5
          -- Average session length (consistency matters) - 35% weight  
          + AVG(COALESCE(s.${columns.sessionEnd} - s.${columns.sessionStart}, 0)) * 0.35
          -- Recent activity bonus (active in last 14 days) - 15% weight
          + CASE WHEN MAX(s.${columns.sessionEnd}) > (strftime('%s', 'now') - 1209600) * 1000
                 THEN AVG(COALESCE(s.${columns.sessionEnd} - s.${columns.sessionStart}, 0)) * 0.15
                 ELSE 0 END
        AS INTEGER) as dedication_score
      FROM ${tables.players} p
      LEFT JOIN ${tables.sessions} s ON p.id = s.${columns.userId}
      GROUP BY p.uuid, p.name, p.registered
      HAVING total_sessions > 0 AND longest_single_session > 600000
      ORDER BY dedication_score DESC
      LIMIT ?
    `;

    db.all(longestSessionsQuery, [CONFIG.limits.longestSessions], (err, rows) => {
      if (err) {
        console.error('❌ Error querying longest sessions from individual records:', err.message);
      } else {
        console.log(`🔍 Longest Sessions query returned ${rows.length} rows`);
        leaderboardData.longestSessions = rows.map(row => ({
          uuid: row.uuid,
          name: row.name,
          playtime: row.total_playtime || 0,
          sessions: row.total_sessions || 0,
          kills: { mob: 0, player: 0 },
          deaths: 0,
          afkTime: row.total_afk_time || 0,
          avgSessionLength: Math.round((row.total_playtime || 0) / Math.max(1, row.total_sessions) / (60 * 1000)) || 0, // Average session length in minutes
          lastSeen: new Date(row.join_date).toISOString(),
          joinDate: new Date(row.join_date).toISOString()
        }));
      }
      checkComplete();
    });
  } else {
    console.log('⚠️  Skipping Longest Sessions query - missing required tables/columns');
    checkComplete();
  }

  // Query 4: Most Deaths - Extract from sessions table if available
  if (tables.players) {
    if (tables.deaths) {
      // Use dedicated deaths table if available
      const deathsQuery = `
        SELECT 
          p.uuid, p.name, p.registered as join_date,
          COALESCE(d.deaths, 0) as total_deaths
        FROM ${tables.players} p
        LEFT JOIN ${tables.deaths} d ON p.uuid = d.uuid
        WHERE COALESCE(d.deaths, 0) > 0
        ORDER BY total_deaths DESC
        LIMIT ?
      `;

      db.all(deathsQuery, [CONFIG.limits.mostDeaths], (err, rows) => {
        if (err) {
          console.error('❌ Error querying most deaths from deaths table:', err.message);
        } else {
          console.log(`🔍 Most Deaths query returned ${rows.length} rows`);
          leaderboardData.mostDeaths = rows.map(row => ({
            uuid: row.uuid,
            name: row.name,
            playtime: 0,
            sessions: 0,
            kills: { mob: 0, player: 0 },
            deaths: row.total_deaths || 0,
            afkTime: 0,
            daysActive: 0,
            lastSeen: new Date(row.join_date).toISOString(),
            joinDate: new Date(row.join_date).toISOString()
          }));
        }
        checkComplete();
      });
    } else if (tables.sessions && columns.userId) {
      // Extract deaths from sessions table (Legacy PLAN v4)
      console.log('📊 Aggregating death data from session records...');
      const sessionDeathsQuery = `
        SELECT 
          p.uuid,
          p.name,
          p.registered as join_date,
          SUM(COALESCE(s.deaths, 0)) as total_deaths,
          MAX(s.${columns.sessionEnd}) as last_seen
        FROM ${tables.players} p
        LEFT JOIN ${tables.sessions} s ON p.id = s.${columns.userId}
        GROUP BY p.uuid, p.name, p.registered
        HAVING total_deaths > 0
        ORDER BY total_deaths DESC
        LIMIT ?
      `;

      db.all(sessionDeathsQuery, [CONFIG.limits.mostDeaths], (err, rows) => {
        if (err) {
          console.error('❌ Error querying deaths from sessions:', err.message);
        } else {
          console.log(`🔍 Session Deaths query returned ${rows.length} rows`);
          leaderboardData.mostDeaths = rows.map(row => ({
            uuid: row.uuid,
            name: row.name,
            playtime: 0,
            sessions: 0,
            kills: { mob: 0, player: 0 },
            deaths: row.total_deaths || 0,
            afkTime: 0,
            daysActive: 0,
            lastSeen: new Date(row.last_seen || row.join_date).toISOString(),
            joinDate: new Date(row.join_date).toISOString()
          }));
        }
        checkComplete();
      });
    } else {
      console.log('⚠️  Skipping Most Deaths query - no deaths data available');
      checkComplete();
    }
  } else {
    console.log('⚠️  Skipping Most Deaths query - missing required tables');
    checkComplete();
  }

  // Builders leaderboard removed - block data not available in this PLAN setup
}

/**
 * Merge and normalize player data across all leaderboards for consistency
 */
function mergePlayerData(leaderboardData) {
  console.log('🔄 Merging player data across leaderboards for consistency...');
  
  // Create a comprehensive player data map
  const playerMap = new Map();
  
  // Helper function to merge player data intelligently
  function mergePlayer(existing, newData) {
    return {
      uuid: existing.uuid || newData.uuid,
      name: existing.name || newData.name,
      // Use the highest values for cumulative stats
      playtime: Math.max(existing.playtime || 0, newData.playtime || 0),
      sessions: Math.max(existing.sessions || 0, newData.sessions || 0),
      kills: {
        mob: Math.max(existing.kills?.mob || 0, newData.kills?.mob || 0),
        player: Math.max(existing.kills?.player || 0, newData.kills?.player || 0)
      },
      deaths: Math.max(existing.deaths || 0, newData.deaths || 0),
      afkTime: Math.max(existing.afkTime || 0, newData.afkTime || 0),
      // Keep specialized fields where relevant
      avgSessionLength: existing.avgSessionLength || newData.avgSessionLength || 0,
      activityScore: existing.activityScore || newData.activityScore || 0,
      // Use the most recent timestamp
      lastSeen: (existing.lastSeen && new Date(existing.lastSeen) > new Date(newData.lastSeen || 0)) 
                 ? existing.lastSeen : (newData.lastSeen || existing.lastSeen),
      joinDate: (existing.joinDate && new Date(existing.joinDate) < new Date(newData.joinDate || Date.now())) 
                 ? existing.joinDate : (newData.joinDate || existing.joinDate)
    };
  }
  
  // Collect all unique players from all leaderboards
  const allLeaderboards = [
    ...leaderboardData.mostActive,
    ...leaderboardData.topKillers, 
    ...leaderboardData.longestSessions,
    ...leaderboardData.mostDeaths
  ];
  
  // Build comprehensive player map
  allLeaderboards.forEach(player => {
    if (playerMap.has(player.uuid)) {
      playerMap.set(player.uuid, mergePlayer(playerMap.get(player.uuid), player));
    } else {
      playerMap.set(player.uuid, { ...player });
    }
  });
  
  // Update each leaderboard with complete player data while preserving ranking
  leaderboardData.mostActive = leaderboardData.mostActive.map(player => 
    ({ ...playerMap.get(player.uuid), activityScore: player.activityScore }));
  
  leaderboardData.topKillers = leaderboardData.topKillers.map(player => 
    playerMap.get(player.uuid));
    
  leaderboardData.longestSessions = leaderboardData.longestSessions.map(player => 
    ({ ...playerMap.get(player.uuid), avgSessionLength: player.avgSessionLength }));
    
  leaderboardData.mostDeaths = leaderboardData.mostDeaths.map(player => 
    playerMap.get(player.uuid));
  
  console.log(`✅ Merged data for ${playerMap.size} unique players across all leaderboards`);
}

/**
 * Run queries with detected table scheme
 */
function runQueriesWithScheme(db, scheme, leaderboardData, resolve, reject) {
  let completed = 0;
  const queries = 4; // Reduced to 4 queries (removed builders)

  function checkComplete() {
    completed++;
    if (completed === queries) {
      db.close();
      
      // Merge player data for consistency across leaderboards
      mergePlayerData(leaderboardData);
      
      console.log('📊 Final leaderboard summary:');
      console.log(`   - Most Active: ${leaderboardData.mostActive.length} players`);
      console.log(`   - Top Killers: ${leaderboardData.topKillers.length} players`);
      console.log(`   - Longest Sessions: ${leaderboardData.longestSessions.length} players`);
      console.log(`   - Most Deaths: ${leaderboardData.mostDeaths.length} players`);
      resolve(leaderboardData);
    }
  }

  // Build dynamic queries based on available tables
  const tables = scheme.tables;
  
  // Detect column structure for key tables
  detectColumnStructure(db, tables, (columnMapping) => {
    console.log('🔧 Detected column mapping:', JSON.stringify(columnMapping, null, 2));
    runQueriesWithColumns(db, tables, columnMapping, leaderboardData, scheme, checkComplete);
  });
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
      mostDeaths: [],
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
    console.log(`   - Most Deaths: ${leaderboardData.mostDeaths.length} players`);
    
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