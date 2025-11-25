import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../database.sqlite');

export const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database');
        initDatabase();
    }
});

function initDatabase() {
    db.serialize(() => {
        // Users table
        db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        passwordHash TEXT NOT NULL,
        major TEXT,
        year INTEGER,
        profilePicture TEXT,
        role TEXT DEFAULT 'student',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Colleges table
        db.run(`
      CREATE TABLE IF NOT EXISTS colleges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      )
    `);

        // Classes table
        db.run(`
      CREATE TABLE IF NOT EXISTS classes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        collegeId INTEGER NOT NULL,
        name TEXT NOT NULL,
        code TEXT NOT NULL,
        description TEXT,
        FOREIGN KEY (collegeId) REFERENCES colleges(id)
      )
    `);

        // User-Classes join table
        db.run(`
      CREATE TABLE IF NOT EXISTS user_classes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        classId INTEGER NOT NULL,
        semester TEXT,
        joinedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id),
        FOREIGN KEY (classId) REFERENCES classes(id),
        UNIQUE(userId, classId)
      )
    `);

        // Uploads table
        db.run(`
      CREATE TABLE IF NOT EXISTS uploads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        classId INTEGER NOT NULL,
        userId INTEGER NOT NULL,
        filename TEXT NOT NULL,
        originalFilename TEXT NOT NULL,
        title TEXT,
        summary TEXT,
        url TEXT NOT NULL,
        mimeType TEXT,
        size INTEGER,
        category TEXT,
        semester TEXT,
        year INTEGER,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (classId) REFERENCES classes(id),
        FOREIGN KEY (userId) REFERENCES users(id)
      )
    `);

        // Upload tags table
        db.run(`
      CREATE TABLE IF NOT EXISTS upload_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uploadId INTEGER NOT NULL,
        tag TEXT NOT NULL,
        FOREIGN KEY (uploadId) REFERENCES uploads(id) ON DELETE CASCADE
      )
    `);

        // Comments table
        db.run(`
      CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uploadId INTEGER NOT NULL,
        userId INTEGER NOT NULL,
        content TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (uploadId) REFERENCES uploads(id) ON DELETE CASCADE,
        FOREIGN KEY (userId) REFERENCES users(id)
      )
    `);

        // Notifications table
        db.run(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        type TEXT NOT NULL,
        data TEXT,
        read INTEGER DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id)
      )
    `);

        // Admin logs table
        db.run(`
      CREATE TABLE IF NOT EXISTS admin_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        adminId INTEGER NOT NULL,
        payload TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (adminId) REFERENCES users(id)
      )
    `);

        // Favorites table
        db.run(`
      CREATE TABLE IF NOT EXISTS favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        uploadId INTEGER NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id),
        FOREIGN KEY (uploadId) REFERENCES uploads(id) ON DELETE CASCADE,
        UNIQUE(userId, uploadId)
      )
    `);

        console.log('Database tables initialized');
    });
}

export default db;
