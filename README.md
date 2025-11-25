# ClassUploads Platform

A modern, full-stack web application for college students to upload, share, and discover class materials with AI-powered features.

![Built with](https://img.shields.io/badge/Built%20with-TypeScript-blue)
![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-cyan)
![Backend](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-green)

## 🚀 Features

- **AI-Powered File Processing**
  - Automatic title extraction from filenames
  - Smart category classification (exam, quiz, homework, notes, etc.)
  - Auto-generated tags and summaries
  - Duplicate file detection
  - Semantic search capabilities
  - Personalized recommendations

- **User Experience**
  - Modern, responsive UI with dark/light mode
  - Drag & drop file uploads
  - Real-time notifications
  - Class-based organization
  - File preview for PDFs and images

- **Social Features**
  - Join and manage classes
  - Comment on uploads
  - Class discussions
  - User profiles

- **Admin Panel**
  - Content moderation
  - User management
  - Activity logs

## 📋 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **TailwindCSS** for styling
- **Zustand** for state management
- **React Router** for navigation
- **Axios** for API calls
- **Lucide React** for icons

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **SQLite** for database
- **JWT** for authentication
- **Multer** for file uploads
- **Bcrypt** for password hashing
- **Rate limiting** and validation

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### 1. Clone or Navigate to Project
```bash
cd /Users/trash/.gemini/antigravity/scratch/classuploads
```

### 2. Install Backend Dependencies
```bash
cd server
npm install
```

### 3. Install Frontend Dependencies
```bash
cd ../client
npm install
```

### 4. Set Up Environment Variables

Backend `.env` (already created):
```env
PORT=4000
JWT_SECRET=dev-secret-key-12345
DATABASE_PATH=./database.sqlite
UPLOAD_DIR=./uploads
NODE_ENV=development
```

### 5. Initialize Database and Seed Data
```bash
cd server

# This will create the database and seed it with:
# - 18 colleges
# - 18 classes per college
# - 10 demo users
# - 40 sample uploads with AI tags
# - Comments and notifications
npm run seed
```

## 🎯 Running the Application

### Start Backend Server (Terminal 1)
```bash
cd server
npm run dev
```
Server will run on **http://localhost:4000**

### Start Frontend Dev Server (Terminal 2)
```bash
cd client
npm run dev
```
Frontend will run on **http://localhost:3000**

## 👤 Demo Accounts

### Student Account
- **Email**: alice@example.com
- **Password**: password123

### Admin Account
- **Email**: admin@example.com
- **Password**: admin123

## 📁 Project Structure

```
classuploads/
├── server/                 # Backend
│   ├── src/
│   │   ├── controllers/   # AI controller
│   │   ├── db/           # Database setup & seeds
│   │   ├── middleware/   # Auth, upload validation
│   │   ├── routes/       # API endpoints
│   │   ├── types/        # TypeScript types
│   │   └── index.ts      # Server entry point
│   ├── uploads/          # File storage (created automatically)
│   ├── package.json
│   └── .env
│
├── client/                # Frontend
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API service layer
│   │   ├── store/        # Zustand state management
│   │   ├── types/        # TypeScript types
│   │   ├── App.tsx       # Main app component
│   │   └── main.tsx      # Entry point
│   ├── package.json
│   └── index.html
│
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Classes
- `GET /api/classes` - List all classes
- `GET /api/classes/:id` - Get class details
- `POST /api/classes/join` - Join a class
- `GET /api/classes/:id/uploads` - Get class uploads
- `GET /api/classes/:id/discussions` - Get class discussions

### Uploads
- `POST /api/uploads` - Upload file (multipart/form-data)
- `GET /api/uploads/:id` - Get upload details
- `DELETE /api/uploads/:id` - Delete upload
- `GET /api/uploads/:id/comments` - Get upload comments

### AI Endpoints (Mocked)
- `POST /api/ai/extract-title` - Extract title from filename
- `POST /api/ai/tags` - Generate tags
- `POST /api/ai/classify` - Classify file category
- `POST /api/ai/recommend/:fileId` - Get recommendations
- `POST /api/ai/check-duplicate` - Check for duplicates
- `POST /api/ai/search` - Semantic search
- `POST /api/ai/moderate` - Content moderation
- `POST /api/ai/summarize` - Generate summary

### Admin
- `GET /api/admin/uploads` - List all uploads
- `DELETE /api/admin/uploads/:id` - Delete any upload
- `GET /api/admin/users` - List all users
- `GET /api/admin/logs` - Get admin activity logs

## 🧪 Testing

The application includes demo data and mock AI endpoints for testing:

1. **Login Flow**: Use demo credentials to test authentication
2. **Upload Files**: Upload PDF/JPG/PNG files (<20MB)
3. **AI Features**: See auto-generated titles, tags, and summaries
4. **Search**: Test semantic search within classes
5. **Duplicate Detection**: Upload similar files to see warnings
6. **Notifications**: Check notification system
7. **Admin Panel**: Login as admin to access admin features

## 🌐 Production Deployment

### Backend Deployment (e.g., Heroku, Railway, Render)
1. Set environment variables on your platform
2. Change `DATABASE_PATH` to production database
3. Update `JWT_SECRET` to a strong secret
4. Set `NODE_ENV=production`
5. Configure file storage (S3, Cloudinary, etc.)
6. Run `npm run build && npm start`

### Frontend Deployment (e.g., Vercel, Netlify)
1. Build: `npm run build`
2. Deploy `dist` folder
3. Set environment variable `VITE_API_URL` to backend URL
4. Configure redirects for SPA routing

### Database Migration
For production, consider migrating to PostgreSQL:
1. Update dependencies: `npm install pg`
2. Modify database.ts to use PostgreSQL
3. Update connection string in .env

## 🎨 Features Showcase

### AI-Powered Upload
- Drag & drop files
- Automatic title extraction
- Smart categorization
- Tag generation
- Duplicate warnings

### Modern UI
- Responsive design
- Dark/light mode toggle
- Smooth animations
- Card-based layouts
- Modern color palette

### Class Management
- Browse and join classes
- View class uploads
- Search within classes
- Class discussions

## 📝 Notes

- **File Storage**: Currently uses local filesystem. For production, integrate cloud storage (AWS S3, Cloudinary)
- **AI Features**: Currently mocked with realistic responses. Integrate real AI services (OpenAI, Hugging Face) for production
- **Database**: SQLite for development. Migrate to PostgreSQL/MySQL for production
- **Security**: Update JWT_SECRET and implement additional security measures for production

## 🤝 Contributing

This is a demo project built for educational purposes. Feel free to extend and customize!

## 📄 License

MIT License - Free to use and modify

## 🙋 Support

For issues or questions, check the code comments or console logs for debugging information.

---

**Built with ❤️ for students, by students**
