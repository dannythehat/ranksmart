#!/bin/bash

# Day 5 Verification Script
# Automates basic verification checks before moving to Day 6

set -e

echo "🔍 Day 5 Verification Script"
echo "=============================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Function to print colored output
print_status() {
    if [ "$1" = "PASS" ]; then
        echo -e "${GREEN}✅ $2${NC}"
        ((PASSED++))
    elif [ "$1" = "FAIL" ]; then
        echo -e "${RED}❌ $2${NC}"
        ((FAILED++))
    elif [ "$1" = "WARN" ]; then
        echo -e "${YELLOW}⚠️  $2${NC}"
        ((WARNINGS++))
    else
        echo -e "${BLUE}ℹ️  $2${NC}"
    fi
}

echo "1️⃣ Checking Environment Setup"
echo "------------------------------"

# Check if .env file exists
if [ -f ".env" ]; then
    print_status "PASS" ".env file exists"
    
    # Check for required keys
    if grep -q "OPENAI_API_KEY=" .env && ! grep -q "OPENAI_API_KEY=your_" .env; then
        print_status "PASS" "OPENAI_API_KEY is configured"
    else
        print_status "FAIL" "OPENAI_API_KEY is missing or not configured"
    fi
    
    if grep -q "FIRECRAWL_API_KEY=" .env && ! grep -q "FIRECRAWL_API_KEY=your_" .env; then
        print_status "PASS" "FIRECRAWL_API_KEY is configured"
    else
        print_status "FAIL" "FIRECRAWL_API_KEY is missing or not configured"
    fi
    
    if grep -q "SUPABASE_URL=" .env && ! grep -q "SUPABASE_URL=your_" .env; then
        print_status "PASS" "SUPABASE_URL is configured"
    else
        print_status "WARN" "SUPABASE_URL is missing (optional for basic testing)"
    fi
else
    print_status "FAIL" ".env file not found"
    echo "   Run: cp .env.example .env"
fi

echo ""
echo "2️⃣ Checking Dependencies"
echo "-------------------------"

# Check if node_modules exists
if [ -d "node_modules" ]; then
    print_status "PASS" "node_modules directory exists"
else
    print_status "FAIL" "node_modules not found"
    echo "   Run: npm install"
fi

# Check for required packages
if [ -f "package.json" ]; then
    print_status "PASS" "package.json exists"
    
    # Check for key dependencies
    if grep -q "@mendable/firecrawl-js" package.json; then
        print_status "PASS" "Firecrawl package listed"
    else
        print_status "FAIL" "Firecrawl package missing"
    fi
    
    if grep -q "openai" package.json; then
        print_status "PASS" "OpenAI package listed"
    else
        print_status "FAIL" "OpenAI package missing"
    fi
    
    if grep -q "@supabase/supabase-js" package.json; then
        print_status "PASS" "Supabase package listed"
    else
        print_status "WARN" "Supabase package missing (optional)"
    fi
else
    print_status "FAIL" "package.json not found"
fi

echo ""
echo "3️⃣ Checking File Structure"
echo "---------------------------"

# Check for required API files
required_files=(
    "api/audit/scan.js"
    "api/audit/firecrawl.js"
    "api/audit/eeat-scorer.js"
    "api/audit/technical-seo.js"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        print_status "PASS" "$file exists"
    else
        print_status "FAIL" "$file is missing"
    fi
done

# Check for test files
test_files=(
    "tests/01-firecrawl-test.js"
    "tests/02-eeat-scorer-test.js"
    "tests/03-technical-seo-test.js"
    "tests/04-integration-test.js"
    "tests/run-day5-tests.js"
)

for file in "${test_files[@]}"; do
    if [ -f "$file" ]; then
        print_status "PASS" "$file exists"
    else
        print_status "FAIL" "$file is missing"
    fi
done

# Check for frontend files
frontend_files=(
    "public/index.html"
    "public/new-audit.html"
    "public/dashboard.html"
    "public/css/main.css"
)

for file in "${frontend_files[@]}"; do
    if [ -f "$file" ]; then
        print_status "PASS" "$file exists"
    else
        print_status "FAIL" "$file is missing"
    fi
done

echo ""
echo "4️⃣ Running Test Suite"
echo "----------------------"

# Run the Day 5 tests
if command -v npm &> /dev/null; then
    print_status "INFO" "Running npm run test:day5..."
    echo ""
    
    if npm run test:day5; then
        print_status "PASS" "All tests passed"
    else
        print_status "FAIL" "Some tests failed"
        echo "   Check test output above for details"
    fi
else
    print_status "FAIL" "npm command not found"
fi

echo ""
echo "5️⃣ Checking Deployment Configuration"
echo "--------------------------------------"

# Check vercel.json
if [ -f "vercel.json" ]; then
    print_status "PASS" "vercel.json exists"
    
    if grep -q "api/audit/scan" vercel.json; then
        print_status "PASS" "API routes configured"
    else
        print_status "WARN" "API routes may not be configured"
    fi
else
    print_status "WARN" "vercel.json not found (may not be using Vercel)"
fi

echo ""
echo "=============================="
echo "📊 Verification Summary"
echo "=============================="
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"
echo -e "${YELLOW}⚠️  Warnings: $WARNINGS${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 Day 5 verification PASSED!${NC}"
    echo "✅ You can proceed to Day 6"
    echo ""
    echo "Next steps:"
    echo "  1. Review test results above"
    echo "  2. Test live deployment at https://ranksmart.vercel.app/"
    echo "  3. Complete manual verification checklist in Issue #37"
    echo "  4. Proceed to Day 6 implementation"
    exit 0
else
    echo -e "${RED}⚠️  Day 5 verification FAILED${NC}"
    echo "❌ Fix the issues above before proceeding to Day 6"
    echo ""
    echo "Common fixes:"
    echo "  - Missing .env: cp .env.example .env"
    echo "  - Missing dependencies: npm install"
    echo "  - Test failures: Check API keys in .env"
    exit 1
fi
