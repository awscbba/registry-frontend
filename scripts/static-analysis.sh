#!/bin/bash

# People Register Frontend - Comprehensive Static Analysis
# This script runs all static code analysis tools and generates a report

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# Function to run a check and track results
run_check() {
    local name="$1"
    local command="$2"
    
    echo -e "${BLUE}🔍 Running: $name${NC}"
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if eval "$command" > /tmp/check_output 2>&1; then
        echo -e "${GREEN}✅ $name: PASSED${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${RED}❌ $name: FAILED${NC}"
        echo -e "${YELLOW}Output:${NC}"
        cat /tmp/check_output | head -20
        echo ""
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
    echo ""
}

# Header
echo -e "${BLUE}🔍 People Register Frontend - Static Code Analysis${NC}"
echo "=================================================="
echo "📅 Time: $(date)"
echo "📁 Directory: $(pwd)"
echo ""

# Check if Node.js is available
if ! command -v node >/dev/null 2>&1; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js first.${NC}"
    exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
    echo -e "${RED}❌ npm not found. Please install npm first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js: $(node --version)${NC}"
echo -e "${GREEN}✅ npm: $(npm --version)${NC}"
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
    echo ""
fi

# Run static analysis checks
echo -e "${BLUE}🔍 Starting Static Analysis Checks${NC}"
echo "=================================="
echo ""

# 1. ESLint
run_check "ESLint Analysis" "npm run lint:check"

# 2. TypeScript Type Checking
run_check "TypeScript Type Check" "npm run type-check"

# 3. Prettier Formatting
run_check "Code Formatting Check" "npm run format:check"

# 4. Security Audit
run_check "Security Audit" "npm audit --audit-level=moderate"

# 5. Dependency Check
run_check "Dependency Freshness" "npm outdated --depth=0"

# 6. Build Test
run_check "Build Verification" "npm run build"

# Generate summary report
echo -e "${BLUE}📊 Analysis Summary${NC}"
echo "=================="
echo "Total Checks: $TOTAL_CHECKS"
echo -e "Passed: ${GREEN}$PASSED_CHECKS${NC}"
echo -e "Failed: ${RED}$FAILED_CHECKS${NC}"
echo ""

if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "${GREEN}🎉 All checks passed! Code quality is excellent.${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️ Some checks failed. Review the output above.${NC}"
    echo ""
    echo -e "${BLUE}💡 Quick fixes:${NC}"
    echo "  - Run 'npm run lint' to auto-fix ESLint issues"
    echo "  - Run 'npm run format' to auto-format code"
    echo "  - Run 'npm audit fix' to fix security issues"
    echo "  - Run 'npm update' to update dependencies"
    exit 1
fi
