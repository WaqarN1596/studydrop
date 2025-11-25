# Node.js Installation & Setup for ClassUploads

## Step 1: Install Node.js

Run this command in your terminal (you'll need to enter your password):

```bash
sudo chown -R $(whoami) /usr/local/share/man/man8
brew install node
```

**Alternative - Official Installer:**
If Homebrew has issues, download Node.js directly from https://nodejs.org (LTS version recommended)

## Step 2: Verify Installation

```bash
node --version
npm --version
```

You should see version numbers (e.g., v20.x.x and 10.x.x)

## Step 3: Install Project Dependencies

### Backend:
```bash
cd /Users/trash/.gemini/antigravity/scratch/classuploads/server
npm install
```

This will install:
- express, cors, dotenv, multer, bcrypt, jsonwebtoken, sqlite3, express-rate-limit
- TypeScript and type definitions
- tsx for development

### Frontend:
```bash
cd /Users/trash/.gemini/antigravity/scratch/classuploads/client
npm install
```

This will install:
- react, react-dom, react-router-dom
- zustand, axios
- vite, tailwindcss
- TypeScript and type definitions
- lucide-react for icons

## Step 4: Seed Database

```bash
cd /Users/trash/.gemini/antigravity/scratch/classuploads/server
npm run seed
```

**Expected Output:**
```
Starting database seeding...
Connected to SQLite database
Database tables initialized
Seeding colleges...
Seeding classes...
Seeding users...
Enrolling users in classes...
Creating sample uploads...
Creating sample comments...
Creating sample notifications...
Database seeded successfully!
```

## Step 5: Start the Application

**Terminal 1 (Backend):**
```bash
cd /Users/trash/.gemini/antigravity/scratch/classuploads/server
npm run dev
```

**Expected Output:**
```
🚀 Server running on http://localhost:4000
📁 Uploads directory: /path/to/uploads
Connected to SQLite database
Database tables initialized
```

**Terminal 2 (Frontend):**
```bash
cd /Users/trash/.gemini/antigravity/scratch/classuploads/client
npm run dev
```

**Expected Output:**
```
  VITE ready in 500ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

## Step 6: Test in Browser

1. Open http://localhost:3000
2. You should see the Welcome page
3. Click "Sign In"
4. Use demo credentials:
   - Email: `alice@example.com`
   - Password: `password123`

## Troubleshooting

### If npm install fails:
- Make sure you're in the correct directory
- Try `npm cache clean --force` then retry
- Check Node.js version: `node --version` (should be v18+)

### If database seed fails:
- Make sure you're in the server directory
- Delete `database.sqlite` if it exists and try again

### If servers don't start:
- Check ports 3000 and 4000 aren't already in use
- Look for error messages in the terminal
- Make sure all dependencies installed successfully

### If you see TypeScript errors:
- This is normal during development
- The apps should still run in development mode

## Next Step: Test the Full Application

Once both servers are running, test these features:

1. **Login Flow** ✅
2. **Dashboard** ✅  
3. **Join a Class** ✅
4. **Upload a File** ✅ (Watch AI auto-fill!)
5. **View Uploads** ✅
6. **Toggle Dark Mode** ✅
7. **Check Notifications** ✅

---

**Need Help?** Check the console logs in both terminal windows for debugging information.
