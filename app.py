
import os
import json
import logging
from pathlib import Path

from flask import Flask, request, jsonify, send_from_directory
from dotenv import load_dotenv
from google import genai
from google.genai import types


# ==========================================
# 1. Project configuration
# ==========================================

BASE_DIR = Path(__file__).resolve().parent

load_dotenv(BASE_DIR / ".env")

API_KEY = os.getenv("GEMINI_API_KEY")
MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

app = Flask(__name__)
app.logger.setLevel(logging.INFO)

client = genai.Client(api_key=API_KEY) if API_KEY else None


# ==========================================
# 2. Home page
# ==========================================

@app.get("/")
def home():
    return send_from_directory(str(BASE_DIR), "home.html")


# ==========================================
# 3. Serve CSS, JavaScript and video files
# ==========================================

@app.get("/<path:filename>")
def serve_files(filename):
    requested_path = Path(filename)

    # Block hidden files and directory traversal
    if (
        requested_path.is_absolute()
        or ".." in requested_path.parts
        or any(part.startswith(".") for part in requested_path.parts)
    ):
        return "Not found", 404

    file_path = BASE_DIR / requested_path

    if not file_path.is_file():
        app.logger.warning("File not found: %s", file_path)
        return "File not found", 404

    return send_from_directory(str(BASE_DIR), filename)


# ==========================================
# 4. Check backend status
# ==========================================

@app.get("/api/health")
def health():
    return jsonify({
        "backend": "running",
        "api_key_configured": bool(API_KEY),
        "provider": "Google Gemini",
        "model": MODEL
    })


# ==========================================
# 5. AI Chatbot
# ==========================================

@app.post("/api/chat")
def chat():

    if not client:
        return jsonify({
            "error": "Gemini API key is missing. Check your .env file."
        }), 500

    data = request.get_json(silent=True) or {}

    message = str(data.get("message", "")).strip()
    catalog = data.get("catalog", [])

    if not message:
        return jsonify({
            "error": "Please enter a message."
        }), 400

    if not isinstance(catalog, list):
        catalog = []

    # Limit the number of books sent to the AI
    catalog = [
        book for book in catalog[:100]
        if isinstance(book, dict)
    ]

    catalog_text = json.dumps(
        catalog,
        ensure_ascii=False
    )

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
# 6. Start the Flask server
# ==========================================
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port, debug=False)