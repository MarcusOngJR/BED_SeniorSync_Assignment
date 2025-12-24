(function () {
  // Inject styles
  const style = document.createElement('style');
  style.textContent = `
    .chatbot-btn {
      position: fixed;
      bottom: 50px;
      right: 50px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 50%;
      width: 80px;
      height: 80px;
      font-size: 30px;
      cursor: pointer;
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      z-index: 1000;
    }

    .chatbox {
      position: fixed;
      bottom: 150px;
      right: 70px;
      width: 25%;
      max-height: 800px;
      background: white;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      display: none;
      flex-direction: column;
      overflow: hidden;
      z-index: 3000;
      font-family: Arial, sans-serif;
    }

    .chatbox-header {
      background-color: #007bff;
      color: white;
      padding: 10px;
      font-weight: bold;
    }

    .chatbox-body {
      padding: 10px;
      height: 400px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 10px;
      background: #f5f5f5;
    }

    .chatbox-footer {
      padding: 10px;
      display: flex;
      border-top: 1px solid #ccc;
    }

    .chatbox-footer input {
      flex: 1;
      padding: 8px;
      font-size: 14px;
    }

    .chatbox-footer button {
      padding: 8px 10px;
      margin-left: 5px;
      background-color: #007bff;
      color: white;
      border: none;
      cursor: pointer;
    }

    .message {
      padding: 8px 12px;
      max-width: 70%;
      border-radius: 15px;
      word-wrap: break-word;
    }

    .user-msg {
      align-self: flex-end;
      background-color: #dcf8c6;
    }

    .bot-msg {
      align-self: flex-start;
      background-color: #eee;
    }
  `;
  document.head.appendChild(style);

  // Create chatbot button
  const btn = document.createElement('button');
  btn.className = 'chatbot-btn';
  btn.innerHTML = '💬';
  document.body.appendChild(btn);

  // Create chatbox
  const chatbox = document.createElement('div');
  chatbox.className = 'chatbox';
  chatbox.innerHTML = `
    <div class="chatbox-header">AI Assistant</div>
    <div class="chatbox-body" id="chatbox-body"></div>
    <div class="chatbox-footer">
      <input type="text" id="chat-input" placeholder="Type a message..." />
      <button id="chat-send">Send</button>
    </div>
  `;
  document.body.appendChild(chatbox);

  // Toggle chatbox on button click
  btn.addEventListener('click', () => {
    const isOpen = chatbox.style.display === 'flex';
    chatbox.style.display = isOpen ? 'none' : 'flex';

    if (isOpen) {
      // If closing the chat, clear chat history
      clearChatHistory();
    }
  });

  // Handle sending messages
  document.getElementById('chat-send').addEventListener('click', sendMessage);
  document.getElementById('chat-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') sendMessage();
  });

async function sendMessage() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;

  const chatBody = document.getElementById('chatbox-body');

  // Add user message
  const userMsg = document.createElement('div');
  userMsg.className = 'message user-msg';
  userMsg.textContent = text;
  chatBody.appendChild(userMsg);

  input.value = '';
  chatBody.scrollTop = chatBody.scrollHeight;

  // Get response from API
  const response = await getResponse(text);

  // Add bot message
  const botMsg = document.createElement('div');
  botMsg.className = 'message bot-msg';
  botMsg.textContent = response.response || 'Sorry, no response received.';
  chatBody.appendChild(botMsg);

  chatBody.scrollTop = chatBody.scrollHeight;
}



async function getResponse(message) {
  try {
    const user = JSON.parse(localStorage.getItem('user')); // assumes user object with token is stored here

    const response = await fetch('/chatbot/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user?.token}`
      },
      body: JSON.stringify({ message })
    });

    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error('Error fetching response:', error);
    return { response: 'Sorry, I could not process your request.' };
  }
}


async function clearChatHistory() {
  try {
    const user = JSON.parse(localStorage.getItem('user'));

    const response = await fetch('/chatbot/clearHistory', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user?.token}`
      }
    });

    if (!response.ok) throw new Error('Failed to clear history');

    console.log('Chat history cleared.');

    // Clear the chatbox body in the UI
    const chatBody = document.getElementById('chatbox-body');
    if (chatBody) {
      chatBody.innerHTML = ''; // remove all message elements
    }

  } catch (err) {
    console.error('Error clearing chat history:', err);
  }
}
})();