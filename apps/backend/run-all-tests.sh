#!/bin/bash

# Master Test Script for Odoo Sync Engine v2
# This script runs all test phases in sequence

set -e  # Exit on error

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║        Odoo Sync Engine v2 - Complete Test Suite           ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test configuration
SYNC_RANGE_DAYS=3

echo -e "${BLUE}Test Configuration:${NC}"
echo "  - Sync range: Last ${SYNC_RANGE_DAYS} days"
echo "  - User ID: aYPEyMA39LdyTktykmiQ0mkNh523"
echo "  - Odoo URL: http://localhost:8069"
echo ""

# Phase 1: Read Odoo Records
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Phase 1: Reading Odoo Records${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

node test-odoo-records.js
if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✓ Phase 1 completed successfully${NC}\n"
else
    echo -e "\n${RED}✗ Phase 1 failed${NC}\n"
    exit 1
fi

echo "Press Enter to continue to Phase 2..."
read

# Phase 2: Trigger Sync
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Phase 2: Triggering Sync Process${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

npx tsx test-trigger-sync.js
if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✓ Phase 2 completed successfully${NC}\n"
else
    echo -e "\n${RED}✗ Phase 2 failed${NC}\n"
    exit 1
fi

echo "Press Enter to continue to Phase 3..."
read

# Phase 3: Verify Records
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Phase 3: Verifying Synced Records${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

npx tsx test-verify-records.js
if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✓ Phase 3 completed successfully${NC}\n"
else
    echo -e "\n${RED}✗ Phase 3 failed${NC}\n"
    exit 1
fi

# Final Summary
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                     TEST SUITE COMPLETE                      ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}✓ All phases completed successfully!${NC}"
echo ""
echo "Summary:"
echo "  1. ✓ Odoo records verified"
echo "  2. ✓ Sync process completed"
echo "  3. ✓ MongoDB records validated"
echo ""
echo "Next steps:"
echo "  - Review the output above for any warnings"
echo "  - Check MongoDB for detailed record data"
echo "  - Test with larger time ranges if needed"
echo ""
