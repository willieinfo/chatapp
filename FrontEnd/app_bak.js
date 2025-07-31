document.addEventListener('DOMContentLoaded', () => {
    const chatIcon = document.querySelector('.chatIcon');
    const chatWindow = document.querySelector('.chatWindow');
    const messageContainer = document.getElementById('messageContainer');
    const messageInput = document.getElementById('messageInput');
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    const chatSelector = document.getElementById('chatSelector');
    
    const clearIcon = document.querySelector('.clearIcon');
    const userNameBtn = document.getElementById('userNameBtn');
    const userNameInput = document.getElementById('userNameInput')

    const userNameForm = document.querySelector('.userNameForm');   

    const socket = io('http://localhost:3000'); // Connect to the correct server

    let currentChat = 'user1'; // Default chat with user1

    userNameForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const userName = userNameInput.value.trim();
        if (userName) {
            localStorage.setItem('userName', userName);
            socket.emit('joinRoom', { room: 'default', userName }); // Join a default room
            userNameForm.style.display = 'none'; // Hide form after submission
            chatSelector.disabled = false; // Enable chat selector
        }
    });

    // Handle chat selection
    chatSelector.addEventListener('change', (e) => {
        currentChat = e.target.value;
        messageContainer.innerHTML = ''; // Clear messages when switching chats
        socket.emit('joinRoom', currentChat);
        loadMessages(currentChat); // Load saved messages for the selected chat
    });    
    // chatSelector.addEventListener('change', (e) => {
    //     currentChat = e.target.value;
    //     socket.emit('joinRoom', currentChat);
    //     loadMessages();
    // });

    // Toggle chat window visibility
    chatIcon.addEventListener('click', () => {
        chatWindow.style.display = chatWindow.style.display === 'none' ? 'block' : 'none';
    });

    clearIcon.addEventListener('click', () => {
        const confirmed = confirm(`Do you want to delete all chat data?`);
        if (confirmed) {
            const userName = localStorage.getItem('userName');
            localStorage.clear();
            if (userName) localStorage.setItem('userName', userName); // Restore username
        }
    });

    // Temporary data entry for userName 
    userNameBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const userName = userNameInput.value.trim();
        if (userName) {
            localStorage.setItem('userName', userName); 
            socket.emit('setUsername', userName); // Send username to server
            userNameInput.value = ''; 
        }
    });

    // Load messages from localStorage
    function loadMessages() {
        const messages = JSON.parse(localStorage.getItem('chatMessages')) || {};
        const userName = localStorage.getItem('userName') || 'Anonymous'; // Fallback if no username

        messageContainer.innerHTML = ''; // Clear the message container
        if (messages[currentChat]) {
            messages[currentChat].forEach(data => {
                const msgDiv = document.createElement('div');
                msgDiv.className = 'message';

                // Create the message content
                const messageContent = document.createElement('div');
                messageContent.textContent = data.message;

                // Create sender info (name and timestamp)
                const senderInfo = document.createElement('div');
                senderInfo.className = 'senderInfo';
                senderInfo.textContent = `${data.sender} - ${data.timestamp}`;
                senderInfo.style.fontSize = 'small';
                senderInfo.style.fontStyle = 'italic';
                senderInfo.style.alignSelf = 'flex-end';

                msgDiv.appendChild(messageContent);
                msgDiv.appendChild(senderInfo);

                // Style based on username
                msgDiv.style.alignSelf = data.sender === userName ? 'flex-end' : 'flex-start';
                msgDiv.style.backgroundColor = data.sender === userName ? 'rgb(0,64,128)' : 'rgb(91, 147, 193)';
                msgDiv.style.color = 'white';
                if (data.source === 'SYSTEM') {
                    msgDiv.style.alignSelf = 'center';
                    msgDiv.style.backgroundColor = '#90EE90';
                    msgDiv.style.color = 'black'
                }

                messageContainer.appendChild(msgDiv);
                messageContainer.scrollTop = messageContainer.scrollHeight;
            });
        }
    }


    // Handle message sending (Private or Broadcast)
    sendMessageBtn.addEventListener('click', () => {
        if (messageInput.value.trim()) {
            const userName = localStorage.getItem('userName') || 'Anonymous';

            // Create a messageInput div for sending
            const msgDiv = document.createElement('div');
            msgDiv.className = 'message';
            msgDiv.textContent = messageInput.value.trim();

            // Default position is to the right when user sends message
            msgDiv.style.alignSelf = 'flex-end';
            msgDiv.style.backgroundColor = 'var(--main-bg-color)';
            msgDiv.style.color = 'white';

            const messageData = {
                sender: userName, // Use username
                message: messageInput.value,
                timestamp: new Date().toLocaleTimeString(),
                source: 'SENDING',
                room: currentChat
            };

            const senderInfo = document.createElement('div');
            senderInfo.className = 'senderInfo';
            senderInfo.textContent = `${messageData.timestamp}`;
            senderInfo.style.fontSize = 'small';
            senderInfo.style.fontStyle = 'italic';
            senderInfo.style.alignSelf = 'flex-end';
            senderInfo.style.padding = '0';

            // Append to main messageContainer
            messageContainer.appendChild(msgDiv);
            msgDiv.appendChild(senderInfo);

            socket.emit('chatMessage', {
                sender: messageData.sender,
                message: messageData.message,
                timestamp: messageData.timestamp,
                source: messageData.source,
                room: messageData.room
            });

            saveMessages(messageData);
            messageInput.value = '';
            const isScrolledToBottom = messageContainer.scrollHeight - messageContainer.clientHeight <= messageContainer.scrollTop + 1;
            if (isScrolledToBottom) {
                messageContainer.scrollTop = messageContainer.scrollHeight;
            }            

        }
    });   
    messageInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            sendMessageBtn.click();
            event.preventDefault(); // Prevent form submission, if any
        }
    });

    // Listen for incoming messages in real-time
    socket.on('chatMessage', (data) => {
        console.log('Received chatMessage:', data);
        const userName = localStorage.getItem('userName') || 'Anonymous';

        // (data.room === currentChat &&  (data.source === 'SYSTEM' || data.sender !== userName))        
        // ((data.room === currentChat && data.sender !== userName) || 
        //     (data.room === currentChat && data.source === 'SYSTEM') )

        if (data.room === currentChat &&  (data.source === 'SYSTEM' || data.sender !== userName)) {
            // Create a messageInput div for receiving
            const msgDiv = document.createElement('div');
            msgDiv.className = 'message';

            const messageContent = document.createElement('div');
            messageContent.textContent = data.message;

            const senderInfo = document.createElement('div');
            senderInfo.className = 'senderInfo';
            senderInfo.textContent = `${data.sender} - ${data.timestamp}`;
            senderInfo.style.fontSize = 'small';
            senderInfo.style.fontStyle = 'italic';
            senderInfo.style.alignSelf = 'flex-end';

            msgDiv.appendChild(messageContent);
            msgDiv.appendChild(senderInfo);

            msgDiv.style.alignSelf = 'flex-start';
            msgDiv.style.backgroundColor = 'var(--second-bg-color)';
            msgDiv.style.color = 'white'

            if (data.source === 'SYSTEM') {
                msgDiv.style.alignSelf = 'center';
                msgDiv.style.backgroundColor = '#90EE90';
                msgDiv.style.color = 'black'
            }

            saveMessages(data);
            messageContainer.appendChild(msgDiv);
            const isScrolledToBottom = messageContainer.scrollHeight - messageContainer.clientHeight <= messageContainer.scrollTop + 1;
            if (isScrolledToBottom) {
                messageContainer.scrollTop = messageContainer.scrollHeight;
            }            
        }
    });

    // save messages to localStorage
    function saveMessages(data) {
        let messages = JSON.parse(localStorage.getItem('messages') || '[]');
        messages.push(data);
        localStorage.setItem('messages', JSON.stringify(messages));
    }

    // save messages to localStorage
    // function saveMessages() {
    //     const messages = JSON.parse(localStorage.getItem('chatMessages')) || {};
    //     const userName = localStorage.getItem('userName') || 'Anonymous';
    //     const messageData = {
    //         sender: userName, // Use username
    //         message: messageInput.value, //inputted message
    //         timestamp: new Date().toLocaleTimeString(),
    //         source: messages.source,
    //         room: currentChat,
    //     };

    //     if (!messages[currentChat]) {
    //         messages[currentChat] = [];
    //     }

    //     messages[currentChat].push(messageData);
    //     localStorage.setItem('chatMessages', JSON.stringify(messages));
    // }    



    // Handle chat selection change (room selection)
    chatSelector.addEventListener('change', (e) => {
        currentChat = e.target.value;
        socket.emit('joinRoom', currentChat);
        loadMessages();
    });

    // Listen for user list updates
    socket.on('userList', (users) => {
        console.log('Received userList:', users);
        updateChatSelector(users);
    });

    // Update chat selector with users and groups
    function updateChatSelector(users) {
        chatSelector.innerHTML = ''; // Clear existing options

        // Add group option (static or dynamic if needed)
        const groupOption = document.createElement('option');
        groupOption.value = 'group';
        groupOption.textContent = 'Fam Bam';
        chatSelector.appendChild(groupOption);

        // Add user options
        users.forEach(({ userName, room }) => {
            if (userName !== localStorage.getItem('userName')) { // Exclude current user
                const option = document.createElement('option');
                option.value = userName; // Use userName as value for direct messages
                option.textContent = userName;
                chatSelector.appendChild(option);
            }
        });

        // Restore currentChat if it still exists
        if (currentChat && chatSelector.querySelector(`option[value="${currentChat}"]`)) {
            chatSelector.value = currentChat;
        } else {
            currentChat = chatSelector.value || 'group'; // Default to group or first option
        }
    }    

    // Initial load of messages
    socket.on('connect', () => {
        loadMessages(); // Call loadMessages after connection
    });    

});    

    // function getClientId() {
    //     let clientId = localStorage.getItem('clientId');
    //     if (!clientId) {
    //         clientId = 'client_' + Math.random().toString(36).substr(2, 9); // Random ID
    //         localStorage.setItem('clientId', clientId);
    //     }
    //     return clientId;
    // }    

    // // Listen for private messages
    // socket.on('privateMessage', (data) => {
    //     if (data.receiverId === socket.id) {
    //         const msgDiv = document.createElement('div');
    //         msgDiv.className = 'message';

    //         // Display private message
    //         const messageContent = document.createElement('div');
    //         messageContent.textContent = `Private from ${data.sender}: ${data.message}`;

    //         const senderInfo = document.createElement('div');
    //         senderInfo.className = 'senderInfo';
    //         senderInfo.textContent = `${data.sender} - ${data.timestamp}`;

    //         msgDiv.appendChild(messageContent);
    //         msgDiv.appendChild(senderInfo);

    //         msgDiv.style.alignSelf = 'flex-start';
    //         msgDiv.style.backgroundColor = 'rgb(255, 99, 71)';  // Private message color
    //         msgDiv.style.color = 'white';

    //         messageContainer.appendChild(msgDiv);
    //     }
    // });

    // // Listen for broadcast messages
    // socket.on('broadcastMessage', (data) => {
    //     const msgDiv = document.createElement('div');
    //     msgDiv.className = 'message';

    //     // Display broadcast message
    //     const messageContent = document.createElement('div');
    //     messageContent.textContent = `Broadcast from ${data.sender}: ${data.message}`;

    //     const senderInfo = document.createElement('div');
    //     senderInfo.className = 'senderInfo';
    //     senderInfo.textContent = `${data.sender} - ${data.timestamp}`;

    //     msgDiv.appendChild(messageContent);
    //     msgDiv.appendChild(senderInfo);

    //     msgDiv.style.alignSelf = 'flex-start';
    //     msgDiv.style.backgroundColor = 'rgb(91, 147, 193)';  // Broadcast message color
    //     msgDiv.style.color = 'white';

    //     messageContainer.appendChild(msgDiv);
    // });
    



