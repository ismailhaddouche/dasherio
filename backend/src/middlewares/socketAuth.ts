import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { JwtPayload } from './auth';

export interface AuthenticatedSocket extends Socket {
  user?: JwtPayload;
}

export function socketAuthMiddleware(socket: AuthenticatedSocket, next: (err?: Error) => void): void {
  const token = socket.handshake.auth.token as string | undefined;

  if (!token) {
    return next(new Error('AUTHENTICATION_REQUIRED'));
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return next(new Error('SERVER_CONFIGURATION_ERROR'));
  }

  try {
    const payload = jwt.verify(token, jwtSecret) as JwtPayload;
    socket.user = payload;
    next();
  } catch {
    next(new Error('INVALID_TOKEN'));
  }
}
