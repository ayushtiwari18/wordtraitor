#!/bin/bash

# Setup Script for Scaled Testing (100-User Capacity)
# This script prepares your environment for running scaled Cypress tests

set -e  # Exit on error

echo "=========================================="
echo "🚀 WordTraitor - Scaled Testing Setup"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${RED}❌ .env.local not found!${NC}"
    echo ""
    echo "Creating .env.local template..."
    cat > .env.local << EOF
VITE_SUPABASE_URL=https://ytytsdilcwxlzdstxhgo.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
EOF
    echo -e "${GREEN}✅ .env.local template created${NC}"
    echo ""
    echo -e "${YELLOW}Please edit .env.local and add your Supabase credentials${NC}"
    exit 1
fi

echo "✅ Found .env.local"

# Load environment variables
export $(cat .env.local | grep -v '^#' | xargs)

# Check for required environment variables
if [ -z "$VITE_SUPABASE_URL" ]; then
    echo -e "${RED}❌ VITE_SUPABASE_URL not set in .env.local${NC}"
    exit 1
fi

if [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo -e "${RED}❌ VITE_SUPABASE_ANON_KEY not set in .env.local${NC}"
    exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${YELLOW}⚠️  SUPABASE_SERVICE_ROLE_KEY not set in .env.local${NC}"
    echo "This is required for scaled testing (mocking players and phases)."
    echo ""
    echo "To get your service role key:"
    echo "1. Go to https://supabase.com/dashboard"
    echo "2. Select your project"
    echo "3. Go to Settings > API"
    echo "4. Copy the 'service_role' key (NOT the anon key)"
    echo ""
    exit 1
fi

echo "✅ Environment variables loaded"

# Test Supabase connection
echo ""
echo "Testing Supabase connection..."
response=$(curl -s -o /dev/null -w "%{http_code}" "$VITE_SUPABASE_URL/rest/v1/" \
  -H "apikey: $VITE_SUPABASE_ANON_KEY")

if [ "$response" = "200" ]; then
    echo -e "${GREEN}✅ Supabase connection successful${NC}"
else
    echo -e "${RED}❌ Supabase connection failed (HTTP $response)${NC}"
    echo "Please check your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo ""
    echo "Installing dependencies..."
    npm install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo "✅ Dependencies already installed"
fi

# Check if Cypress is installed
if ! command -v npx cypress &> /dev/null; then
    echo -e "${RED}❌ Cypress not found${NC}"
    echo "Installing Cypress..."
    npm install --save-dev cypress
    echo -e "${GREEN}✅ Cypress installed${NC}"
else
    echo "✅ Cypress found"
fi

# Create cypress directories if they don't exist
mkdir -p cypress/e2e
mkdir -p cypress/support
mkdir -p cypress/videos
mkdir -p cypress/screenshots

echo "✅ Cypress directories ready"

echo ""
echo "=========================================="
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Start the dev server:"
echo "   ${YELLOW}npm run dev${NC}"
echo ""
echo "2. In another terminal, run scaled tests:"
echo "   ${YELLOW}npx cypress run --spec 'cypress/e2e/07-game-mechanics-scaled.cy.js'${NC}"
echo ""
echo "3. Or open Cypress UI:"
echo "   ${YELLOW}npx cypress open${NC}"
echo ""
echo "Documentation:"
echo "- SCALED_TESTING.md  - Scaled testing guide"
echo "- CYPRESS_FIXES.md   - Original test fixes"
echo ""
echo -e "${GREEN}Happy testing! 🎉${NC}"
echo ""
