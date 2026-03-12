import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let io = null;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // In production, restrict to your frontend URL
      methods: ['GET', 'POST'],
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_default_secret_key');
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] User connected: ${socket.user.username} (${socket.user.role})`);

    // Join room for their role
    socket.join(`role:${socket.user.role}`);
    
    // Join room for their specific user ID
    socket.join(`user:${socket.user.id}`);

    socket.on('disconnect', () => {
      console.log(`[Socket] User disconnected: ${socket.user.username}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

/**
 * Sends a notification to a specific user.
 */
export const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

/**
 * Sends a notification to all users with a specific role.
 */
export const emitToRole = (role, event, data) => {
  if (io) {
    io.to(`role:${role}`).emit(event, data);
  }
};

/**
 * Broadcasts a notification to everyone.
 */
export const broadcast = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};
