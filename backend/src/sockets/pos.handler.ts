import { Server } from 'socket.io';
import { logger } from '../config/logger';
import { AuthenticatedSocket } from '../middlewares/socketAuth';

export function registerPosHandlers(_io: Server, socket: AuthenticatedSocket): void {
  const user = socket.user;
  if (!user) {
    logger.warn({ socketId: socket.id }, 'Unauthorized POS connection attempt');
    socket.disconnect();
    return;
  }

  socket.on('pos:join', (sessionId: string) => {
    socket.join(`session:${sessionId}`);
    logger.info({ socketId: socket.id, userId: user.staffId, sessionId }, 'POS/TAS joined session room');
  });

  socket.on('pos:leave', (sessionId: string) => {
    socket.leave(`session:${sessionId}`);
    logger.info({ socketId: socket.id, userId: user.staffId, sessionId }, 'POS/TAS left session room');
  });
}
