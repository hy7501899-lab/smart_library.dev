/* Smart Library - AI Assistant JavaScript */

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
    const widget = document.getElementById("libraryChatWidget");
    if (!widget) return;

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

            // Answer questions about books in the library.
            if (
                q.includes("محتوى") ||
                q.includes("مكتبه") ||
                q.includes("كتب المكتبة") ||
                q.includes("library books") ||
                (q.includes("books") && q.includes("what"))
            ) {
                const bookList = libraryBooks
                    .map(book => `• ${book.title} by ${book.author} (${book.category}): ${book.description}`)
                    .join("\n");

                loadingMessage.textContent =
                    `Here are the books available in our Smart Library:\n\n${bookList}`;
                return;
            }

            // Ask the external AI endpoint for a response.
            const systemPrompt =
                `You are a brilliant, versatile, and helpful AI assistant for Smart Library. ` +
                `You can answer ANY question the user asks accurately, naturally, and in detail ` +
                `(whether it's about cooking, programming, science, history, or daily life). ` +
                `User question: ${message}`;

            const response = await fetch(
                `https://text.pollinations.ai/${encodeURIComponent(systemPrompt)}`
            );

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
            loadingMessage.textContent =
                "I'm here and ready to help! Please try asking your question again.";
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
