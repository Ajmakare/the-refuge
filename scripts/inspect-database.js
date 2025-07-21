#!/usr/bin/env node

/**
 * Inspect PLAN database structure and contents
 */

const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const dbPath = './temp/Plan.db';

if (!fs.existsSync(dbPath)) {
  console.log(`❌ Database file not found at: ${dbPath}`);
  console.log('💡 Run npm run sync first to download the database');
  process.exit(1);
}

console.log('🔍 PLAN Database Inspector');
console.log('========================');

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('❌ Failed to open database:', err.message);
    process.exit(1);
  }
  console.log('✅ Database opened successfully');
});

// Get all tables
db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", [], (err, tables) => {
  if (err) {
    console.error('❌ Error listing tables:', err.message);
    return;
  }
  
  console.log(`\n📋 Found ${tables.length} tables:`);
  tables.forEach(table => {
    console.log(`   - ${table.name}`);
  });
  
  // Look for PLAN-specific tables
  const planTables = tables.filter(t => t.name.toLowerCase().includes('plan'));
  console.log(`\n✅ PLAN tables (${planTables.length}):`);
  planTables.forEach(table => {
    console.log(`   - ${table.name}`);
  });
  
  // Check key tables we expect
  const expectedTables = ['plan_players', 'plan_sessions', 'plan_kills', 'plan_deaths', 'plan_actions'];
  const foundExpected = expectedTables.filter(expected => 
    tables.some(table => table.name === expected)
  );
  
  console.log(`\n🎯 Expected tables found (${foundExpected.length}/${expectedTables.length}):`);
  expectedTables.forEach(expected => {
    const found = tables.some(table => table.name === expected);
    console.log(`   ${found ? '✅' : '❌'} ${expected}`);
  });
  
  // If we have plan_players, show sample data
  if (tables.some(t => t.name === 'plan_players')) {
    console.log('\n👥 Sample player data:');
    db.all("SELECT * FROM plan_players LIMIT 5", [], (err, players) => {
      if (err) {
        console.log('❌ Error reading players:', err.message);
      } else {
        console.log(`   Found ${players.length} players (showing first 5):`);
        players.forEach((player, i) => {
          console.log(`   ${i + 1}. ${player.name || player.player_name || 'Unknown'} (${player.uuid})`);
        });
        
        if (players.length === 0) {
          console.log('   ⚠️  No players found - database might be empty or new');
        }
      }
      
      // Check sessions table
      if (tables.some(t => t.name === 'plan_sessions' || t.name === 'plan_sessions_summary')) {
        const sessionTable = tables.find(t => t.name === 'plan_sessions' || t.name === 'plan_sessions_summary').name;
        console.log(`\n⏱️  Session data from ${sessionTable}:`);
        
        db.all(`SELECT COUNT(*) as count FROM ${sessionTable}`, [], (err, result) => {
          if (err) {
            console.log('❌ Error reading sessions:', err.message);
          } else {
            console.log(`   Total sessions: ${result[0].count}`);
          }
          
          // Close database
          db.close(() => {
            console.log('\n🏁 Database inspection complete');
            
            if (foundExpected.length < expectedTables.length) {
              console.log('\n💡 Troubleshooting tips:');
              console.log('1. PLAN plugin might be using different table names');
              console.log('2. Database might be from a different PLAN version');
              console.log('3. Server might be new with no player data yet');
              console.log('4. Check PLAN plugin configuration and data collection');
            }
          });
        });
      } else {
        db.close(() => {
          console.log('\n🏁 Database inspection complete');
        });
      }
    });
  } else {
    db.close(() => {
      console.log('\n❌ No plan_players table found');
      console.log('💡 This suggests either:');
      console.log('1. Wrong database file');
      console.log('2. PLAN plugin not properly installed');
      console.log('3. Different table naming convention');
    });
  }
});