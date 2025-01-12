import React, { useState, useEffect, useRef } from "react";

export const Chat = ({ socket, username, room }) => {
  const [currentMessage, setcurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const [typingUser, setTypingUser] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]); 
  const typingTimeoutRef = useRef(null);

  const sendMessage = async () => {
    if (currentMessage !== "") {
      const messageData = {
        room,
        author: username,
        message: currentMessage,
        time:
          (new Date(Date.now()).getHours() % 12 || 12) +
          ":" +
          new Date(Date.now()).getMinutes(),
      };

      await socket.emit("send_message", messageData);
      setMessageList((list) => [...list, messageData]);
      setcurrentMessage("");
      socket.emit("stop_typing", { room, username });
    }
  };

  const handleTyping = (e) => {
    setcurrentMessage(e.target.value);

    if (!isTyping) {
      setIsTyping(true);
      socket.emit("typing", { room, username });
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit("stop_typing", { room, username });
    }, 2000);
  };

  useEffect(() => {
    socket.emit("join_room", { room, username });

    const handleChatHistory = (messages) => {
      setMessageList(messages);
    };

    const handleReceiveMsg = (data) => {
      console.log("recieved message : ", data)
      setMessageList((list) => [...list, data]);
    };

    const handleUserTyping = (data) => {
      setTypingUser(data.username);
    };

    const handleUserStoppedTyping = () => {
      setTypingUser(null);
    };

    const handleActiveUsers = (users) => {
      console.log("active users : ", users)
      setActiveUsers(users);
    };

    socket.on("chat_history", handleChatHistory);
    socket.on("receive_message", handleReceiveMsg);
    socket.on("user_typing", handleUserTyping);
    socket.on("user_stopped_typing", handleUserStoppedTyping);
    socket.on("update_active_users", handleActiveUsers);

    return () => {
      socket.off("chat_history", handleChatHistory);
      socket.off("receive_message", handleReceiveMsg);
      socket.off("user_typing", handleUserTyping);
      socket.off("user_stopped_typing", handleUserStoppedTyping);
      socket.off("update_active_users", handleActiveUsers);
    };
  }, [socket]);

  const containRef = useRef(null);

  useEffect(() => {
    containRef.current.scrollTop = containRef.current.scrollHeight;
  }, [messageList]);

  return (
    <div className="chat_container">
      <h1>Welcome {username}</h1>
      <div className="chat_box">
        <div
          className="auto-scrolling-div"
          ref={containRef}
          style={{
            height: "450px",
            overflowY: "auto",
            border: "2px solid yellow",
          }}
        >
          {messageList.map((data, index) => (
            <div
              key={index}
              className="message_content"
              id={username === data.author ? "you" : "other"}
            >
              <div className="user-logo-container">
                <div className="user-logo">
                  {data.author.charAt(0).toUpperCase()}
                  {activeUsers.includes(data.author) && (
                    <span
                      className={`active-dot ${data.author === 'LiaPlus' ? 'green-dot' : ''}`}
                    ></span>
                  )}
                </div>
              </div>
              <div className="message-body">
                <p className="msg">{data.message}</p>
                <div className="msg_detail">
                  <span>{data.time}</span>
                  <span>{data.author}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        {typingUser && typingUser !== username ? (
          <div className="typing-indicator">{typingUser} is typing...</div>
        ) : null}
        <div className="chat_body">
          <input
            value={currentMessage}
            type="text"
            placeholder="Type Your Message"
            onChange={handleTyping}
            onKeyPress={(e) => {
              e.key === "Enter" && sendMessage();
            }}
          />
          <button onClick={sendMessage}>&#9658;</button>
        </div>
      </div>
    </div>
  );
};
