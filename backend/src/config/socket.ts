import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { logger } from './logger';
import { registerKdsHandlers } from '../sockets/kds.handler';
import { registerPosHandlers } from '../sockets/pos.handler';
import { socketAuthMiddleware, AuthenticatedSocket } from '../middlewares/socketAuth';

let io: SocketServer;

export function initSocket(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:4200',
      methods: ['GET', 'POST'],
    },
  });

  // Apply authentication middleware to all connections
  io.use(socketAuthMiddleware);

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info({ socketId: socket.id, userId: socket.user?.staffId }, 'Client connected');

    registerKdsHandlers(io, socket);
    registerPosHandlers(io, socket);

    socket.on('disconnect', () => {
      logger.info({ socketId: socket.id, userId: socket.user?.staffId }, 'Client disconnected');
    });
  });

  return io;
}

export function getIO(): SocketServer {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}
