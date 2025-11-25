# Quick Start Guide - ClassUploads

## Install & Run

### 1. Install Dependencies
```bash
# Backend
cd /Users/trash/.gemini/antigravity/scratch/classuploads/server
npm install

# Frontend  
cd /Users/trash/.gemini/antigravity/scratch/classuploads/client
npm install
```

### 2. Seed Database
```bash
cd /Users/trash/.gemini/antigravity/scratch/classuploads/server
npm run seed
```

### 3. Start Application

**Terminal 1 (Backend):**
```bash
cd /Users/trash/.gemini/antigravity/scratch/classuploads/server
npm run dev
```
→ Backend: http://localhost:4000

**Terminal 2 (Frontend):**
```bash
cd /Users/trash/.gemini/antigravity/scratch/classuploads/client
npm run dev
```
→ Frontend: http://localhost:3000

## Demo Login
- **Student**: alice@example.com / password123
- **Admin**: admin@example.com / admin123

## Test Upload
1. Login → Dashboard
2. Click a class
3. Click "Upload File"
4. Drag & drop a PDF
5. Watch AI auto-fill title, tags, summary!
