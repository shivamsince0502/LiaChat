import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import http from "http";
import connectDB from "./config/db.js";
import { RoomChat, Message } from "./model/models.js";
import bodyParser from 'body-parser';
import togetherClient from './config/togetherClient.js';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(bodyParser.json());
app.use(express.static('public'));

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "PUT"],
  },
});

connectDB();

const activeUsers = {}; 
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join_room", async (data) => {
    try {
      console.log("User joined room:", data);

      socket.username = data.username;
      socket.room = data.room;

      socket.join(data.room);

      if (!activeUsers[data.room]) {
        activeUsers[data.room] = {};
      }
      activeUsers[data.room][data.username] = true;

      console.log("Active users:", activeUsers[data.room]);

      io.to(data.room).emit("update_active_users", Object.keys(activeUsers[data.room]));

      const room = await RoomChat.findOneAndUpdate(
        { roomName: data.room },
        { $addToSet: { activeUsers: data.username } },
        { new: true, upsert: true }
      );

      console.log("Room data after user join:", room);

      const messages = await Message.find({ room: data.room }).sort({ _id: 1 });

      socket.emit("chat_history", messages);
    } catch (err) {
      console.error("Error handling join_room:", err);
    }
  });

  socket.on("send_message", async (data) => {
    try {
      console.log("Send message data:", data);

      const newMessage = await Message.create({
        room: data.room,
        author: data.author,
        message: data.message,
        time: data.time,
      });
      console.log("New message created:", newMessage);

      socket.to(data.room).emit("receive_message", data);

      if (data.message.includes('@Lia') || data.message.includes('@lia')) {

        const chatHistory = await Message.find({ room: data.room }).sort({ _id: 1 });
        try {

          const aiResponse = await getAIResponse(data.message, chatHistory.map(msg => msg.message).join(" "));
          console.log("ai response : ", aiResponse)
          const aiMessage = {
            room: data.room,
            author: 'Lia',
            message: aiResponse,
            time: data.time,
          };
          

          const aiMessageRecord = await Message.create(aiMessage);


          await RoomChat.findOneAndUpdate(
            { roomName: data.room },
            { $push: { messages: aiMessageRecord._id } },
            { new: true }
          );

          console.log("AI message created:", aiMessageRecord);
          if (!activeUsers[data.room]) {
            activeUsers[data.room] = {};
          }
          activeUsers[data.room]['Lia'] = true; 


          socket.to(data.room).emit("update_active_users", Object.keys(activeUsers[data.room]));

          io.to(data.room).emit("receive_message", aiMessage);  
          
        } catch (error) {
          console.error('Error with AI response:', error);
        }
      }


      const updatedRoom = await RoomChat.findOneAndUpdate(
        { roomName: data.room },
        { $push: { messages: newMessage._id } },
        { new: true }
      );

    } catch (err) {
      console.error("Error handling send_message:", err);
    }
  });

  socket.on("typing", (data) => {
    console.log(`${data.username} is typing in room ${data.room}`);
    socket.to(data.room).emit("user_typing", { username: data.username });
  });

  socket.on("stop_typing", (data) => {
    console.log(`${data.username} stopped typing in room ${data.room}`);
    socket.to(data.room).emit("user_stopped_typing", { username: data.username });
  });

  socket.on("disconnect", async () => {
    console.log("User disconnected:", socket.id);

    if (socket.room && socket.username && activeUsers[socket.room]) {
      delete activeUsers[socket.room][socket.username];
      console.log(`Removed user ${socket.username} from active users in room ${socket.room}`);

      io.to(socket.room).emit("update_active_users", Object.keys(activeUsers[socket.room]));

      await RoomChat.findOneAndUpdate(
        { roomName: socket.room },
        { $pull: { activeUsers: socket.username } }
      );
    }
  });
});


async function getAIResponse(prompt, chat_history) {
  try {
    const chatCompletion = await togetherClient.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an AI assistant in a chat app. You have to generate the reply to this message given to you based on this chat history: ' + chat_history + '. Keep the reply funny and roasting based on the chat history. Keep the reply as small as possible and the response should not contain any special characters or other symbols. The response should be totally natural language and look like human response with less than 10 words.'
        },
        {
          role: 'user',
          content: prompt
        },
      ],
      model: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo'
    });

    console.log("AI response:", chatCompletion?.choices);

    return chatCompletion?.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
  } catch (error) {
    console.error('Error querying Together AI:', error);
    return 'There was an error generating a response.';
  }
}

app.use(cors());

server.listen(process.env.SERVER_PORT, () => console.log("Server is running on port 3000"));
