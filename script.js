const chatArea = document.getElementById('chatArea');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const imageBtn = document.getElementById('imageBtn');
const typingIndicator = document.getElementById('typingIndicator');

// 🔑 PUT YOUR NEW API KEYS HERE (REGENERATE THEM!)
const OPENROUTER_API_KEY = '';
const HF_API_KEY = 'YOUR_NEW_HF_KEY';

function scrollToBottom() {
    chatArea.scrollTop = chatArea.scrollHeight;
}

function showTypingIndicator() {
    typingIndicator.style.display = 'flex';
    chatArea.appendChild(typingIndicator);
    scrollToBottom();
}

function hideTypingIndicator() {
    typingIndicator.style.display = 'none';
}

function addMessage(content, sender, isHtml = false) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', `${sender}-message`);

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('message-content');

    if (isHtml) {
        contentDiv.innerHTML = content;
    } else {
        contentDiv.textContent = content;
    }

    messageDiv.appendChild(contentDiv);
    chatArea.insertBefore(messageDiv, typingIndicator);
    scrollToBottom();
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.classList.add('error-message');
    errorDiv.textContent = message;
    chatArea.insertBefore(errorDiv, typingIndicator);
    scrollToBottom();
}

async function handleSendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    addMessage(text, 'user');
    userInput.value = '';
    showTypingIndicator();

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:5500', // REQUIRED
                'X-Title': 'AI Chatbot' // REQUIRED
            },
            body: JSON.stringify({
                model: 'mistralai/mistral-7b-instruct',
                messages: [
                    {
                        role: 'user',
                        content: text
                    }
                ]
            })
        });

        // Debugging (VERY useful)
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        const botReply =
            data.choices?.[0]?.message?.content ||
            "Sorry, I couldn't understand that.";

        hideTypingIndicator();
        addMessage(botReply, 'bot');

    } catch (error) {
        hideTypingIndicator();
        console.error('Text Generation Error:', error);
        showError('Failed to generate text. Check API key or headers.');
    }
}

async function handleGenerateImage() {
    const prompt = userInput.value.trim();
    if (!prompt) {
        showError("Please enter a prompt for the image.");
        return;
    }

    addMessage(`Generate image: ${prompt}`, 'user');
    userInput.value = '';
    showTypingIndicator();

    try {
        const response = await fetch(
            'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${HF_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    inputs: prompt
                })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error: ${response.status} - ${errorText}`);
        }

        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);

        hideTypingIndicator();

        const imageHtml = `
            <div style="margin-bottom: 8px;">
                Generated image for: <strong>${prompt}</strong>
            </div>
            <img src="${imageUrl}" style="max-width:100%; border-radius:8px;" />
        `;

        addMessage(imageHtml, 'bot', true);

    } catch (error) {
        hideTypingIndicator();
        console.error('Image Generation Error:', error);
        showError('Failed to generate image.');
    }
}

// Event Listeners
sendBtn.addEventListener('click', handleSendMessage);
imageBtn.addEventListener('click', handleGenerateImage);

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSendMessage();
    }
});