-- AI Flashcard Tables Migration
-- Run this to add flashcard functionality

-- Table: flashcard_sets
-- Stores flashcard sets generated from documents
CREATE TABLE IF NOT EXISTS flashcard_sets (
    id SERIAL PRIMARY KEY,
    upload_id INTEGER NOT NULL REFERENCES uploads(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    card_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_flashcard_set_upload FOREIGN KEY (upload_id) REFERENCES uploads(id) ON DELETE CASCADE,
    CONSTRAINT fk_flashcard_set_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table: flashcards
-- Stores individual flashcards within a set
CREATE TABLE IF NOT EXISTS flashcards (
    id SERIAL PRIMARY KEY,
    set_id INTEGER NOT NULL REFERENCES flashcard_sets(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    card_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_flashcard_set FOREIGN KEY (set_id) REFERENCES flashcard_sets(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_flashcard_sets_upload ON flashcard_sets(upload_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_sets_user ON flashcard_sets(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_set ON flashcards(set_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_order ON flashcards(set_id, card_order);
