/* Smart Library - AI Assistant with Library Walkthrough UI */

const libraryBooks = [
    {
        title: "Clean Code",
        author: "Robert C. Martin",
        category: "Programming",
        description: "Learn to write clean, readable, maintainable code."
    },
    {
        title: "Introduction to Algorithms",
        author: "Thomas H. Cormen",
        category: "Programming",
        description: "Learn algorithms and problem-solving techniques."
    },
    {
        title: "Artificial Intelligence",
        author: "Stuart Russell",
        category: "AI",
        description: "Explore intelligent systems and AI fundamentals."
    },
    {
        title: "Deep Learning",
        author: "Ian Goodfellow",
        category: "AI",
        description: "Learn about neural networks and deep learning."
    },
    {
        title: "The Design of Everyday Things",
        author: "Don Norman",
        category: "Design",
        description: "Understand the principles of user-centered design."
    },
    {
        title: "The Lean Startup",
        author: "Eric Ries",
        category: "Business",
        description: "Discover ideas for building and testing businesses."
    }
];

(function initLibraryAssistant() {
    if (document.getElementById("libraryChatWidget")) return;

    // إضافة التنسيقات والديناميكية الخاصة بالواجهة المتحركة المستوحاة من الممر
    const customStyle = document.createElement("style");
    customStyle.textContent = `
        @keyframes subtlePulse {
            0% { transform: scale(1); box-shadow: 0 4px 15px rgba(0,0,0,0.3); }
            50% { transform: scale(1.05); box-shadow: 0 6px 20px rgba(212, 160, 23, 0.4); }
            100% { transform: scale(1); box-shadow: 0 4px 15px rgba(0,0,0,0.3); }
        }

        @keyframes slideUpFade {
            from { opacity: 0; transform: translateY(30px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .library-chat-widget {
            position: fixed;
            bottom: 25px;
            right: 25px;
            z-index: 99999;
            font-family: 'Segoe UI', system-ui, sans-serif;
        }

        .chat-launcher {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, #2c3e50, #1a252f);
            border: 2px solid #d4a373;
            color: #fff;
            font-size: 24px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: subtlePulse 3s infinite ease-in-out;
            transition: all 0.3s ease;
        }

        .chat-window {
            position: fixed;
            bottom: 95px;
            right: 25px;
            width: 380px;
            max-width: 90vw;
            height: 520px;
            background: #ffffff;
            border-radius: 16px;
            box-shadow: 0 12px 35px rgba(0, 0, 0, 0.25);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            border: 1px solid #e0e0e0;
            animation: slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .chat-header {
            background: linear-gradient(135deg, #1f2937, #111827);
            color: #f3f4f6;
            padding: 16px 20px;
            display: flex;
            align-items: center;
            gap: 12px;
            border-bottom: 2px solid #d4a373;
        }

        .chat-avatar {
            width: 38px;
            height: 38px;
            background: #d4a373;
            color: #111827;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 18px;
        }

        .chat-header-text h2 {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
            color: #ffffff;
        }

        .chat-header-text p {
            margin: 2px 0 0;
            font-size: 12px;
            color: #9ca3af;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .online-dot {
            width: 8px;
            height: 8px;
            background-color: #10b981;
            border-radius: 50%;
            display: inline-block;
        }

        .chat-close {
            margin-left: auto;
            background: transparent;
            border: none;
            color: #9ca3af;
            font-size: 22px;
            cursor: pointer;
        }

        .chat-messages {
            flex: 1;
            padding: 16px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 12px;
            background: #f9fafb;
        }

        .chat-message {
            max-width: 82%;
            padding: 12px 16px;
            border-radius: 12px;
            font-size: 14px;
            line-height: 1.5;
            white-space: pre-wrap;
            word-wrap: break-word;
        }

        .chat-message.user {
            align-self: flex-end;
            background: #2563eb;
            color: #ffffff;
            border-bottom-right-radius: 4px;
        }

        .chat-message.bot {
            align-self: flex-start;
            background: #ffffff;
            color: #1f2937;
            border: 1px solid #e5e7eb;
            border-bottom-left-radius: 4px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.03);
        }

        .chat-suggestions {
            display: flex;
            gap: 8px;
            padding: 8px 16px;
            background: #f3f4f6;
            overflow-x: auto;
            border-top: 1px solid #e5e7eb;
        }

        .chat-suggestions button {
            white-space: nowrap;
            background: #ffffff;
            border: 1px solid #d1d5db;
            border-radius: 20px;
            padding: 6px 12px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s;
            color: #1d3152;
        }

        .chat-suggestions button:hover {
            background: #2563eb;
            color: #ffffff;
            border-color: #2563eb;
        }

        .chat-input-area {
            display: flex;
            padding: 12px 16px;
            background: #ffffff;
            border-top: 1px solid #e5e7eb;
            gap: 8px;
        }

        .chat-input-area input {
            flex: 1;
            border: 1px solid #d1d5db;
            border-radius: 20px;
            padding: 8px 16px;
            font-size: 14px;
            outline: none;
        }

        .chat-input-area input:focus {
            border-color: #2563eb;
        }

        .chat-input-area button {
            background: #2563eb;
            color: white;
            border: none;
            border-radius: 50%;
            width: 36px;
            height: 36px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .chat-disclaimer {
            text-align: center;
            font-size: 10px;
            color: #9ca3af;
            padding: 4px 0 8px;
            margin: 0;
            background: #ffffff;
        }
    `;
    document.head.appendChild(customStyle);

    const widget = document.createElement("section");
    widget.id = "libraryChatWidget";
    widget.className = "library-chat-widget";

    widget.innerHTML = `
        <button class="chat-launcher" id="chatLauncher"
                type="button"
                aria-label="Open AI Library Assistant"
                aria-expanded="false">
            <span class="chat-launcher-icon">✦</span>
        </button>

        <section class="chat-window" id="chatWindow"
                 aria-label="AI Library Assistant" hidden>
            <header class="chat-header">
                <div class="chat-avatar">📚</div>

                <div class="chat-header-text">
                    <h2>AI Library Assistant</h2>
                    <p>
                        <span class="online-dot"></span>
                        AI Live Assistant
                    </p>
                </div>

                <button class="chat-close" id="chatClose"
                        type="button"
                        aria-label="Close chat">×</button>
            </header>

            <div class="chat-messages" id="chatMessages"
                 aria-live="polite"
                 aria-label="Conversation"></div>

            <div class="chat-suggestions" id="chatSuggestions">
                <button type="button" data-prompt="What books do we have in the library?">
                    📚 Library Books
                </button>
                <button type="button" data-prompt="Give me a quick recipe for pasta">
                    🍳 Cooking Tips
                </button>
                <button type="button" data-prompt="How does AI work in simple words?">
                    🤖 AI Explained
                </button>
            </div>

            <form class="chat-input-area" id="chatForm">
                <input id="chatInput"
                       type="text"
                       placeholder="Ask me anything..."
                       aria-label="Your message"
                       autocomplete="off"
                       maxlength="1000"
                       required>
                <button type="submit"
                        id="chatSendButton"
                        aria-label="Send message">➤</button>
            </form>

            <p class="chat-disclaimer">
                Powered by Smart AI Assistant
            </p>
        </section>
    `;

    document.body.appendChild(widget);

    const launcher = document.getElementById("chatLauncher");
    const chatWindow = document.getElementById("chatWindow");
    const closeButton = document.getElementById("chatClose");
    const messages = document.getElementById("chatMessages");
    const form = document.getElementById("chatForm");
    const input = document.getElementById("chatInput");
    const sendButton = document.getElementById("chatSendButton");
    const suggestions = document.getElementById("chatSuggestions");

    let isSending = false;

    function addMessage(text, sender = "bot") {
        const bubble = document.createElement("div");
        bubble.className = `chat-message ${sender}`;
        bubble.textContent = text;

        messages.appendChild(bubble);
        messages.scrollTop = messages.scrollHeight;

        return bubble;
    }

    async function sendMessage(text) {
        const message = text.trim();

        if (!message || isSending) return;

        addMessage(message, "user");

        isSending = true;
        input.disabled = true;
        sendButton.disabled = true;

        const loadingMessage = addMessage("Thinking... 🤖", "bot");

        try {
            const q = message.toLowerCase();
            
            // محتوى المكتبة
            if (q.includes("محتوى") || q.includes("مكتبه") || q.includes("كتب المكتبة") || q.includes("library books") || (q.includes("books") && q.includes("what"))) {
                let bookList = libraryBooks.map(b => `• ${b.title} by ${b.author} (${b.category}): ${b.description}`).join("\n");
                loadingMessage.textContent = `Here are the books available in our Smart Library:\n\n${bookList}`;
                return;
            }

            // محرك ذكاء اصطناعي مفتوح يجيب عن أي موضوع (طبخ، علوم، تكنولوجيا، إلخ)
            const systemPrompt = `You are a brilliant, versatile, and helpful AI assistant for Smart Library. You can answer ANY question the user asks accurately, naturally, and in detail (whether it's about cooking, programming, science, history, or daily life). User question: ${message}`;

            const response = await fetch(`https://text.pollinations.ai/${encodeURIComponent(systemPrompt)}`);
            
            if (!response.ok) {
                throw new Error("Failed to fetch AI response");
            }

            const reply = await response.text();

            if (!reply || reply.trim() === "") {
                throw new Error("Empty response");
            }

            loadingMessage.textContent = reply;

        } catch (error) {
            console.error("AI Assistant Error:", error);
            loadingMessage.textContent = "I'm here and ready to help! Please try asking your question again.";
        } finally {
            isSending = false;
            input.disabled = false;
            sendButton.disabled = false;
            input.focus();
        }
    }

    function openChat() {
        chatWindow.hidden = false;
        launcher.setAttribute("aria-expanded", "true");
        launcher.classList.add("is-open");
        input.focus();

        if (!messages.dataset.initialized) {
            addMessage(
                "Hi! 👋 I'm your Smart AI Assistant. Ask me anything—recipes, programming, science, or about our library books!"
            );
            messages.dataset.initialized = "true";
        }
    }

    function closeChat() {
        chatWindow.hidden = true;
        launcher.setAttribute("aria-expanded", "false");
        launcher.classList.remove("is-open");
        launcher.focus();
    }

    launcher.addEventListener("click", () => {
        if (chatWindow.hidden) {
            openChat();
        } else {
            closeChat();
        }
    });

    closeButton.addEventListener("click", closeChat);

    form.addEventListener("submit", async event => {
        event.preventDefault();
        if (isSending) return;

        const message = input.value.trim();
        if (!message) return;

        input.value = "";
        await sendMessage(message);
    });

    suggestions.addEventListener("click", event => {
        const button = event.target.closest("[data-prompt]");
        if (!button || isSending) return;

        sendMessage(button.dataset.prompt);
    });

})();