#!/bin/bash

# GGServers Environment Setup Helper
echo "🔧 GGServers Connection Setup"
echo "============================"

# Get user input
echo -n "Enter your GGServers hostname (e.g., yourserver.ggservers.com): "
read hostname

echo -n "Enter your FTP username: "
read username

echo -n "Enter your FTP password: "
read -s password
echo

echo -n "Enter FTP port (21 for FTP, 22 for SFTP) [21]: "
read port
port=${port:-21}

# Create .env.local file
cat > ../.env.local << EOF
# GGServers Connection Details
GGSERVERS_HOST=$hostname
GGSERVERS_USERNAME=$username
GGSERVERS_PASSWORD=$password
GGSERVERS_PORT=$port
EOF

echo "✅ Created .env.local file"
echo ""
echo "🧪 Testing connection..."

# Test the connection
export GGSERVERS_HOST=$hostname
export GGSERVERS_USERNAME=$username
export GGSERVERS_PASSWORD=$password
export GGSERVERS_PORT=$port

node test-connection.js

echo ""
echo "🚀 Ready to sync! Run:"
echo "   npm run sync"