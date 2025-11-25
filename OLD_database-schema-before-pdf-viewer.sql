-- ============================================
-- ClassUploads - PostgreSQL Database Schema (PRE-PDF VIEWER VERSION)
-- ============================================
-- This is the schema BEFORE the PDF viewer and download tracking features
-- Run this in Supabase SQL Editor

-- ============================================
-- DROP OLD TABLES
-- ============================================

DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS upload_tags CASCADE;
DROP TABLE IF EXISTS uploads CASCADE;
DROP TABLE IF EXISTS user_classes CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS majors CASCADE;
DROP TABLE IF EXISTS colleges CASCADE;

-- ============================================
-- CREATE TABLES
-- ============================================

-- Colleges
CREATE TABLE colleges (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Majors
CREATE TABLE majors (
    id SERIAL PRIMARY KEY,
    college_id INTEGER REFERENCES colleges(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    passwordHash VARCHAR(255) NOT NULL,
    college_id INTEGER REFERENCES colleges(id),
    major_id INTEGER REFERENCES majors(id),
    year INTEGER,
    role VARCHAR(20) DEFAULT 'student',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Classes
CREATE TABLE classes (
    id SERIAL PRIMARY KEY,
    college_id INTEGER REFERENCES colleges(id),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    semester VARCHAR(50) DEFAULT 'Fall 2024',
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- User Classes (Junction Table)
CREATE TABLE user_classes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    semester VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, class_id)
);

-- Uploads
CREATE TABLE uploads (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    class_id INTEGER REFERENCES classes(id),
    title VARCHAR(255),
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    category VARCHAR(50),
    summary TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Upload Tags
CREATE TABLE upload_tags (
    id SERIAL PRIMARY KEY,
    upload_id INTEGER REFERENCES uploads(id) ON DELETE CASCADE,
    tag VARCHAR(100) NOT NULL
);

-- Comments
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    upload_id INTEGER REFERENCES uploads(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- INDEXES for Performance
-- ============================================

CREATE INDEX idx_uploads_class_id ON uploads(class_id);
CREATE INDEX idx_uploads_user_id ON uploads(user_id);
CREATE INDEX idx_user_classes_user ON user_classes(user_id);
CREATE INDEX idx_user_classes_class ON user_classes(class_id);

-- ============================================
-- SEED DATA
-- ============================================

-- Sample Colleges
INSERT INTO colleges (name, location) VALUES
('University of Massachusetts Lowell', 'Lowell, MA'),
('Massachusetts Institute of Technology', 'Cambridge, MA'),
('Stanford University', 'Stanford, CA'),
('Harvard University', 'Cambridge, MA'),
('University of California Berkeley', 'Berkeley, CA');

-- Sample Majors for UMass Lowell (id=1)
INSERT INTO majors (college_id, name) VALUES
(1, 'Computer Science'),
(1, 'Electrical Engineering'),
(1, 'Mechanical Engineering'),
(1, 'Business Administration'),
(1, 'Nursing'),
(1, 'Psychology'),
(1, 'Biology'),
(1, 'Criminal Justice'),
(1, 'Mathematics'),
(1, 'English');

-- Sample Majors for MIT (id=2)
INSERT INTO majors (college_id, name) VALUES
(2, 'Computer Science and Engineering'),
(2, 'Electrical Engineering and Computer Science'),
(2, 'Mechanical Engineering'),
(2, 'Physics'),
(2, 'Mathematics');

-- Demo Users (password for all: password123)
INSERT INTO users (name, email, passwordHash, college_id, major_id, year, role) VALUES
('Alice Student', 'alice@example.com', '$2b$10$rBV2LYYsH3qH.lq2vO7Ln.QxO0kN3bZ7qF8wXKJdJZxJNGXPFQK5G', 1, 1, 2024, 'student'),
('Bob Professor', 'bob@example.com', '$2b$10$rBV2LYYsH3qH.lq2vO7Ln.QxO0kN3bZ7qF8wXKJdJZxJNGXPFQK5G', 1, NULL, NULL, 'admin');

-- Sample Classes
INSERT INTO classes (college_id, name, code, description, semester, created_by) VALUES
(1, 'Introduction to Computer Science', 'COMP.1010', 'Introduction to programming and computer science fundamentals', 'Fall 2024', 1),
(1, 'Data Structures', 'COMP.2020', 'Study of fundamental data structures and algorithms', 'Fall 2024', 1);

-- Sample User-Class Enrollments
INSERT INTO user_classes (user_id, class_id, semester) VALUES
(1, 1, 'Fall 2024'),
(1, 2, 'Fall 2024');

-- ============================================
-- DONE! ✅
-- ============================================
