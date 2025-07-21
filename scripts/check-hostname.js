#!/usr/bin/env node

/**
 * Quick hostname checker for GGServers
 */

const dns = require('dns');

const hostname = process.argv[2];

if (!hostname) {
  console.log('Usage: node check-hostname.js <hostname>');
  console.log('Example: node check-hostname.js yourserver.ggservers.com');
  process.exit(1);
}

console.log(`🔍 Testing hostname: ${hostname}`);

// Test the hostname
dns.resolve4(hostname, (err, addresses) => {
  if (err) {
    console.log(`❌ Failed: ${err.message}`);
    
    // Try alternatives
    const alternatives = [
      hostname.replace(/^https?:\/\//, ''),
      hostname.replace('.ggservers.com', '') + '.ggservers.com',
      hostname + '.ggservers.com',
      'mc-' + hostname.replace(/^mc-/, '').replace('.ggservers.com', '') + '.ggservers.com'
    ];
    
    console.log('\n🔍 Trying alternatives...');
    
    alternatives.forEach((alt, i) => {
      if (alt === hostname) return;
      
      setTimeout(() => {
        dns.resolve4(alt, (err2, addresses2) => {
          if (err2) {
            console.log(`❌ ${alt} - ${err2.message}`);
          } else {
            console.log(`✅ ${alt} - WORKS! (${addresses2[0]})`);
          }
        });
      }, i * 100);
    });
    
  } else {
    console.log(`✅ Success! Resolved to: ${addresses[0]}`);
  }
});