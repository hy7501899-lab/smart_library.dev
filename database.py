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
    # Original 8 books
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

    # 30 additional books
    # Programming
    ("The Pragmatic Programmer", "David Thomas and Andrew Hunt", "Programming",
     "🛠️", "#e8f2ff", "Practical techniques for becoming a better and more effective programmer.", 420),
    ("Code Complete", "Steve McConnell", "Programming", "⌨️", "#f1eaff",
     "A comprehensive guide to software construction and professional coding practices.", 480),
    ("You Don't Know JS Yet", "Kyle Simpson", "Programming", "🟨", "#fff4d9",
     "Build a deeper understanding of JavaScript and how the language works.", 300),
    ("Head First Design Patterns", "Eric Freeman and Elisabeth Robson", "Programming",
     "🧩", "#e5f7ef", "Learn reusable object-oriented design patterns through visual examples.", 390),
    ("Refactoring", "Martin Fowler", "Programming", "🔧", "#fce8e8",
     "Improve the design of existing code safely through systematic refactoring.", 450),

    # Artificial Intelligence
    ("Machine Learning", "Tom M. Mitchell", "AI", "🤖", "#e3f6f2",
     "An introduction to the concepts and methods of machine learning.", 430),
    ("Hands-On Machine Learning", "Aurélien Géron", "AI", "🧠", "#e8efff",
     "Build practical machine learning systems using Python and popular libraries.", 520),
    ("Pattern Recognition and Machine Learning", "Christopher M. Bishop", "AI",
     "🔍", "#f4eaff", "Study probabilistic methods for pattern recognition and machine learning.", 650),
    ("The Hundred-Page Machine Learning Book", "Andriy Burkov", "AI", "📘",
     "#e5f5ff", "A concise overview of essential machine learning ideas and algorithms.", 350),
    ("Natural Language Processing with Python", "Steven Bird, Ewan Klein and Edward Loper",
     "AI", "💬", "#fff0e6", "Learn techniques for processing and analyzing human language with Python.", 410),

    # Design
    ("Don't Make Me Think", "Steve Krug", "Design", "💡", "#fff3d9",
     "A practical guide to intuitive web usability and user-friendly design.", 280),
    ("About Face", "Alan Cooper, Robert Reimann, David Cronin and Christopher Noessel",
     "Design", "🖥️", "#e9e8ff", "Explore interaction design principles for creating useful digital products.", 470),
    ("Universal Principles of Design", "William Lidwell, Kritina Holden and Jill Butler",
     "Design", "📐", "#e6f4ff", "A visual reference to widely used principles of design and usability.", 390),
    ("The Elements of User Experience", "Jesse James Garrett", "Design", "🎯",
     "#fce9ef", "Understand the strategy, structure and scope behind user experience design.", 320),
    ("Designing Interfaces", "Jenifer Tidwell, Charles Brewer and Aynne Valencia",
     "Design", "🪄", "#f0eaff", "Learn common interface patterns for effective interaction design.", 440),

    # Data Science
    ("Python Data Science Handbook", "Jake VanderPlas", "Data Science", "🐍",
     "#e4f5ff", "Use Python tools for data exploration, visualization and machine learning.", 460),
    ("R for Data Science", "Hadley Wickham, Mine Çetinkaya-Rundel and Garrett Grolemund",
     "Data Science", "📈", "#e7f6ed", "Learn how to import, transform, visualize and communicate data using R.", 400),
    ("Storytelling with Data", "Cole Nussbaumer Knaflic", "Data Science", "📊",
     "#fff1df", "Communicate data insights clearly through effective charts and narratives.", 360),
    ("Practical Statistics for Data Scientists", "Peter Bruce, Andrew Bruce and Peter Gedeck",
     "Data Science", "📉", "#e9edff", "Apply statistical concepts and methods to real data science problems.", 430),
    ("The Data Warehouse Toolkit", "Ralph Kimball and Margy Ross", "Data Science",
     "🗄️", "#f3eaff", "Learn dimensional modeling techniques for analytics and data warehouses.", 520),

    # Business
    ("Good to Great", "Jim Collins", "Business", "🚀", "#e8f5e9",
     "Explore management principles that help organizations achieve lasting success.", 330),
    ("The 7 Habits of Highly Effective People", "Stephen R. Covey", "Business",
     "🌟", "#fff3d9", "Develop personal and professional effectiveness through seven practical habits.", 310),
    ("Zero to One", "Peter Thiel with Blake Masters", "Business", "💼", "#e7edff",
     "Think about innovation, startups and creating something genuinely new.", 290),
    ("Thinking, Fast and Slow", "Daniel Kahneman", "Business", "🧠", "#f1eaff",
     "Discover how two different systems shape human judgment and decision-making.", 370),
    ("Measure What Matters", "John Doerr", "Business", "🎯", "#e4f7f1",
     "Learn how Objectives and Key Results can help teams focus and execute.", 340),

    # Technology
    ("The Age of AI", "Henry A. Kissinger, Eric Schmidt and Daniel Huttenlocher",
     "Technology", "🌐", "#e5f1ff", "Explore how artificial intelligence may reshape society and technology.", 390),
    ("The Second Machine Age", "Erik Brynjolfsson and Andrew McAfee", "Technology",
     "⚙️", "#f0eaff", "Understand the economic and social impact of digital technologies.", 350),
    ("Code: The Hidden Language of Computer Hardware and Software", "Charles Petzold",
     "Technology", "🔌", "#fff0df", "Discover how computers work, from simple circuits to software.", 420),
    ("The Phoenix Project", "Gene Kim, Kevin Behr and George Spafford", "Technology",
     "🖥️", "#e5f7ef", "A business novel about IT operations, teamwork and continuous delivery.", 360),
    ("The Internet of Things", "Samuel Greengard", "Technology", "📡", "#e8edff",
     "Learn how connected devices are changing industries and everyday life.", 300),
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
    """Create tables and add any missing catalogue books without duplicates."""
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = ON")
    conn.executescript(SCHEMA)

    # Insert only titles that are not already in the database.
    # This also adds the new books to existing installations.
    existing_titles = {
        row[0] for row in conn.execute("SELECT title FROM books").fetchall()
    }

    new_books = [
        book for book in SEED_BOOKS
        if book[0] not in existing_titles
    ]

    if new_books:
        conn.executemany(
            "INSERT INTO books (title, author, category, icon, color,"
            " description, price) VALUES (?, ?, ?, ?, ?, ?, ?)",
            new_books,
        )

    conn.commit()
    conn.close()
