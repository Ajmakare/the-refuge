#!/usr/bin/env node

// Simple script to look up player UUIDs by username
// Usage: node lookup-uuid.js <username>

const { CONFIG, lookupPlayerUUID } = require('./sync-plan-data.js');

async function main() {
  const username = process.argv[2];
  
  if (!username) {
    console.log('Usage: node lookup-uuid.js <username>');
    console.log('Example: node lookup-uuid.js Kage45');
    process.exit(1);
  }
  
  console.log(`🔍 Looking up UUID for player: ${username}`);
  
  try {
    const result = await lookupPlayerUUID(username);
    
    if (result) {
      console.log(`\n✅ Player found:`);
      console.log(`   Name: ${result.name}`);
      console.log(`   UUID: ${result.uuid}`);
      console.log(`\n📋 Add this UUID to banned-players.txt:`);
      console.log(`   ${result.uuid}`);
    } else {
      console.log(`\n❌ Player "${username}" not found in the database.`);
      console.log(`💡 Make sure the player has joined the server and the database is synced.`);
    }
  } catch (error) {
    console.error('❌ Error looking up player:', error.message);
  }
}

main();