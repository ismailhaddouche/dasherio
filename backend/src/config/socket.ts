import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { logger } from './logger';
import { registerKdsHandlers } from '../sockets/kds.handler';
import { registerPosHandlers } from '../sockets/pos.handler';
import { socketAuthMiddleware, AuthenticatedSocket } from '../middlewares/socketAuth';

let io: SocketServer;

// Build allowed origins for Socket.IO
function getAllowedOrigins(): string[] {
  const origins: string[] = [];
  
  if (process.env.FRONTEND_URL) {
    const frontendUrl = process.env.FRONTEND_URL;
    origins.push(frontendUrl);
    
    // Also add variant without :80 port
    if (frontendUrl.includes(':80')) {
      origins.push(frontendUrl.replace(':80', ''));
    }
    // Also add variant with :80 port
    const urlWithoutPort = frontendUrl.replace(/:\d+$/, '');
    origins.push(`${urlWithoutPort}:80`);
  } else {
    origins.push('http://localhost:4200');
  }
  
  return origins;
}

export function initSocket(httpServer: HttpServer): SocketServer {
  const allowedOrigins = getAllowedOrigins();
  logger.info({ allowedOrigins }, 'Socket.IO CORS origins');
  
  io = new SocketServer(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
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
