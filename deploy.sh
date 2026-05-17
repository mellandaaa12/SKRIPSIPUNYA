#!/bin/bash

# 🚀 Deploy Supabase Function - EduLearn LMS
# This script deploys the backend function to Supabase

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project configuration
PROJECT_REF="tjfmwixttmrayvhqhena"
FUNCTION_NAME="server"

echo ""
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}  🚀 EduLearn LMS - Function Deployment${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found!${NC}"
    echo ""
    echo "Please install Supabase CLI:"
    echo ""
    echo "  macOS/Linux:"
    echo "    brew install supabase/tap/supabase"
    echo ""
    echo "  Windows:"
    echo "    scoop install supabase"
    echo ""
    echo "  npm (all platforms):"
    echo "    npm install -g supabase"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Supabase CLI found${NC}"
echo ""

# Check if logged in
if ! supabase projects list &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Supabase${NC}"
    echo ""
    echo "Logging in..."
    supabase login
    echo ""
fi

echo -e "${GREEN}✅ Logged in to Supabase${NC}"
echo ""

# Link project if not already linked
echo -e "${BLUE}🔗 Linking to project...${NC}"
if ! supabase link --project-ref "$PROJECT_REF" 2>&1 | grep -q "already linked"; then
    echo -e "${GREEN}✅ Project linked${NC}"
else
    echo -e "${GREEN}✅ Project already linked${NC}"
fi
echo ""

# Check function exists
if [ ! -d "supabase/functions/$FUNCTION_NAME" ]; then
    echo -e "${RED}❌ Function directory not found: supabase/functions/$FUNCTION_NAME${NC}"
    echo ""
    echo "Please make sure the function exists at:"
    echo "  supabase/functions/$FUNCTION_NAME/index.tsx"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Function directory found${NC}"
echo ""

# Deploy function
echo -e "${BLUE}📦 Deploying function '$FUNCTION_NAME'...${NC}"
echo ""

if supabase functions deploy "$FUNCTION_NAME" --project-ref "$PROJECT_REF" --no-verify-jwt; then
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════${NC}"
    echo -e "${GREEN}  ✅ DEPLOYMENT SUCCESSFUL!${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════${NC}"
    echo ""
    echo -e "${BLUE}Function URL:${NC}"
    echo "  https://$PROJECT_REF.supabase.co/functions/v1/$FUNCTION_NAME"
    echo ""
    echo -e "${BLUE}Health Check:${NC}"
    echo "  curl https://$PROJECT_REF.supabase.co/functions/v1/$FUNCTION_NAME/health"
    echo ""
    echo -e "${BLUE}Next Steps:${NC}"
    echo "  1. Test health endpoint"
    echo "  2. Bootstrap admin account"
    echo "  3. Test login"
    echo ""
    
    # Test health endpoint
    echo -e "${BLUE}🧪 Testing health endpoint...${NC}"
    sleep 2
    
    if curl -s "https://$PROJECT_REF.supabase.co/functions/v1/$FUNCTION_NAME/health" | grep -q "ok"; then
        echo -e "${GREEN}✅ Health check passed!${NC}"
        echo ""
        echo -e "${GREEN}🎉 Your backend is ready to use!${NC}"
    else
        echo -e "${YELLOW}⚠️  Health check failed. The function may need a moment to start.${NC}"
        echo "   Try again in a few seconds."
    fi
    echo ""
else
    echo ""
    echo -e "${RED}═══════════════════════════════════════════${NC}"
    echo -e "${RED}  ❌ DEPLOYMENT FAILED!${NC}"
    echo -e "${RED}═══════════════════════════════════════════${NC}"
    echo ""
    echo -e "${YELLOW}Troubleshooting:${NC}"
    echo "  1. Check function logs:"
    echo "     supabase functions logs $FUNCTION_NAME"
    echo ""
    echo "  2. Verify function syntax:"
    echo "     Check supabase/functions/$FUNCTION_NAME/index.tsx"
    echo ""
    echo "  3. Check Supabase dashboard:"
    echo "     https://app.supabase.com/project/$PROJECT_REF/functions"
    echo ""
    exit 1
fi
