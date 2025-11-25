-- ============================================
-- ClassUploads - PostgreSQL Database Schema
-- ============================================
-- Run this in Supabase SQL Editor after creating your project

-- ============================================
-- TABLES
-- ============================================

DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS upload_tags CASCADE;
DROP TABLE IF EXISTS uploads CASCADE;
DROP TABLE IF EXISTS download_history CASCADE;
DROP TABLE IF EXISTS user_classes CASCADE;
DROP TABLE IF EXISTS uploads CASCADE;
DROP TABLE IF EXISTS download_history CASCADE;
DROP TABLE IF EXISTS user_classes CASCADE;
DROP TABLE IF EXISTS majors CASCADE;
DROP TABLE IF EXISTS colleges CASCADE;

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
    college_id INTEGER REFERENCES colleges(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    description TEXT,
    semester VARCHAR(50),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- User-Class relationships
CREATE TABLE user_classes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    semester VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, class_id)
);

-- File Uploads
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

-- Download history tracking
CREATE TABLE download_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    upload_id INTEGER REFERENCES uploads(id) ON DELETE CASCADE,
    downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES for Performance
-- ============================================

CREATE INDEX idx_uploads_class_id ON uploads(class_id);
CREATE INDEX idx_uploads_user_id ON uploads(user_id);
CREATE INDEX idx_user_classes_user ON user_classes(user_id);
CREATE INDEX idx_user_classes_class ON user_classes(class_id);
CREATE INDEX idx_comments_upload ON comments(upload_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_majors_college ON majors(college_id);
CREATE INDEX idx_classes_college ON classes(college_id);

-- ============================================
-- SEED DATA (Sample Data for Testing)
-- ============================================

-- Insert Colleges
INSERT INTO colleges (name, location) VALUES
('University of Massachusetts Lowell', 'Lowell, MA'),
('Massachusetts Institute of Technology', 'Cambridge, MA'),
('Stanford University', 'Stanford, CA'),
('Harvard University', 'Cambridge, MA'),
('University of California Berkeley', 'Berkeley, CA');

-- Insert Majors (Sample for UMass Lowell)
INSERT INTO majors (college_id, name) VALUES
(1, 'Computer Science'),
(1, 'Information Technology'),
(1, 'Mechanical Engineering'),
(1, 'Business Administration'),
(1, 'Psychology'),
(1, 'Biology'),
(1, 'Nursing'),
(1, 'Criminal Justice');

-- Insert Majors (Sample for MIT)
INSERT INTO majors (college_id, name) VALUES
(2, 'Computer Science and Engineering'),
(2, 'Electrical Engineering'),
(2, 'Mathematics'),
(2, 'Physics');

-- Insert Users (password: password123)
INSERT INTO users (name, email, passwordHash, college_id, major_id, year, role) VALUES
('Alice Johnson', 'alice@example.com', '$2b$10$rBV2LYYsH3qH.lq2vO7Ln.QxO0kN3bZ7qF8wXKJdJZxJNGXPFQK5G', 1, 1, 3, 'student'),
('Bob Smith', 'bob@example.com', '$2b$10$rBV2LYYsH3qH.lq2vO7Ln.QxO0kN3bZ7qF8wXKJdJZxJNGXPFQK5G', 1, 2, 2, 'student'),
('Admin User', 'admin@example.com', '$2b$10$rBV2LYYsH3qH.lq2vO7Ln.QxO0kN3bZ7qF8wXKJdJZxJNGXPFQK5G', 1, 1, 4, 'admin');

-- Insert Classes (UMass Lowell)
INSERT INTO classes (college_id, name, code, description, semester, created_by) VALUES
(1, 'Computing I', 'COMP.1010', 'Introduction to C programming', 'Fall 2024', 3),
(1, 'Computing II', 'COMP.1020', 'Object-oriented programming in C++', 'Fall 2024', 3),
(1, 'Calculus I', 'MATH.1310', 'Differential calculus', 'Fall 2024', 3),
(1, 'Calculus II', 'MATH.1320', 'Integral calculus', 'Fall 2024', 3),
(1, 'College Writing I', 'ENGL.1010', 'Academic writing fundamentals', 'Fall 2024', 3),
(1, 'General Chemistry I', 'CHEM.1210', 'Principles of chemistry', 'Fall 2024', 3),
(1, 'Introduction to Psychology', 'PSYC.1010', 'Survey of psychological concepts', 'Fall 2024', 3);

-- Insert Classes (MIT)
INSERT INTO classes (college_id, name, code, description, semester, created_by) VALUES
(2, 'Introduction to Computer Science', 'CS101', 'Fundamentals of programming', 'Fall 2024', 3),
(2, 'Data Structures', 'CS201', 'Algorithms and data structures', 'Fall 2024', 3);

-- Enroll users in classes
INSERT INTO user_classes (user_id, class_id, semester) VALUES
(1, 1, 'Fall 2024'),
(1, 3, 'Fall 2024'),
(2, 2, 'Fall 2024');

-- ============================================
-- DONE! ✅
-- ============================================
