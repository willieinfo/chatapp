document.addEventListener('DOMContentLoaded', () => {
    const chatIcon = document.querySelector('.chatIcon');
    const chatWindow = document.querySelector('.chatWindow');
    const messageContainer = document.getElementById('messageContainer');
    const messageInput = document.getElementById('messageInput');
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    const chatSelector = document.getElementById('chatSelector');
    
    const userNameBtn = document.getElementById('userNameBtn');
    const userNameInput = document.getElementById('userNameInput')

    const userNameForm = document.querySelector('.userNameForm');   
    const userNameDiv = document.querySelector('.userNameDiv');   

    const socket = io('http://localhost:3000'); // Connect to the correct server

    let currentChat = null; // Track the currently selected room/user
    const userName = localStorage.getItem('userName') || null;
    userNameDiv.innerHTML = userName ? `${userName} Chat Box`: ''

    userNameForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const userName = userNameInput.value.trim();
        console.log('userName: '.userName)
        if (userName) {
            localStorage.setItem('userName', userName);
            // socket.emit('joinRoom', { room: 'Default', userName }); // Join a default room
            userNameForm.style.display = 'none'; // Hide form after submission
            chatSelector.disabled = false; // Enable chat selector
            userNameDiv.innerHTML = userName ? `${userName} Chat Box`: ''
        }

        const room = chatSelector.value;  // Get the selected room
        console.log(userName,room)
        if (userName && room) {
            // Emit the joinRoom event to the backend with userName and room
            socket.emit('joinRoom', { userName, room });
        }        
    });

    // Handle chat selection
    chatSelector.addEventListener('change', (e) => {
        currentChat = e.target.value;
        messageContainer.innerHTML = ''; // Clear messages when switching chats

        if (currentChat && userName) {
            socket.emit('joinRoom', { userName, room: currentChat });
        }        

        loadMessages(currentChat); // Load saved messages for the selected chat
    });    

    // Toggle chat window visibility
    chatIcon.addEventListener('click', () => {
        chatWindow.style.display = chatWindow.style.display === 'none' ? 'block' : 'none';
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

    function loadMessages(room = 'Default') {
        const messages = JSON.parse(localStorage.getItem(`chatMessages_${room}`) || '[]');
        // const userName = localStorage.getItem('userName')
        messageContainer.innerHTML = '';
        messages.forEach((data) => {
            const msgDiv = document.createElement('div');
            msgDiv.className = 'message';
            msgDiv.style.alignSelf = data.sender === userName ? 'flex-end' : 'flex-start';
            msgDiv.style.textAlign = data.sender === userName ? 'left' : 'right';
            msgDiv.style.backgroundColor = data.sender === userName ? 'var(--main-bg-color)' : 'var(--second-bg-color)';
            msgDiv.style.color = 'white';

            if (data.source === 'SYSTEM' && data.sender !== userName) {
                msgDiv.style.alignSelf = 'center';
                msgDiv.style.backgroundColor = data.message.includes('left') ? 'rgba(255, 0, 0, 0.7)' : '#90EE90';
                msgDiv.style.color = 'black';
            }

            const messageContent = document.createElement('div');
            messageContent.textContent = data.message;

            const senderInfo = document.createElement('div');
            senderInfo.className = 'senderInfo';
            senderInfo.textContent = `${data.sender} - ${data.timestamp}`;
            senderInfo.style.alignSelf = data.sender === userName ? 'flex-start' : 'flex-end';
            senderInfo.style.textAlign = data.sender === userName ? 'right' : 'left';

            msgDiv.appendChild(messageContent);
            msgDiv.appendChild(senderInfo);
            messageContainer.appendChild(msgDiv);
            // messageContainer.appendChild(senderInfo);
        });
        messageContainer.scrollTop = messageContainer.scrollHeight;
    }

    // Initialize: Check if userName exists
    if (userName) {
        // userNameForm.style.display = 'none';
        socket.emit('joinRoom', { userName, room: 'Default' });
        // chatSelector.disabled = false;
    } else {
        socket.emit('joinRoom', { sender:'Anonymous', room: 'Default' });
        // chatSelector.disabled = true; // Disable until username is set
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
            msgDiv.style.textAlign = 'end';
            msgDiv.style.backgroundColor = 'var(--main-bg-color)';
            msgDiv.style.color = 'white';

            const messageData = {
                sender: userName, // Use username
                message: messageInput.value,
                timestamp: formatDateTimeNow(),
                source: 'SENDING',
                room: currentChat
            };

            const senderInfo = document.createElement('div');
            senderInfo.className = 'senderInfo';
            senderInfo.textContent = `${messageData.timestamp}`;
            senderInfo.style.alignSelf = 'flex-end';
            senderInfo.style.textAlign = 'right';

            // Append to main messageContainer
            messageContainer.appendChild(msgDiv);
            msgDiv.appendChild(senderInfo);
            // messageContainer.appendChild(senderInfo);

            socket.emit('chatMessage', {
                sender: messageData.sender,
                message: messageData.message,
                timestamp: messageData.timestamp,
                source: messageData.source,
                room: messageData.room
            });

            saveMessages(messageData, currentChat);
            messageInput.value = '';
            messageContainer.scrollTop = messageContainer.scrollHeight;

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

        if (data.room === currentChat &&  (data.source === 'SYSTEM' || data.sender !== userName)) {
            // Create a messageInput div for receiving
            const msgDiv = document.createElement('div');
            msgDiv.className = 'message';

            const messageContent = document.createElement('div');
            messageContent.textContent = data.message;

            const senderInfo = document.createElement('div');
            senderInfo.className = 'senderInfo';
            senderInfo.textContent = `${data.sender} - ${data.timestamp}`;
            senderInfo.style.alignSelf = 'flex-start';
            senderInfo.style.textAlign = 'left';

            msgDiv.appendChild(messageContent);
            msgDiv.appendChild(senderInfo);

            msgDiv.style.alignSelf = 'flex-start';
            msgDiv.style.textAlign = 'start';
            msgDiv.style.backgroundColor = 'var(--second-bg-color)';
            msgDiv.style.color = 'white'

            if (data.source === 'SYSTEM' && data.sender !== userName) {
                msgDiv.style.alignSelf = 'center';
                msgDiv.style.backgroundColor = data.message.includes('left') ? 'rgba(255, 0, 0, 0.7)' : '#90EE90';
                msgDiv.style.color = 'black'
            }

            saveMessages(data,data.room);
            messageContainer.appendChild(msgDiv);
            // messageContainer.appendChild(senderInfo);
            messageContainer.scrollTop = messageContainer.scrollHeight;
        }
    });

    // save messages to localStorage
    function saveMessages(data,room) {
        let messages = JSON.parse(localStorage.getItem(`chatMessages_${room}`) || '[]');
        messages.push(data);
        localStorage.setItem(`chatMessages_${room}`, JSON.stringify(messages));
    }

    // Listen for user list updates
    socket.on('userList', (users) => {
        console.log('Received userList:', users);
        updateChatSelector(users);
    });

    // Update chat selector with users and groups
    function updateChatSelector(users) {
        chatSelector.innerHTML = ''; // Clear existing options

        // Add group option (static or dynamic if needed)
        const option1 = document.createElement('option');
        option1.value = 'Default';
        option1.textContent = 'Default';
        chatSelector.appendChild(option1);

        // Add user options
        users.forEach(({ userName, room }) => {
            // Add room to the chatSelector list
            const existingOption = [...chatSelector.options].find(option => option.value === room);

            // If the option does not exist, create and append it
            if (!existingOption) {
                const option = document.createElement('option');
                option.value = room;  // Make room the value for the option
                option.textContent = userName;
                chatSelector.appendChild(option);
            }        

        });

        // Restore currentChat if it still exists
        if (currentChat && chatSelector.querySelector(`option[value="${currentChat}"]`)) {
            chatSelector.value = currentChat;
        } else {
            currentChat = chatSelector.value || 'Default'; // Default to default or first option
        }

        //  localStorage.setItem('chatOptions', JSON.stringify(users))

    }

    // window.addEventListener('DOMContentLoaded', () => {
    //     const savedOptions = localStorage.getItem('chatOptions');
    //     if (savedOptions) {
    //         const users = JSON.parse(savedOptions);
    //         updateChatSelector(users);  // Populate the selector with saved options
    //     } else {
    //         // Fetch options from the server or use default behavior
    //         // fetchUsersFromServer();
    //     }
    // });

    // function updateChatSelector(users) {
    //     chatSelector.innerHTML = ''; // Clear existing options

    //     // Add group option (static or dynamic if needed)
    //     const option1 = document.createElement('option');
    //     option1.value = 'Default';
    //     option1.textContent = 'Default';
    //     chatSelector.appendChild(option1);

    //     // Add user options
    //     users.forEach(({ userName, room }) => {
            
    //         // if (userName !== localStorage.getItem('userName')) return
    //         const option = document.createElement('option');
    //         option.value = userName; // Use userName as value for direct messages
    //         option.textContent = userName;
    //         chatSelector.appendChild(option);

    //     });

    //     // Restore currentChat if it still exists
    //     if (currentChat && chatSelector.querySelector(`option[value="${currentChat}"]`)) {
    //         chatSelector.value = currentChat;
    //     } else {
    //         currentChat = chatSelector.value || 'Default'; // Default to default or first option
    //     }
    // }    

    // Handle an error event 
    socket.on('error', (error) => {
        console.error('Socket error:', error);
        // Log the error, notify the user, or take corrective action
    })    

    // Initial load of messages
    socket.on('connect', () => {
        loadMessages(); // Call loadMessages after connection
    });    

});    

function formatDateTimeNow() {
    const date = new Date();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Get month and pad with 0
    const day = String(date.getDate()).padStart(2, '0'); // Get day and pad with 0
    const year = date.getFullYear();
    const time = new Date().toLocaleTimeString();
    return `${month}/${day}/${year} ${time}`; 
};

// Client-Side API Overview
// The client-side Socket.IO API provides methods for:

// io() - Connects to the server
// socket.emit() - Sends an event to the server
// socket.on() - Listens for events from the server
// socket.disconnect() - Disconnects from the server
// Socket.IO Events
// Socket.IO uses an event-based architecture for communication. Here are some key events:

// Built-in Events
// connect - Fired upon connection
// disconnect - Fired upon disconnection
// error - Fired upon an error
// reconnect - Fired upon successful reconnection
// reconnect_attempt - Fired upon reconnection attempt
