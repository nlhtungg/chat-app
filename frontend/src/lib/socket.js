import { io } from 'socket.io-client';

// Determine the socket URL based on environment
const SOCKET_URL = import.meta.env.PROD 
  ? window.location.origin 
  : 'http://localhost:5001';

// Create socket connection with auth
export const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
});

// Connect socket with user ID
export const connectSocket = (userId) => {
  if (socket.connected) {
    socket.disconnect();
  }
  
  // Attach userId to handshake query
  socket.auth = { userId };
  socket.io.opts.query = { userId };
  socket.connect();
};

// Disconnect socket
export const disconnectSocket = () => {
  socket.disconnect();
};

// For debugging
socket.on('connect', () => {
  console.log('Socket connected:', socket.id);
});

socket.on('disconnect', () => {
  console.log('Socket disconnected');
});
