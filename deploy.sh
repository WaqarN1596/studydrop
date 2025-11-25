#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Starting deployment process...${NC}"

# 1. Build Frontend
echo -e "${YELLOW}📦 Building frontend...${NC}"
cd client
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi
cd ..

# 2. Git Commit & Push
echo -e "${YELLOW}💾 Committing changes...${NC}"
git add .
read -p "Enter commit message: " commit_msg
git commit -m "$commit_msg"

echo -e "${YELLOW}⬆️  Pushing to GitHub...${NC}"
git push origin main

# 3. Trigger Vercel (Optional)
read -p "Do you want to trigger Vercel deployment manually? (y/n) " trigger_vercel
if [ "$trigger_vercel" = "y" ]; then
    echo -e "${YELLOW}🚀 Deploying to Vercel...${NC}"
    cd client
    vercel --prod
    cd ..
fi

echo -e "${GREEN}✅ Deployment process complete!${NC}"
echo -e "Your changes are now live on GitHub and deploying to Render/Vercel."
