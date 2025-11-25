#!/bin/bash

# Quick Test - Run individual test phases
# Usage: ./quick-test.sh [odoo|sync|verify|all]

set -e

PHASE=${1:-all}

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

cd "$(dirname "$0")"

case "$PHASE" in
    odoo)
        echo -e "${BLUE}Testing Odoo Connection & Records...${NC}"
        node test-odoo-records.js
        ;;
    sync)
        echo -e "${BLUE}Triggering Sync Process...${NC}"
        npx tsx test-trigger-sync.js
        ;;
    verify)
        echo -e "${BLUE}Verifying Synced Records...${NC}"
        npx tsx test-verify-records.js
        ;;
    all)
        echo -e "${BLUE}Running all tests...${NC}\n"
        
        echo -e "${GREEN}[1/3] Testing Odoo...${NC}"
        node test-odoo-records.js
        
        echo -e "\n${GREEN}[2/3] Triggering Sync...${NC}"
        npx tsx test-trigger-sync.js
        
        echo -e "\n${GREEN}[3/3] Verifying Records...${NC}"
        npx tsx test-verify-records.js
        
        echo -e "\n${GREEN}✓ All tests completed!${NC}"
        ;;
    *)
        echo "Usage: ./quick-test.sh [odoo|sync|verify|all]"
        echo ""
        echo "  odoo   - Test Odoo connection and count records"
        echo "  sync   - Trigger sync process"
        echo "  verify - Verify synced records in MongoDB"
        echo "  all    - Run all tests (default)"
        exit 1
        ;;
esac
