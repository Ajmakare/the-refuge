#!/usr/bin/env node

/**
 * Inspect PLAN database column structure
 */

const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const dbPath = './temp/Plan.db';

if (!fs.existsSync(dbPath)) {
  console.log(`❌ Database file not found at: ${dbPath}`);
  console.log('💡 Run npm run sync first to download the database');
  process.exit(1);
}

console.log('🔍 PLAN Database Column Inspector');
console.log('=================================');

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('❌ Failed to open database:', err.message);
    process.exit(1);
  }
  console.log('✅ Database opened successfully');
});

// Get table structure for key tables found in your database
const keyTables = ['plan_users', 'plan_user_info', 'plan_sessions', 'plan_kills', 'plan_servers', 'plan_worlds'];

let tablesChecked = 0;
const totalTables = keyTables.length;

keyTables.forEach(tableName => {
  db.all(`PRAGMA table_info(${tableName})`, [], (err, columns) => {
    tablesChecked++;
    
    if (err) {
      console.log(`\n❌ Table ${tableName}: Not found or error`);
    } else if (columns.length === 0) {
      console.log(`\n⚠️  Table ${tableName}: Not found`);
    } else {
      console.log(`\n✅ Table ${tableName} columns:`);
      columns.forEach(col => {
        console.log(`   - ${col.name} (${col.type})`);
      });
      
      // Show sample data for key tables
      if (['plan_users', 'plan_user_info', 'plan_sessions', 'plan_kills'].includes(tableName)) {
        db.all(`SELECT * FROM ${tableName} LIMIT 2`, [], (err, sample) => {
          if (!err && sample.length > 0) {
            console.log(`   📋 Sample data (${sample.length} rows):`);
            sample.forEach((row, i) => {
              console.log(`     ${i + 1}. ${JSON.stringify(row)}`);
            });
          } else if (!err) {
            console.log(`   📋 Table is empty`);
          }
        });
      }
    }
    
    if (tablesChecked === totalTables) {
      db.close(() => {
        console.log('\n🏁 Column inspection complete');
      });
    }
  });
});