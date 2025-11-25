-- ============================================
-- ClassUploads - PostgreSQL Database Schema
-- ============================================
-- Run this in Supabase SQL Editor after creating your project

-- ============================================
-- TABLES
-- ============================================

-- Colleges
CREATE TABLE colleges (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Classes
CREATE TABLE classes (
    id SERIAL PRIMARY KEY,
    college_id INTEGER REFERENCES colleges(id),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    semester VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    major VARCHAR(100),
    year INTEGER,
    role VARCHAR(20) DEFAULT 'student',
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

-- ============================================
-- SEED DATA (Sample Data for Testing)
-- ============================================

-- Insert Colleges
INSERT INTO colleges (name, location) VALUES
('Massachusetts Institute of Technology', 'Cambridge, MA'),
('Stanford University', 'Stanford, CA'),
('Harvard University', 'Cambridge, MA'),
('University of California Berkeley', 'Berkeley, CA'),
('Carnegie Mellon University', 'Pittsburgh, PA');

-- Insert Classes
INSERT INTO classes (college_id, name, code, description, semester) VALUES
-- MIT Classes
(1, 'Introduction to Computer Science', 'CS101', 'Fundamentals of programming and computational thinking', 'Fall 2024'),
(1, 'Data Structures and Algorithms', 'CS201', 'Advanced data structures and algorithmic analysis', 'Fall 2024'),
(1, 'Linear Algebra', 'MATH203', 'Vector spaces, matrices, and linear transformations', 'Fall 2024'),
(1, 'Calculus II', 'MATH102', 'Integration techniques and infinite series', 'Fall 2024'),

-- Stanford Classes  
(2, 'Machine Learning', 'CS229', 'Introduction to machine learning and AI', 'Fall 2024'),
(2, 'Database Systems', 'CS145', 'Database design and SQL', 'Fall 2024'),
(2, 'Operating Systems', 'CS140', 'Process management and system calls', 'Fall 2024'),

-- Harvard Classes
(3, 'Introduction to Psychology', 'PSY101', 'Survey of psychological principles', 'Fall 2024'),
(3, 'Organic Chemistry', 'CHEM202', 'Chemical reactions and synthesis', 'Fall 2024'),
(3, 'American History', 'HIST150', 'US history from colonial times to present', 'Fall 2024');

-- Create Test User (password: password123)
-- Password hash created with bcrypt
INSERT INTO users (name, email, password, major, year, role) VALUES
('Alice Johnson', 'alice@example.com', '$2b$10$rBV2LYYsH3qH.lq2vO7Ln.QxO0kN3bZ7qF8wXKJdJZxJNGXPFQK5G', 'Computer Science', 3, 'student'),
('Bob Smith', 'bob@example.com', '$2b$10$rBV2LYYsH3qH.lq2vO7Ln.QxO0kN3bZ7qF8wXKJdJZxJNGXPFQK5G', 'Mathematics', 2, 'student'),
('Admin User', 'admin@example.com', '$2b$10$rBV2LYYsH3qH.lq2vO7Ln.QxO0kN3bZ7qF8wXKJdJZxJNGXPFQK5G', NULL, NULL, 'admin');

-- Enroll users in classes
INSERT INTO user_classes (user_id, class_id, semester) VALUES
(1, 1, 'Fall 2024'),
(1, 2, 'Fall 2024'),
(1, 5, 'Fall 2024'),
(2, 3, 'Fall 2024'),
(2, 4, 'Fall 2024');

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check table counts
SELECT 'colleges' as table_name, COUNT(*) as count FROM colleges
UNION ALL
SELECT 'classes', COUNT(*) FROM classes
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'user_classes', COUNT(*) FROM user_classes;

-- List all classes with college names
SELECT c.code, c.name, col.name as college, c.semester
FROM classes c
JOIN colleges col ON c.college_id = col.id
ORDER BY col.name, c.code;

-- ============================================
-- DONE! ✅
-- ============================================
-- Your database is ready for ClassUploads!
-- Login with: alice@example.com / password123
