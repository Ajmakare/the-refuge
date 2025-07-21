#!/usr/bin/env node

/**
 * Test GGServers connection and diagnose issues
 */

const dns = require('dns');
const net = require('net');

// Get config from environment or prompt
const CONFIG = {
  host: process.env.GGSERVERS_HOST || process.argv[2],
  username: process.env.GGSERVERS_USERNAME || process.argv[3],
  password: process.env.GGSERVERS_PASSWORD || process.argv[4],
  port: parseInt(process.env.GGSERVERS_PORT || process.argv[5] || '21'),
};

async function testConnection() {
  console.log('🔍 GGServers Connection Diagnostic Tool');
  console.log('=====================================');
  
  if (!CONFIG.host) {
    console.log('❌ No hostname provided');
    console.log('Usage: node test-connection.js <hostname> [username] [password] [port]');
    console.log('   or: GGSERVERS_HOST=host npm run test-connection');
    process.exit(1);
  }
  
  console.log(`🎯 Testing connection to: ${CONFIG.host}:${CONFIG.port}`);
  console.log(`👤 Username: ${CONFIG.username || 'Not provided'}`);
  
  // Test 1: DNS Resolution
  console.log('\n1️⃣ Testing DNS resolution...');
  try {
    const addresses = await new Promise((resolve, reject) => {
      dns.resolve4(CONFIG.host, (err, addresses) => {
        if (err) reject(err);
        else resolve(addresses);
      });
    });
    console.log(`✅ DNS resolved to: ${addresses.join(', ')}`);
  } catch (dnsError) {
    console.log(`❌ DNS resolution failed: ${dnsError.message}`);
    
    // Try common GGServers hostname patterns
    const suggestions = [
      CONFIG.host.replace(/^https?:\/\//, ''),
      CONFIG.host + '.ggservers.com',
      CONFIG.host.replace('.ggservers.com.ggservers.com', '.ggservers.com'),
    ];
    
    console.log('💡 Trying alternative hostnames:');
    for (const suggestion of suggestions) {
      try {
        const addresses = await new Promise((resolve, reject) => {
          dns.resolve4(suggestion, (err, addresses) => {
            if (err) reject(err);
            else resolve(addresses);
          });
        });
        console.log(`✅ Alternative hostname works: ${suggestion} → ${addresses[0]}`);
        break;
      } catch (e) {
        console.log(`❌ ${suggestion} also failed`);
      }
    }
    return;
  }
  
  // Test 2: Port connectivity
  console.log(`\n2️⃣ Testing port ${CONFIG.port} connectivity...`);
  try {
    await new Promise((resolve, reject) => {
      const socket = new net.Socket();
      socket.setTimeout(10000);
      
      socket.on('connect', () => {
        console.log(`✅ Port ${CONFIG.port} is open and accepting connections`);
        socket.destroy();
        resolve();
      });
      
      socket.on('timeout', () => {
        socket.destroy();
        reject(new Error('Connection timeout'));
      });
      
      socket.on('error', (err) => {
        reject(err);
      });
      
      socket.connect(CONFIG.port, CONFIG.host);
    });
  } catch (portError) {
    console.log(`❌ Port connectivity failed: ${portError.message}`);
    
    // Test common alternatives
    const altPorts = CONFIG.port === 21 ? [22, 2121, 8021] : [21, 2121, 8021];
    console.log('💡 Trying alternative ports:');
    
    for (const altPort of altPorts) {
      try {
        await new Promise((resolve, reject) => {
          const socket = new net.Socket();
          socket.setTimeout(5000);
          
          socket.on('connect', () => {
            console.log(`✅ Port ${altPort} is accessible`);
            socket.destroy();
            resolve();
          });
          
          socket.on('timeout', () => {
            socket.destroy();
            reject(new Error('timeout'));
          });
          
          socket.on('error', reject);
          
          socket.connect(altPort, CONFIG.host);
        });
        break;
      } catch (e) {
        console.log(`❌ Port ${altPort} failed`);
      }
    }
    return;
  }
  
  // Test 3: FTP Connection (if credentials provided)
  if (CONFIG.username && CONFIG.password) {
    console.log('\n3️⃣ Testing FTP authentication...');
    try {
      const Client = require('ftp');
      const client = new Client();
      
      await new Promise((resolve, reject) => {
        client.on('ready', () => {
          console.log('✅ FTP authentication successful');
          
          // Test directory listing
          client.list('/', (err, list) => {
            if (err) {
              console.log('⚠️  Could not list root directory:', err.message);
            } else {
              console.log(`📂 Root directory has ${list.length} items`);
              const dirs = list.filter(item => item.type === 'd').map(item => item.name);
              console.log('📁 Directories found:', dirs.slice(0, 10).join(', '));
              
              // Look for plugins directory
              if (dirs.includes('plugins')) {
                console.log('✅ Found plugins directory - PLAN database should be accessible');
              } else {
                console.log('⚠️  No plugins directory found - server might use different structure');
              }
            }
            
            client.end();
            resolve();
          });
        });
        
        client.on('error', reject);
        
        client.connect({
          host: CONFIG.host,
          port: CONFIG.port,
          user: CONFIG.username,
          password: CONFIG.password,
          connTimeout: 10000
        });
      });
      
    } catch (ftpError) {
      console.log(`❌ FTP connection failed: ${ftpError.message}`);
      
      if (ftpError.message.includes('530')) {
        console.log('💡 This looks like an authentication error - check username/password');
      } else if (ftpError.message.includes('timeout')) {
        console.log('💡 Connection timeout - server might not support FTP or firewall blocking');
      }
    }
  } else {
    console.log('\n3️⃣ Skipping FTP test (no credentials provided)');
  }
  
  console.log('\n🎉 Connection test completed');
  console.log('\n💡 Next steps:');
  console.log('- If DNS failed: Check hostname spelling');
  console.log('- If port failed: Contact GGServers support about FTP access');
  console.log('- If FTP failed: Verify credentials in GGServers control panel');
}

// Run the test
testConnection().catch(console.error);