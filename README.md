# Real-Time Chat Application with AI Integration

This is a real-time chat application where users can send messages in rooms. It includes an AI assistant (`Lia`) that can generate funny and roasting responses to messages. The application is built using **Socket.io**, **Express**, **MongoDB**, and integrates with the **Together AI** service to generate AI responses.

## Features

- Real-time messaging with users in a shared room.
- Active user management per room.
- AI-powered responses from "Lia" based on chat history.
- Typing indicators for active users.
- Message history retrieval upon joining a room.

## Installation

### 1. Clone the repository

git clone https://github.com/shivamsince0502/LiaChat.git
cd LiaChat

2. Install dependencies
bash
## for backend : 
cd Server
npm install

## for frontend :
cd Client
npm install

## for server start : 
cd Server
npm start

## for frontend start : 
cd Client
npm run dev

## to chat with lia plese use @Lia or @lia in the message

Socket Events
join_room: Event triggered when a user joins a room.
send_message: Event triggered when a user sends a message.
receive_message: Event triggered when a message is received in the room (including AI responses).
typing: Event triggered when a user starts typing.
stop_typing: Event triggered when a user stops typing.
update_active_users: Event triggered to update the list of active users in the room.
Technologies Used
Socket.io: For real-time communication between the server and clients.
Express: For the backend server.
MongoDB: For storing room data, messages, and active users.
Together AI API: For generating AI responses in the chat.
