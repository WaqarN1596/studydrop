#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

COMMIT_MSG="$1"
if [ -z "$COMMIT_MSG" ]; then
    COMMIT_MSG="Update"
fi

echo -e "${YELLOW}🚀 Starting deployment process...${NC}"

# 1. Build Frontend
echo -e "${YELLOW}📦 Building frontend...${NC}"
cd client
export VITE_API_URL="https://studydrop-api.onrender.com/api"
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi
cd ..

# 2. Git Commit & Push
echo -e "${YELLOW}💾 Committing changes...${NC}"
git add .
git commit -m "$COMMIT_MSG"

echo -e "${YELLOW}⬆️  Pushing to GitHub...${NC}"
git push origin main

# 3. Trigger Vercel
echo -e "${YELLOW}🚀 Deploying to Vercel...${NC}"
cd client
vercel --prod --yes
cd ..

echo -e "${GREEN}✅ Deployment process complete!${NC}"
echo -e "${YELLOW}⚠️  IMPORTANT: Please manually verify the deployment on the live site to ensure no errors or unwanted behaviors.${NC}"
