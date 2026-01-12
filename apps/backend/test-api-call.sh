#!/bin/bash

echo "============================================================"
echo "🌐 TESTING DASHBOARD API ENDPOINT"
echo "============================================================"
echo ""

# Get the first user's session/auth token (you'll need to replace this)
echo "⚠️  Note: This requires authentication"
echo "   You need to be logged in to test the endpoint"
echo ""

# Test 1: Check if server is running
echo "1️⃣  Checking if backend server is running..."
if curl -s http://localhost:5001/api/health > /dev/null 2>&1; then
    echo "   ✅ Server is running on port 5001"
else
    echo "   ❌ Server not responding on port 5001"
    echo "   💡 Start the server with: yarn dev"
    exit 1
fi

echo ""
echo "2️⃣  Test dashboard endpoint (requires auth)..."
echo "   Endpoint: GET http://localhost:5001/api/odoo/dashboard"
echo ""

# This will fail without auth, but shows the endpoint structure
RESPONSE=$(curl -s http://localhost:5001/api/odoo/dashboard 2>&1)
echo "   Response:"
echo "$RESPONSE" | python3 -m json.tool 2>&1 | head -20

echo ""
echo "============================================================"
echo "💡 TO TEST WITH AUTHENTICATION:"
echo "============================================================"
echo "1. Log in via the frontend (http://localhost:3001)"
echo "2. Open browser DevTools > Application > Cookies"
echo "3. Copy the session cookie value"
echo "4. Run:"
echo '   curl -H "Cookie: session=YOUR_SESSION_HERE" \\'
echo '        http://localhost:5001/api/odoo/dashboard'
echo ""
