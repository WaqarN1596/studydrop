import bcrypt from 'bcrypt';
import db from './database';

const colleges = [
    'Massachusetts Institute of Technology',
    'Stanford University',
    'Harvard University',
    'University of California Berkeley',
    'Georgia Institute of Technology',
    'Carnegie Mellon University',
    'University of Illinois Urbana-Champaign',
    'University of Michigan',
    'Cornell University',
    'University of Washington',
    'Princeton University',
    'Columbia University',
    'University of Texas Austin',
    'UCLA',
    'University of California San Diego',
    'Yale University',
    'Duke University',
    'Northwestern University'
];

const classes = [
    { name: 'Introduction to Computer Science', code: 'CS101' },
    { name: 'Data Structures and Algorithms', code: 'CS201' },
    { name: 'Database Systems', code: 'CS345' },
    { name: 'Operating Systems', code: 'CS370' },
    { name: 'Computer Networks', code: 'CS456' },
    { name: 'Machine Learning', code: 'CS482' },
    { name: 'Artificial Intelligence', code: 'CS485' },
    { name: 'Software Engineering', code: 'CS310' },
    { name: 'Web Development', code: 'CS290' },
    { name: 'Calculus I', code: 'MATH141' },
    { name: 'Calculus II', code: 'MATH142' },
    { name: 'Linear Algebra', code: 'MATH240' },
    { name: 'Discrete Mathematics', code: 'MATH220' },
    { name: 'Physics I', code: 'PHYS121' },
    { name: 'Physics II', code: 'PHYS122' },
    { name: 'General Chemistry', code: 'CHEM131' },
    { name: 'Organic Chemistry', code: 'CHEM231' },
    { name: 'English Composition', code: 'ENGL101' }
];

const sampleUsers = [
    { name: 'Alice Johnson', email: 'alice@example.com', password: 'password123', major: 'Computer Science', year: 3 },
    { name: 'Bob Smith', email: 'bob@example.com', password: 'password123', major: 'Mathematics', year: 2 },
    { name: 'Carol Davis', email: 'carol@example.com', password: 'password123', major: 'Physics', year: 4 },
    { name: 'David Wilson', email: 'david@example.com', password: 'password123', major: 'Computer Science', year: 1 },
    { name: 'Emma Brown', email: 'emma@example.com', password: 'password123', major: 'Engineering', year: 3 },
    { name: 'Frank Miller', email: 'frank@example.com', password: 'password123', major: 'Chemistry', year: 2 },
    { name: 'Grace Lee', email: 'grace@example.com', password: 'password123', major: 'Computer Science', year: 4 },
    { name: 'Henry Taylor', email: 'henry@example.com', password: 'password123', major: 'Mathematics', year: 2 },
    { name: 'Iris Chen', email: 'iris@example.com', password: 'password123', major: 'Computer Science', year: 3 },
    { name: 'Admin User', email: 'admin@example.com', password: 'admin123', major: 'Administration', year: 0, role: 'admin' }
];

const uploadTitles = [
    { title: 'Midterm Exam 1', category: 'exam', tags: ['midterm', 'practice'], semester: 'Fall', year: 2024 },
    { title: 'Final Exam Review', category: 'exam', tags: ['final', 'review', 'comprehensive'], semester: 'Fall', year: 2024 },
    { title: 'Homework 5 Solutions', category: 'homework', tags: ['solutions', 'homework'], semester: 'Fall', year: 2024 },
    { title: 'Lecture Notes Week 3', category: 'notes', tags: ['lecture', 'notes'], semester: 'Fall', year: 2024 },
    { title: 'Quiz 2 Practice Problems', category: 'quiz', tags: ['quiz', 'practice'], semester: 'Fall', year: 2024 },
    { title: 'Lab Report Template', category: 'lab', tags: ['lab', 'template'], semester: 'Fall', year: 2024 },
    { title: 'Study Guide Chapters 1-5', category: 'notes', tags: ['study guide', 'chapters'], semester: 'Fall', year: 2024 },
    { title: 'Project Specification', category: 'project', tags: ['project', 'requirements'], semester: 'Fall', year: 2024 }
];

async function seed() {
    console.log('Starting database seeding...');

    // Wait for database to initialize
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
        // Insert colleges
        console.log('Seeding colleges...');
        for (const college of colleges) {
            await new Promise((resolve, reject) => {
                db.run('INSERT OR IGNORE INTO colleges (name) VALUES (?)', [college], (err) => {
                    if (err) reject(err);
                    else resolve(true);
                });
            });
        }

        // Insert classes for first 3 colleges
        console.log('Seeding classes...');
        for (let collegeId = 1; collegeId <= 3; collegeId++) {
            for (const cls of classes) {
                await new Promise((resolve, reject) => {
                    db.run(
                        'INSERT OR IGNORE INTO classes (collegeId, name, code, description) VALUES (?, ?, ?, ?)',
                        [collegeId, cls.name, cls.code, `${cls.name} coursework and materials`],
                        (err) => {
                            if (err) reject(err);
                            else resolve(true);
                        }
                    );
                });
            }
        }

        // Insert users
        console.log('Seeding users...');
        for (const user of sampleUsers) {
            const hashedPassword = await bcrypt.hash(user.password, 10);
            await new Promise((resolve, reject) => {
                db.run(
                    'INSERT OR IGNORE INTO users (name, email, passwordHash, major, year, role) VALUES (?, ?, ?, ?, ?, ?)',
                    [user.name, user.email, hashedPassword, user.major, user.year, user.role || 'student'],
                    (err) => {
                        if (err) reject(err);
                        else resolve(true);
                    }
                );
            });
        }

        // Enroll users in random classes
        console.log('Enrolling users in classes...');
        for (let userId = 1; userId <= 9; userId++) {
            const classesToJoin = [1, 2, 5, 8, 10]; // Random selection
            for (const classId of classesToJoin) {
                await new Promise((resolve, reject) => {
                    db.run(
                        'INSERT OR IGNORE INTO user_classes (userId, classId, semester) VALUES (?, ?, ?)',
                        [userId, classId, 'Fall 2024'],
                        (err) => {
                            if (err) reject(err);
                            else resolve(true);
                        }
                    );
                });
            }
        }

        // Create sample uploads
        console.log('Creating sample uploads...');
        for (let i = 0; i < 40; i++) {
            const classId = Math.floor(Math.random() * 5) + 1;
            const userId = Math.floor(Math.random() * 9) + 1;
            const uploadData = uploadTitles[i % uploadTitles.length];
            const filename = `upload_${Date.now()}_${i}.pdf`;

            await new Promise((resolve, reject) => {
                db.run(
                    `INSERT INTO uploads (classId, userId, filename, originalFilename, title, summary, url, mimeType, size, category, semester, year) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        classId,
                        userId,
                        filename,
                        uploadData.title + '.pdf',
                        uploadData.title,
                        `This is a ${uploadData.category} for the class. Contains important information and practice materials.`,
                        `/uploads/${filename}`,
                        'application/pdf',
                        Math.floor(Math.random() * 5000000) + 100000,
                        uploadData.category,
                        uploadData.semester,
                        uploadData.year
                    ],
                    function (err) {
                        if (err) {
                            reject(err);
                        } else {
                            const uploadId = this.lastID;
                            // Insert tags
                            uploadData.tags.forEach(tag => {
                                db.run('INSERT INTO upload_tags (uploadId, tag) VALUES (?, ?)', [uploadId, tag]);
                            });
                            resolve(true);
                        }
                    }
                );
            });
        }

        // Create sample comments
        console.log('Creating sample comments...');
        const comments = [
            'Thanks for sharing this!',
            'Very helpful for the exam',
            'Are these the official solutions?',
            'This saved me hours of studying',
            'Anyone have the answer key?'
        ];

        for (let i = 0; i < 50; i++) {
            const uploadId = Math.floor(Math.random() * 40) + 1;
            const userId = Math.floor(Math.random() * 9) + 1;
            const content = comments[Math.floor(Math.random() * comments.length)];

            await new Promise((resolve, reject) => {
                db.run(
                    'INSERT INTO comments (uploadId, userId, content) VALUES (?, ?, ?)',
                    [uploadId, userId, content],
                    (err) => {
                        if (err) reject(err);
                        else resolve(true);
                    }
                );
            });
        }

        // Create sample notifications
        console.log('Creating sample notifications...');
        for (let userId = 1; userId <= 9; userId++) {
            await new Promise((resolve, reject) => {
                db.run(
                    'INSERT INTO notifications (userId, type, data) VALUES (?, ?, ?)',
                    [userId, 'new_upload', JSON.stringify({ message: 'New files uploaded to your class!' })],
                    (err) => {
                        if (err) reject(err);
                        else resolve(true);
                    }
                );
            });
        }

        console.log('Database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

seed();
