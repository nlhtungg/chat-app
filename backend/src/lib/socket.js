import { Server } from "socket.io";
import http from "http";
import express from "express";
import { handleCallAccepted, handleCallRejected, handleCallEnded } from "../controllers/videocall.controller.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === "production" 
      ? true  // Allow requests from the same origin in production
      : ["http://localhost:5173"],
    credentials: true,
  },
});

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// used to store online users
const userSocketMap = {}; // {userId: socketId}

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;

  // io.emit() is used to send events to all the connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // WebRTC signaling
  socket.on("offerSignal", ({ callId, signal, to }) => {
    const receiverSocketId = userSocketMap[to];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("offerSignal", {
        callId,
        signal,
        from: userId
      });
    }
  });

  socket.on("answerSignal", ({ callId, signal, to }) => {
    const receiverSocketId = userSocketMap[to];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("answerSignal", {
        callId,
        signal,
        from: userId
      });
    }
  });

  socket.on("iceCandidate", ({ callId, candidate, to }) => {
    const receiverSocketId = userSocketMap[to];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("iceCandidate", {
        callId,
        candidate,
        from: userId
      });
    }
  });

  // Call management events
  socket.on("callAccepted", ({ callId }) => {
    const call = handleCallAccepted(callId, userId);
    if (call) {
      const callerSocketId = userSocketMap[call.callerId];
      if (callerSocketId) {
        io.to(callerSocketId).emit("callAccepted", { callId });
      }
    }
  });

  socket.on("callRejected", ({ callId }) => {
    const call = handleCallRejected(callId, userId);
    if (call) {
      const callerSocketId = userSocketMap[call.callerId];
      if (callerSocketId) {
        io.to(callerSocketId).emit("callRejected", { callId });
      }
    }
  });

  socket.on("endCall", ({ callId }) => {
    const call = handleCallEnded(callId, userId);
    if (call) {
      // Notify the other participant
      const otherUserId = call.callerId === userId ? call.receiverId : call.callerId;
      const otherUserSocketId = userSocketMap[otherUserId];
      
      if (otherUserSocketId) {
        io.to(otherUserSocketId).emit("callEnded", { callId });
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };