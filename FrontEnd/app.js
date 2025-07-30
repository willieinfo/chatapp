document.addEventListener('DOMContentLoaded', () => {
    const chatIcon = document.querySelector('.chatIcon');
    const chatWindow = document.querySelector('.chatWindow');
    const messageContainer = document.getElementById('messageContainer');
    const messageInput = document.getElementById('messageInput');
    const sendMessageBtn = document.getElementById('sendMessage');
    const chatSelector = document.getElementById('chatSelector');
    const clearIcon = document.querySelector('.clearIcon');
    const userNameBtn = document.getElementById('userNameBtn');
    const userNameInput = document.getElementById('userNameInput')

    const socket = io('http://localhost:3000'); // Connect to the correct server

    let currentChat = 'user1'; // Default chat with user1
    let currentRoom = ''

    // Toggle chat window visibility
    chatIcon.addEventListener('click', () => {
        chatWindow.style.display = chatWindow.style.display === 'none' ? 'block' : 'none';
    });
    // clearIcon.addEventListener('click', () => {
    //     const confirmed = confirm(`Do you want to delete all chat data?`)
    //     if (confirmed) localStorage.removeItem('chatMessages')
    // });
    clearIcon.addEventListener('click', () => {
        const confirmed = confirm(`Do you want to delete all chat data?`);
        if (confirmed) {
            const userName = localStorage.getItem('userName');
            localStorage.clear();
            if (userName) localStorage.setItem('userName', userName); // Restore username
        }
    });

    userNameBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const userName = userNameInput.value.trim();
        if (userName) {
            localStorage.setItem('userName', userName); // Save username
            socket.emit('setUsername', userName); // Send username to server
            userNameInput.value = ''; // Clear input
        }
    });

    // Load messages from localStorage
    function loadMessages() {
        const messages = JSON.parse(localStorage.getItem('chatMessages')) || {};
        const userName = localStorage.getItem('userName') || 'Anonymous'; // Fallback if no username
        messageContainer.innerHTML = ''; // Clear the message container
        if (messages[currentChat]) {
            messages[currentChat].forEach(msg => {
                const msgDiv = document.createElement('div');
                msgDiv.className = 'message';

                // Create the message content
                const messageContent = document.createElement('div');
                messageContent.textContent = msg.message;

                // Create sender info (name and timestamp)
                const senderInfo = document.createElement('div');
                senderInfo.className = 'senderInfo';
                senderInfo.textContent = `${msg.sender.substring(0, 5).toUpperCase()} - ${msg.timestamp}`;
                senderInfo.style.fontSize = 'small';
                senderInfo.style.fontStyle = 'italic';
                senderInfo.style.alignSelf = 'flex-end';

                msgDiv.appendChild(messageContent);
                msgDiv.appendChild(senderInfo);

                // Style based on username
                msgDiv.style.alignSelf = msg.sender === userName ? 'flex-end' : 'flex-start';
                msgDiv.style.backgroundColor = msg.sender === userName ? 'rgb(0,64,128)' : 'rgb(91, 147, 193)';
                msgDiv.style.color = 'white';

                messageContainer.appendChild(msgDiv);
            });
        }
    }

    // function loadMessages() {
    //     const messages = JSON.parse(localStorage.getItem('chatMessages')) || {};
    //     messageContainer.innerHTML = ''; // Clear the message container
    //     if (messages[currentChat]) {
    //         messages[currentChat].forEach(msg => {
    //             const msgDiv = document.createElement('div');
    //             msgDiv.className = 'message';

    //             // Create the message content
    //             const messageContent = document.createElement('div');
    //             messageContent.textContent = msg.message;

    //             // Create sender info (name and timestamp)
    //             const senderInfo = document.createElement('div');
    //             senderInfo.className = 'senderInfo';
    //             senderInfo.textContent = `${msg.sender.substring(0,5).toUpperCase()} - ${msg.timestamp}`;
    //             senderInfo.style.fontSize = 'small';
    //             senderInfo.style.fontStyle = 'italic';
    //             senderInfo.style.alignSelf = 'flex-end';

    //             msgDiv.appendChild(messageContent);
    //             msgDiv.appendChild(senderInfo);

    //             console.log(msg.sender,socket.id)
    //             msgDiv.style.alignSelf = msg.sender === socket.id ? 'flex-end' : 'flex-start';
    //             msgDiv.style.backgroundColor = msg.sender === socket.id ? 'rgb(0,64,128)' : 'rgb(91, 147, 193)';
    //             msgDiv.style.color = 'white';

    //             messageContainer.appendChild(msgDiv);
    //         });
    //     }
    // }

    // Save messages to localStorage
    // function saveMessages() {
    //     const messages = JSON.parse(localStorage.getItem('chatMessages')) || {};
    //     const messageData = {
    //         sender: socket.id, // or use username here
    //         message: messageInput.value,
    //         timestamp: new Date().toLocaleTimeString(),
    //     };

    //     if (!messages[currentChat]) {
    //         messages[currentChat] = [];
    //     }

    //     messages[currentChat].push(messageData);
    //     localStorage.setItem('chatMessages', JSON.stringify(messages));
    // }

    function saveMessages() {
        const messages = JSON.parse(localStorage.getItem('chatMessages')) || {};
        const userName = localStorage.getItem('userName') || 'Anonymous';
        const messageData = {
            sender: userName, // Use username
            message: messageInput.value,
            timestamp: new Date().toLocaleTimeString(),
        };

        if (!messages[currentChat]) {
            messages[currentChat] = [];
        }

        messages[currentChat].push(messageData);
        localStorage.setItem('chatMessages', JSON.stringify(messages));
    }    

    // Handle message sending (Private or Broadcast)
sendMessageBtn.addEventListener('click', () => {
    if (messageInput.value.trim()) {
        const userName = localStorage.getItem('userName') || 'Anonymous';
        const messageData = {
            sender: userName, // Use username
            message: messageInput.value,
            timestamp: new Date().toLocaleTimeString()
        };

        socket.emit('chatMessage', {
            sender: messageData.sender,
            message: messageData.message,
            timestamp: messageData.timestamp
        });

        saveMessages();
        messageInput.value = '';
        messageContainer.scrollTop = messageContainer.scrollHeight;
    }
});   

// sendMessageBtn.addEventListener('click', () => {
    //     if (messageInput.value.trim()) {
    //         // const messageType = messageTypeSelector.value;  
    //         const messageData = {
    //             sender: socket.id, // or username
    //             message: messageInput.value,
    //             timestamp: new Date().toLocaleTimeString()
    //         };

    //         socket.emit('chatMessage', {
    //             sender : messageData.sender,
    //             message: messageData.message,
    //             timestamp: messageData.timestamp
    //         });

    //         // Save the message in localStorage
    //         saveMessages();

    //         // Clear the input field
    //         messageInput.value = '';
    //         messageContainer.scrollTop = messageContainer.scrollHeight; // Scroll to the bottom
    //     }
    // });

    // Handle chat selection change (room selection)
    chatSelector.addEventListener('change', (e) => {
        currentChat = e.target.value;
        socket.emit('joinRoom', currentChat);
        loadMessages();
    });

    // Listen for incoming messages in real-time
socket.on('chatMessage', (data) => {
    console.log('Received chatMessage:', data);
    const userName = localStorage.getItem('userName') || 'Anonymous';
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message';

    const messageContent = document.createElement('div');
    messageContent.textContent = data.message;

    const senderInfo = document.createElement('div');
    senderInfo.className = 'senderInfo';
    senderInfo.textContent = `${data.sender} - ${data.timestamp}`;

    msgDiv.appendChild(messageContent);
    msgDiv.appendChild(senderInfo);

    msgDiv.style.alignSelf = data.sender === userName ? 'flex-end' : 'flex-start';
    msgDiv.style.backgroundColor = data.sender === userName ? 'rgb(0,64,128)' : 'rgb(91, 147, 193)';
    msgDiv.style.color = 'white';

    messageContainer.appendChild(msgDiv);
    messageContainer.scrollTop = messageContainer.scrollHeight;
});

    // socket.on('chatMessage', (data) => {
    //     console.log('Received chatMessage:', data);
    //     // if (data.room === currentRoom) {
    //         const msgDiv = document.createElement('div');
    //         msgDiv.className = 'message';

    //         // Create message content and sender info
    //         const messageContent = document.createElement('div');
    //         messageContent.textContent = data.message;

    //         const senderInfo = document.createElement('div');
    //         senderInfo.className = 'senderInfo';
    //         senderInfo.textContent = `${data.sender} - ${data.timestamp}`;

    //         msgDiv.appendChild(messageContent);
    //         msgDiv.appendChild(senderInfo);

    //         // Apply alignment based on sender (current user or not)
    //         msgDiv.style.alignSelf = data.sender === socket.id ? 'flex-end' : 'flex-start';
    //         msgDiv.style.backgroundColor = data.sender === socket.id ? 'rgb(0,64,128)' : 'rgb(91, 147, 193)';
    //         msgDiv.style.color = 'white';

    //         messageContainer.appendChild(msgDiv);
    //     // }
    // });

    // Listen for private messages
    socket.on('privateMessage', (data) => {
        if (data.receiverId === socket.id) {
            const msgDiv = document.createElement('div');
            msgDiv.className = 'message';

            // Display private message
            const messageContent = document.createElement('div');
            messageContent.textContent = `Private from ${data.sender}: ${data.message}`;

            const senderInfo = document.createElement('div');
            senderInfo.className = 'senderInfo';
            senderInfo.textContent = `${data.sender} - ${data.timestamp}`;

            msgDiv.appendChild(messageContent);
            msgDiv.appendChild(senderInfo);

            msgDiv.style.alignSelf = 'flex-start';
            msgDiv.style.backgroundColor = 'rgb(255, 99, 71)';  // Private message color
            msgDiv.style.color = 'white';

            messageContainer.appendChild(msgDiv);
        }
    });

    // Listen for broadcast messages
    socket.on('broadcastMessage', (data) => {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message';

        // Display broadcast message
        const messageContent = document.createElement('div');
        messageContent.textContent = `Broadcast from ${data.sender}: ${data.message}`;

        const senderInfo = document.createElement('div');
        senderInfo.className = 'senderInfo';
        senderInfo.textContent = `${data.sender} - ${data.timestamp}`;

        msgDiv.appendChild(messageContent);
        msgDiv.appendChild(senderInfo);

        msgDiv.style.alignSelf = 'flex-start';
        msgDiv.style.backgroundColor = 'rgb(91, 147, 193)';  // Broadcast message color
        msgDiv.style.color = 'white';

        messageContainer.appendChild(msgDiv);
    });

    // Initial load of messages
    socket.on('connect', () => {
        loadMessages(); // Call loadMessages after connection
    });    

    function getClientId() {
        let clientId = localStorage.getItem('clientId');
        if (!clientId) {
            clientId = 'client_' + Math.random().toString(36).substr(2, 9); // Random ID
            localStorage.setItem('clientId', clientId);
        }
        return clientId;
    }    
});


