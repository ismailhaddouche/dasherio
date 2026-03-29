import { Server } from 'socket.io';
import { logger } from '../config/logger';
import { AuthenticatedSocket } from '../middlewares/socketAuth';
import { createSocketRateLimiter, rateLimitWrapper } from '../middlewares/socketRateLimit';

export function registerPosHandlers(_io: Server, socket: AuthenticatedSocket): void {
  const user = socket.user;
  if (!user) {
    logger.warn({ socketId: socket.id }, 'Unauthorized POS connection attempt');
    socket.disconnect();
    return;
  }

  // Create rate limiter for this socket connection
  const rateLimiter = createSocketRateLimiter();

  socket.on('pos:join', rateLimitWrapper(rateLimiter, socket, 'pos:join', (sessionId: string) => {
    socket.join(`session:${sessionId}`);
    logger.info({ socketId: socket.id, userId: user.staffId, sessionId }, 'POS/TAS joined session room');
  }));

  socket.on('pos:leave', rateLimitWrapper(rateLimiter, socket, 'pos:leave', (sessionId: string) => {
    socket.leave(`session:${sessionId}`);
    logger.info({ socketId: socket.id, userId: user.staffId, sessionId }, 'POS/TAS left session room');
  }));
}
