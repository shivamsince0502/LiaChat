import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  room: { type: String, required: true }, 
  author: { type: String, required: true }, 
  message: { type: String, required: true }, 
  time: { type: String, required: true }, 
});

const roomChatSchema = new mongoose.Schema({
  roomName: { type: String, required: true, unique: true }, 
  messages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }], 
  activeUsers: [{ type: String }], 
});

const Message = mongoose.model('Message', messageSchema);
const RoomChat = mongoose.model('RoomChat', roomChatSchema);

export { Message, RoomChat };
