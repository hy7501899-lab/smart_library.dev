import os
import re
import json
import logging
from functools import wraps
from pathlib import Path

from flask import Flask, request, jsonify, send_from_directory, g
from dotenv import load_dotenv
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from werkzeug.security import generate_password_hash, check_password_hash
from google import genai
from google.genai import types

import database
from database import get_db


# ==========================================
# 1. Project configuration
# ==========================================

BASE_DIR = Path(__file__).resolve().parent

load_dotenv(BASE_DIR / ".env")

API_KEY = os.getenv("GEMINI_API_KEY")
MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

SECRET_KEY = os.getenv("SECRET_KEY")
TOKEN_MAX_AGE = 60 * 60 * 24 * 7  # login stays valid for 7 days

app = Flask(__name__)
app.logger.setLevel(logging.INFO)

if not SECRET_KEY:
    # Fine for local development, but tokens stop working after a restart.
    SECRET_KEY = "dev-only-secret-change-me"
    app.logger.warning(
        "SECRET_KEY is not set in .env - using an insecure development key."
    )

token_serializer = URLSafeTimedSerializer(SECRET_KEY, salt="smart-library-auth")

client = genai.Client(api_key=API_KEY) if API_KEY else None

app.teardown_appcontext(database.close_db)
database.init_db()

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

# ==========================================
# CORS: lets the pages work when opened from Live Server (port 5500) or
# straight from the file system, while Flask runs on its own port.
# Set ALLOW_LOCAL_FRONTEND=false in production. Add real front-end domains
# in CORS_ORIGINS (comma separated) if the front end is hosted elsewhere.
# ==========================================

ALLOW_LOCAL_FRONTEND = os.getenv("ALLOW_LOCAL_FRONTEND", "true").lower() != "false"
CORS_ORIGINS = {
    origin.strip().rstrip("/")
    for origin in os.getenv("CORS_ORIGINS", "").split(",")
    if origin.strip()
}
LOCAL_ORIGIN_RE = re.compile(r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$")


def origin_allowed(origin):
    if not origin:
        return False
    if origin in CORS_ORIGINS:
        return True
    if ALLOW_LOCAL_FRONTEND:
        # "null" is what browsers send for pages opened from a file
        return origin == "null" or bool(LOCAL_ORIGIN_RE.match(origin))
    return False


@app.before_request
def cors_preflight():
    if request.method == "OPTIONS" and request.path.startswith("/api/"):
        return app.make_response(("", 204))


@app.after_request
def add_cors_headers(response):
    origin = request.headers.get("Origin", "")

    if request.path.startswith("/api/") and origin_allowed(origin):
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Headers"] = \
            "Content-Type, Authorization"
        response.headers["Access-Control-Allow-Methods"] = \
            "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Vary"] = "Origin"

    return response


# Only these file types can be downloaded from the project folder.
# This keeps app.py, library.db and .env from being served.
PUBLIC_EXTENSIONS = {
    ".html", ".css", ".js", ".mp4", ".webm", ".png", ".jpg", ".jpeg",
    ".gif", ".svg", ".webp", ".ico", ".woff", ".woff2",
}


# ==========================================
# 2. Helpers
# ==========================================

def error(message, status=400):
    return jsonify({"error": message}), status


def user_to_dict(row):
    return {
        "id": row["id"],
        "name": row["name"],
        "email": row["email"],
        "phone": row["phone"],
    }


def book_to_dict(row):
    return {
        "id": row["id"],
        "title": row["title"],
        "author": row["author"],
        "category": row["category"],
        "icon": row["icon"],
        "color": row["color"],
        "description": row["description"],
        "price": row["price"],
    }


def make_token(user_id):
    return token_serializer.dumps({"uid": user_id})


def login_required(view):
    """Require a valid 'Authorization: Bearer <token>' header."""

    @wraps(view)
    def wrapper(*args, **kwargs):
        header = request.headers.get("Authorization", "")
        if not header.startswith("Bearer "):
            return error("Please log in first.", 401)

        try:
            data = token_serializer.loads(
                header[7:].strip(), max_age=TOKEN_MAX_AGE
            )
        except SignatureExpired:
            return error("Your session has expired. Please log in again.", 401)
        except BadSignature:
            return error("Invalid session. Please log in again.", 401)

        row = get_db().execute(
            "SELECT * FROM users WHERE id = ?", (data.get("uid"),)
        ).fetchone()

        if row is None:
            return error("Account no longer exists.", 401)

        g.user = row
        return view(*args, **kwargs)

    return wrapper


def json_body():
    data = request.get_json(silent=True)
    return data if isinstance(data, dict) else {}


# ==========================================
# 3. Pages and static files
# ==========================================

@app.get("/")
def home():
    return send_from_directory(str(BASE_DIR), "home.html")


@app.get("/<path:filename>")
def serve_files(filename):
    requested_path = Path(filename)

    # Block hidden files, directory traversal and non-public file types
    if (
        requested_path.is_absolute()
        or ".." in requested_path.parts
        or any(part.startswith(".") for part in requested_path.parts)
        or requested_path.suffix.lower() not in PUBLIC_EXTENSIONS
    ):
        return "Not found", 404

    file_path = BASE_DIR / requested_path

    if not file_path.is_file():
        app.logger.warning("File not found: %s", file_path)
        return "File not found", 404

    return send_from_directory(str(BASE_DIR), filename)


# ==========================================
# 4. Backend status
# ==========================================

@app.get("/api/health")
def health():
    return jsonify({
        "backend": "running",
        "database": "sqlite",
        "api_key_configured": bool(API_KEY),
        "provider": "Google Gemini",
        "model": MODEL
    })


# ==========================================
# 5. Authentication
# ==========================================

@app.post("/api/auth/register")
def register():
    data = json_body()

    name = str(data.get("name", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))

    if not name or not email:
        return error("Please complete all fields.")
    if not EMAIL_RE.match(email):
        return error("Please enter a valid email address.")
    if len(password) < 8:
        return error("Password must contain at least 8 characters.")

    db = get_db()

    if db.execute("SELECT 1 FROM users WHERE email = ?", (email,)).fetchone():
        return error("This email is already registered. Please log in.", 409)

    cursor = db.execute(
        "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
        (name, email, generate_password_hash(password)),
    )
    db.commit()

    user = db.execute(
        "SELECT * FROM users WHERE id = ?", (cursor.lastrowid,)
    ).fetchone()

    return jsonify({
        "token": make_token(user["id"]),
        "user": user_to_dict(user),
    }), 201


@app.post("/api/auth/login")
def login():
    data = json_body()

    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))

    user = get_db().execute(
        "SELECT * FROM users WHERE email = ?", (email,)
    ).fetchone()

    if user is None or not check_password_hash(user["password_hash"], password):
        return error("Incorrect email or password. Please try again.", 401)

    return jsonify({
        "token": make_token(user["id"]),
        "user": user_to_dict(user),
    })


@app.get("/api/me")
@login_required
def get_me():
    return jsonify({"user": user_to_dict(g.user)})


@app.put("/api/me")
@login_required
def update_me():
    data = json_body()

    name = str(data.get("name", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    phone = str(data.get("phone", "")).strip()

    if not name or not email:
        return error("Please enter your name and email.")
    if not EMAIL_RE.match(email):
        return error("Please enter a valid email address.")
    if len(phone) > 30:
        return error("Phone number is too long.")

    db = get_db()

    taken = db.execute(
        "SELECT 1 FROM users WHERE email = ? AND id != ?",
        (email, g.user["id"]),
    ).fetchone()
    if taken:
        return error("This email is used by another account.", 409)

    db.execute(
        "UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?",
        (name, email, phone, g.user["id"]),
    )
    db.commit()

    user = db.execute(
        "SELECT * FROM users WHERE id = ?", (g.user["id"],)
    ).fetchone()

    return jsonify({"user": user_to_dict(user)})


# ==========================================
# 6. Books catalogue
# ==========================================

# Category slugs match the links on the home page
# (catalogue.html?category=artificial-intelligence ...).
CATEGORIES = [
    {"name": "Programming", "slug": "programming", "label": "Programming"},
    {"name": "AI", "slug": "artificial-intelligence",
     "label": "Artificial Intelligence"},
    {"name": "Design", "slug": "design", "label": "Design"},
    {"name": "Data Science", "slug": "data-science", "label": "Data Science"},
    {"name": "Business", "slug": "business", "label": "Business"},
    {"name": "Technology", "slug": "technology", "label": "Technology"},
]


def find_category(value):
    """Find a category by slug or by name (case-insensitive)."""
    value = str(value or "").strip().lower()
    for category in CATEGORIES:
        if value in (category["slug"], category["name"].lower(),
                     category["label"].lower()):
            return category
    return None


def query_books(search="", category_name=""):
    sql = "SELECT * FROM books WHERE 1 = 1"
    params = []

    if search:
        sql += " AND (LOWER(title) LIKE ? OR LOWER(author) LIKE ?)"
        params += [f"%{search}%", f"%{search}%"]

    if category_name:
        sql += " AND category = ?"
        params.append(category_name)

    sql += " ORDER BY id"
    rows = get_db().execute(sql, params).fetchall()
    return [book_to_dict(r) for r in rows]


@app.get("/api/categories")
def list_categories():
    counts = {
        r["category"]: r["n"]
        for r in get_db().execute(
            "SELECT category, COUNT(*) AS n FROM books GROUP BY category"
        ).fetchall()
    }

    return jsonify({"categories": [
        {**c, "count": counts.get(c["name"], 0)} for c in CATEGORIES
    ]})


@app.get("/api/categories/<slug>/books")
def books_in_category(slug):
    category = find_category(slug)

    if category is None:
        return error("Category not found.", 404)

    search = request.args.get("q", "").strip().lower()

    return jsonify({
        "category": category,
        "books": query_books(search, category["name"]),
    })


@app.get("/api/books")
def list_books():
    search = request.args.get("q", "").strip().lower()
    raw_category = request.args.get("category", "").strip()

    category_name = ""

    if raw_category and raw_category.lower() != "all":
        category = find_category(raw_category)
        # An unknown category returns an empty list instead of everything
        category_name = category["name"] if category else raw_category

    return jsonify({"books": query_books(search, category_name)})


@app.get("/api/books/<int:book_id>")
def get_book(book_id):
    row = get_db().execute(
        "SELECT * FROM books WHERE id = ?", (book_id,)
    ).fetchone()

    if row is None:
        return error("Book not found.", 404)

    return jsonify({"book": book_to_dict(row)})


# ==========================================
# 7. My books
# ==========================================

def book_id_from_body():
    try:
        return int(json_body().get("book_id"))
    except (TypeError, ValueError):
        return None


@app.get("/api/me/books")
@login_required
def my_books():
    rows = get_db().execute(
        "SELECT b.* FROM books b JOIN user_books ub ON ub.book_id = b.id"
        " WHERE ub.user_id = ? ORDER BY ub.added_at DESC, b.id DESC",
        (g.user["id"],),
    ).fetchall()
    return jsonify({"books": [book_to_dict(r) for r in rows]})


@app.post("/api/me/books")
@login_required
def add_my_book():
    book_id = book_id_from_body()
    if book_id is None:
        return error("book_id is required.")

    db = get_db()
    book = db.execute("SELECT * FROM books WHERE id = ?", (book_id,)).fetchone()
    if book is None:
        return error("Book not found.", 404)

    already = db.execute(
        "SELECT 1 FROM user_books WHERE user_id = ? AND book_id = ?",
        (g.user["id"], book_id),
    ).fetchone()
    if already:
        return error("This book is already in your library.", 409)

    # Adding a book records a payment (record only, no real charge).
    db.execute(
        "INSERT INTO user_books (user_id, book_id) VALUES (?, ?)",
        (g.user["id"], book_id),
    )
    db.execute(
        "INSERT INTO payments (user_id, book_id, title, amount, status)"
        " VALUES (?, ?, ?, ?, 'completed')",
        (g.user["id"], book_id, book["title"], book["price"]),
    )
    db.commit()

    return jsonify({"book": book_to_dict(book)}), 201


@app.delete("/api/me/books/<int:book_id>")
@login_required
def remove_my_book(book_id):
    db = get_db()
    cursor = db.execute(
        "DELETE FROM user_books WHERE user_id = ? AND book_id = ?",
        (g.user["id"], book_id),
    )
    db.commit()

    if cursor.rowcount == 0:
        return error("Book is not in your library.", 404)

    return jsonify({"ok": True})


# ==========================================
# 8. Favorites
# ==========================================

@app.get("/api/me/favorites")
@login_required
def my_favorites():
    rows = get_db().execute(
        "SELECT b.* FROM books b JOIN favorites f ON f.book_id = b.id"
        " WHERE f.user_id = ? ORDER BY f.added_at DESC, b.id DESC",
        (g.user["id"],),
    ).fetchall()
    return jsonify({"books": [book_to_dict(r) for r in rows]})


@app.post("/api/me/favorites")
@login_required
def add_favorite():
    book_id = book_id_from_body()
    if book_id is None:
        return error("book_id is required.")

    db = get_db()
    book = db.execute("SELECT * FROM books WHERE id = ?", (book_id,)).fetchone()
    if book is None:
        return error("Book not found.", 404)

    already = db.execute(
        "SELECT 1 FROM favorites WHERE user_id = ? AND book_id = ?",
        (g.user["id"], book_id),
    ).fetchone()
    if already:
        return error("This book is already in your favorites.", 409)

    db.execute(
        "INSERT INTO favorites (user_id, book_id) VALUES (?, ?)",
        (g.user["id"], book_id),
    )
    db.commit()

    return jsonify({"book": book_to_dict(book)}), 201


@app.delete("/api/me/favorites/<int:book_id>")
@login_required
def remove_favorite(book_id):
    db = get_db()
    cursor = db.execute(
        "DELETE FROM favorites WHERE user_id = ? AND book_id = ?",
        (g.user["id"], book_id),
    )
    db.commit()

    if cursor.rowcount == 0:
        return error("Book is not in your favorites.", 404)

    return jsonify({"ok": True})


# ==========================================
# 9. Payment records
# ==========================================

@app.get("/api/me/payments")
@login_required
def my_payments():
    rows = get_db().execute(
        "SELECT id, book_id, title, amount, status, created_at"
        " FROM payments WHERE user_id = ? ORDER BY id DESC",
        (g.user["id"],),
    ).fetchall()

    return jsonify({"payments": [
        {
            "id": r["id"],
            "book_id": r["book_id"],
            "title": r["title"],
            "amount": r["amount"],
            "status": r["status"],
            "date": r["created_at"][:10],
        }
        for r in rows
    ]})


# ==========================================
# 10. AI Chatbot
# ==========================================

@app.post("/api/chat")
def chat():

    if not client:
        return jsonify({
            "error": "Gemini API key is missing. Check your .env file."
        }), 500

    data = request.get_json(silent=True) or {}
    message = str(data.get("message", "")).strip()

    if not message:
        return jsonify({
            "error": "Please enter a message."
        }), 400

    # The catalogue now comes from the database, not from the browser.
    rows = get_db().execute(
        "SELECT title, author, category, description, price"
        " FROM books ORDER BY id LIMIT 100"
    ).fetchall()
    catalog = [dict(r) for r in rows]

    catalog_text = json.dumps(catalog, ensure_ascii=False)

    prompt = (
        "Available books in Smart Library:\n"
        f"{catalog_text}\n\n"
        "User question:\n"
        f"{message}"
    )

    try:
        response = client.models.generate_content(
            model=MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=(
                    "You are the AI assistant for Smart Library. "
                    "Help users find books and answer their questions. "
                    "Reply in the same language used by the user. "
                    "Be friendly, clear, and helpful. "
                    "Recommend books from the supplied catalog when relevant. "
                    "Never invent book details or claim a book is available "
                    "unless it appears in the supplied catalog. "
                    "If the requested book is not in the catalog, "
                    "explain that clearly. "
                    "You may also answer general knowledge questions."
                )
            )
        )

        reply = response.text

        if not reply:
            app.logger.error("Gemini returned an empty response.")

            return jsonify({
                "error": "The AI returned an empty response. Please try again."
            }), 502

        return jsonify({
            "reply": reply
        }), 200

    except Exception:
        # Print the full error in the Flask terminal
        app.logger.exception("Gemini request failed")

        return jsonify({
            "error": (
                "Gemini could not answer. "
                "Check the Flask terminal for details."
            )
        }), 502


# ==========================================
# 11. Start the Flask server
# ==========================================
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port, debug=False)
