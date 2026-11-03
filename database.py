"""SQLite database layer for Smart Library (standard library only)."""

import sqlite3
from pathlib import Path

from flask import g

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "library.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    phone         TEXT NOT NULL DEFAULT '',
    password_hash TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS books (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT NOT NULL,
    author      TEXT NOT NULL,
    category    TEXT NOT NULL,
    icon        TEXT NOT NULL DEFAULT '📖',
    color       TEXT NOT NULL DEFAULT '#eee5ff',
    description TEXT NOT NULL DEFAULT '',
    price       REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS user_books (
    user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id  INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    added_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, book_id)
);

CREATE TABLE IF NOT EXISTS favorites (
    user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id  INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    added_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, book_id)
);

-- Payment *records* only. No real payment is processed.
CREATE TABLE IF NOT EXISTS payments (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id    INTEGER REFERENCES books(id) ON DELETE SET NULL,
    title      TEXT NOT NULL,
    amount     REAL NOT NULL DEFAULT 0,
    status     TEXT NOT NULL DEFAULT 'completed'
               CHECK (status IN ('completed', 'pending', 'failed')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
"""

# (title, author, category, icon, color, description, price in EGP)
SEED_BOOKS = [
    ("Clean Code", "Robert C. Martin", "Programming", "💻", "#eee5ff",
     "Learn how to write clean and maintainable code.", 350),
    ("Introduction to Algorithms", "Thomas H. Cormen", "Programming", "🧠",
     "#e0edff", "Explore algorithms and problem-solving techniques.", 600),
    ("Artificial Intelligence", "Stuart Russell", "AI", "🤖", "#dff7f0",
     "Discover the foundations of intelligent systems.", 550),
    ("Deep Learning", "Ian Goodfellow", "AI", "🧬", "#ffe8ee",
     "Understand neural networks and deep learning.", 500),
    ("The Design of Everyday Things", "Don Norman", "Design", "🎨", "#fff0d9",
     "Explore the principles of thoughtful design.", 300),
    ("The Lean Startup", "Eric Ries", "Business", "📈", "#e9e8ff",
     "Learn how to build and test business ideas.", 280),
    ("Python for Data Analysis", "Wes McKinney", "Data Science", "📊",
     "#e0f4ff", "Practical data wrangling with pandas and NumPy.", 400),
    ("The Innovators", "Walter Isaacson", "Technology", "⚡", "#fff5d6",
     "The story of the people who created the digital revolution.", 320),
]


def get_db():
    """Return the SQLite connection for the current request."""
    if "db" not in g:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        g.db = conn
    return g.db


def close_db(_exc=None):
    conn = g.pop("db", None)
    if conn is not None:
        conn.close()


def init_db():
    """Create tables and seed the catalogue on first run."""
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = ON")
    conn.executescript(SCHEMA)
    if conn.execute("SELECT COUNT(*) FROM books").fetchone()[0] == 0:
        conn.executemany(
            "INSERT INTO books (title, author, category, icon, color,"
            " description, price) VALUES (?, ?, ?, ?, ?, ?, ?)",
            SEED_BOOKS,
        )
    conn.commit()
    conn.close()
